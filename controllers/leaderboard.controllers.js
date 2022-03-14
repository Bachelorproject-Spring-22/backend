import kahootModel from '../models/kahoot.js';
import courseModel from '../models/course.js';
import studyProgrammeModel from '../models/studyProgramme.js';

const aggregatedQuizScores = async (courseId, variant, name, periodNumber, studyProgrammeCode, yearCode) => {
  if (!variant || !name) {
    return { error: 'Variant and name is required' };
  }

  if (!periodNumber && !studyProgrammeCode && !courseId && !yearCode) {
    return {
      error: 'Provide either a period number and study program code or courseId or study program code and yearCode',
    };
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
        _id: '$finalScores.player',
        totalScore: { $sum: '$finalScores.totalScore' },
        totalCorrect: { $sum: '$finalScores.correctAnswers' },
        totalIncorrectAnswers: { $sum: '$finalScores.incorrectAnswers' },
        quizzesAttended: { $count: {} },
      },
    },
    { $sort: { totalScore: -1 } },
  ]);

  return totalScoreFromKahoots.length === 0
    ? {
        message: `StudyPlan: ${studyProgrammeCode} periodNumber: ${periodNumber}`,
        data: null,
        error: 'No quizzes found',
      }
    : !periodNumber && !studyProgrammeCode
    ? {
        message: `Course(s): ${courseId}`,
        data: { totalQuizzes: ids.length, totalScore: totalScoreFromKahoots },
      }
    : yearCode && studyProgrammeCode
    ? {
        message: `StudyPlan: ${studyProgrammeCode} yearCode: ${yearCode}`,
        data: {
          totalQuizzes: ids.length,
          totalScore: totalScoreFromKahoots,
        },
      }
    : {
        message: `StudyPlan: ${studyProgrammeCode} periodNumber: ${periodNumber}`,
        data: {
          totalQuizzes: ids.length,
          totalScore: totalScoreFromKahoots,
        },
      };
};

export const userLeaderboard = async (req, res) => {
  const user = req.user;

  try {
    res.status(201).json({ message: 'StudyProgramme created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error when creating study programme' });
  }
};
