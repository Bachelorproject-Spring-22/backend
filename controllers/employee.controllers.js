import kahootModel from '../models/kahoot.js';
import courseModel from '../models/course.js';
import studyProgrammeModel from '../models/studyProgramme.js';

import { readDataFromExcel } from '../config/excelToJson.js';

export const quizUpload = async (req, res, next) => {
  const filePath = req.file;
  const courseId = req.body.text;

  if (!filePath) return res.status(400).json({ error: 'Please upload a file' });
  const dataFromExcel = readDataFromExcel(req.file.path);
  if (!dataFromExcel) {
    return res.status(400).json({ error: 'Server error' }); // TODO: Change this error
  }
  const finalScores = dataFromExcel['Final Scores'].map((user) => user);
  const activityIds = [];
  const course = await courseModel.findOne({ courseId });
  course.activities.forEach((kahoot) => {
    if (kahoot.name === 'kahoot' && kahoot.variant === 'quiz') {
      const [kahoots] = kahoot.sources;
      activityIds.push(kahoots);
    }
  });
  const kahoot = new kahootModel({
    title: dataFromExcel['Overview'][0].A,
    playedOn: dataFromExcel['Overview'][1].B,
    hostedBy: dataFromExcel['Overview'][2].B,
    numberOfPlayers: dataFromExcel['Overview'][3].B,
    course: {
      code: course.code,
      name: course.name,
      courseId,
    },
    finalScores,
  });

  const date = new Date(kahoot.playedOn);
  const day = date.getDate();
  const month = date.getMonth();
  const getActivities = await kahootModel.find({ activityIds });

  const createQuizId = `${kahoot.title}-${day}-${month}`;
  const array = [];
  getActivities.forEach((activity) => {
    if (activity.quizId === createQuizId) {
      array.push(activity.quizId);
    }
  });

  if (array.length !== 0) {
    return res.status(400).json({ error: 'Quiz is already uploaded to this course' });
  }

  try {
    await kahoot.save();
    await courseModel.updateOne(
      { courseId },
      { $push: { 'activities.$[activities].sources': kahoot._id } },
      { arrayFilters: [{ 'activities.name': 'kahoot' }] },
    );
    res.status(201).json({ message: 'Quiz uploaded successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error when creating quiz' });
  }
};

// Input
// Required input: variant and name
// Aggregated leaderboard for course: required input + [courseId]
// Aggregated leaderboard for semester: required input + [studyProgrammeCode], periodNumber
// Aggregated leaderboard for year: required input + [studyProgrammeCode], [yearCode]

export const aggregateQuizScores = async (req, res) => {
  const { courseId, variant, name, periodNumber, studyProgrammeCode, yearCode } = req.body;

  if (!variant || !name) {
    return res.status(400).json({ error: 'Variant and name is required' });
  }

  if (!periodNumber && !studyProgrammeCode && !courseId && !yearCode) {
    return res.status(400).json({
      error: 'Provide either a period number and study program code or courseId or study program code and yearCode',
    });
  }

  let findCourse;
  let coursesInPeriod = [];
  if (periodNumber && studyProgrammeCode) {
    const studyProgramme = await studyProgrammeModel.find({ studyProgrammeCode });
    if (!studyProgramme) return res.status(404).json({ error: 'StudyProgramme does not exist' });
    const checkStudyPeriod = await studyProgrammeModel.aggregate([
      { $match: { studyProgrammeCode: { $in: studyProgrammeCode } } },
      { $unwind: '$studyPeriods' },
      { $match: { 'studyPeriods.periodNumber': periodNumber } },
      { $unwind: '$studyPeriods.courses' },
      { $project: { 'studyPeriods.code': 1, 'studyPeriods.courses': 1 } },
    ]);
    checkStudyPeriod.forEach((data) => {
      coursesInPeriod.push(data.studyPeriods.courses);
    });
    findCourse = await courseModel.find({ _id: coursesInPeriod });
  } else if (studyProgrammeCode && yearCode) {
    const checkStudyPeriod = await studyProgrammeModel.aggregate([
      { $match: { studyProgrammeCode: { $in: studyProgrammeCode } } },
      { $unwind: '$studyPeriods' },
      { $match: { $or: [{ 'studyPeriods.periodNumber': periodNumber }, { 'studyPeriods.code': { $in: yearCode } }] } },
      { $unwind: '$studyPeriods.courses' },
      { $project: { 'studyPeriods.code': 1, 'studyPeriods.courses': 1 } },
    ]);
    checkStudyPeriod.forEach((data) => {
      coursesInPeriod.push(data.studyPeriods.courses);
    });
    findCourse = await courseModel.find({ _id: coursesInPeriod });
  } else {
    findCourse = await courseModel.find({ courseId });
  }
  let sources = [];
  findCourse.forEach(({ activities }) => {
    const [activity] = activities;
    if (activity.name === name && activity.variant === variant && activity.sources.length !== 0)
      activity.sources.forEach((source) => sources.push(source));
  });

  const getAllKahootsFromActivity = await kahootModel.find({ _id: sources }, { _id: 1 });

  const ids = getAllKahootsFromActivity.map((doc) => doc._id);
  const totalScoreFromKahoots = await kahootModel.aggregate([
    { $match: { _id: { $in: ids } } },
    { $unwind: '$finalScores' },
    {
      $group: {
        _id: { player: '$finalScores.player' },
        totalScore: { $sum: '$finalScores.totalScore' },
        totalCorrect: { $sum: '$finalScores.correctAnswers' },
        totalIncorrectAnswers: { $sum: '$finalScores.incorrectAnswers' },
        quizzesAttended: { $count: {} },
      },
    },
    { $sort: { totalScore: -1 } },
  ]);

  try {
    totalScoreFromKahoots.length === 0
      ? res.status(201).json({
          message: `StudyPlan: ${studyProgrammeCode} periodNumber: ${periodNumber}`,
          data: null,
          error: 'No quizzes found',
        })
      : !periodNumber && !studyProgrammeCode
      ? res.status(201).json({
          message: `Course(s): ${courseId}`,
          data: { totalQuizzes: ids.length, totalScore: totalScoreFromKahoots },
        })
      : yearCode && studyProgrammeCode
      ? res.status(201).json({
          message: `StudyPlan: ${studyProgrammeCode} yearCode: ${yearCode}`,
          data: {
            totalQuizzes: ids.length,
            totalScore: totalScoreFromKahoots,
          },
        })
      : res.status(201).json({
          message: `StudyPlan: ${studyProgrammeCode} periodNumber: ${periodNumber}`,
          data: {
            totalQuizzes: ids.length,
            totalScore: totalScoreFromKahoots,
          },
        });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error when creating quiz' });
  }
};
