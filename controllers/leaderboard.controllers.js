import kahootModel from '../models/kahoot.js';
import courseModel from '../models/course.js';
import studyProgrammeModel from '../models/studyProgramme.js';
import jwtDecode from 'jwt-decode';

export const semesterLeaderboardAndUserCourses = async (req, res) => {
  const { username } = req.user;
  const headers = req.headers.authorization;
  if (!headers)
    return res.status(401).send({
      error: 'Unauthorized',
    });
  const token = headers.split(' ')[1];
  const { periodNumber, studyProgrammeCode } = jwtDecode(token);
  const name = 'kahoot';
  const variant = 'quiz';

  const studyProgrammeData = await studyProgrammeModel.aggregate([
    { $match: { studyProgrammeCode } },
    { $unwind: '$studyPeriods' },
    { $match: { 'studyPeriods.periodNumber': periodNumber } },
    { $unwind: '$studyPeriods.courses' },
    {
      $lookup: {
        from: 'courses',
        localField: 'studyPeriods.courses',
        foreignField: '_id',
        as: 'coursesInPeriod',
      },
    },
    { $unwind: '$coursesInPeriod' },
    { $unwind: '$coursesInPeriod.activities' },
    {
      $match: { $and: [{ 'coursesInPeriod.activities.name': name, 'coursesInPeriod.activities.variant': variant }] },
    },
    {
      $lookup: {
        from: 'kahoots',
        localField: 'coursesInPeriod.activities.sources',
        foreignField: '_id',
        as: 'kahootsInPeriod',
      },
    },
    { $unwind: '$kahootsInPeriod' },
    { $unwind: '$kahootsInPeriod.finalScores' },
    {
      $group: {
        _id: {
          player: '$kahootsInPeriod.finalScores.player',
          code: '$coursesInPeriod.code',
          name: '$coursesInPeriod.name',
          courseId: '$coursesInPeriod.courseId',
        },
        totalScore: { $sum: '$kahootsInPeriod.finalScores.totalScore' },
        quizzesAttended: { $count: {} },
      },
    },
    { $sort: { totalScore: -1 } },
    { $limit: 5 },
    {
      $group: {
        _id: false,
        course: {
          $push: {
            _id: '$_id.player',
            code: '$_id.code',
            name: '$_id.name',
            courseId: '$_id.courseId',
            totalScore: '$totalScore',
            quizzesAttended: '$quizzesAttended',
          },
        },
      },
    },
    { $unwind: { path: '$course', includeArrayIndex: 'ranking' } },
    { $project: { rank: { $add: ['$ranking', 1] }, course: 1, totalScore: 1, quizzesAttended: 1, _id: 0 } },
  ]);

  const getUserSpecific = await studyProgrammeModel.aggregate([
    { $match: { studyProgrammeCode } },
    { $unwind: '$studyPeriods' },
    { $match: { 'studyPeriods.periodNumber': periodNumber } },
    { $unwind: '$studyPeriods.courses' },
    {
      $lookup: {
        from: 'courses',
        localField: 'studyPeriods.courses',
        foreignField: '_id',
        as: 'coursesInPeriod',
      },
    },
    { $unwind: '$coursesInPeriod' },
    { $unwind: '$coursesInPeriod.activities' },
    {
      $match: { $and: [{ 'coursesInPeriod.activities.name': name, 'coursesInPeriod.activities.variant': variant }] },
    },
    {
      $lookup: {
        from: 'kahoots',
        localField: 'coursesInPeriod.activities.sources',
        foreignField: '_id',
        as: 'kahootsInPeriod',
      },
    },
    { $unwind: '$kahootsInPeriod' },
    { $unwind: '$kahootsInPeriod.finalScores' },
    {
      $group: {
        _id: {
          player: '$kahootsInPeriod.finalScores.player',
          code: '$coursesInPeriod.code',
          name: '$coursesInPeriod.name',
          courseId: '$coursesInPeriod.courseId',
        },
        totalScore: { $sum: '$kahootsInPeriod.finalScores.totalScore' },
        quizzesAttended: { $count: {} },
      },
    },
    { $sort: { totalScore: -1 } },
    {
      $group: {
        _id: false,
        course: {
          $push: {
            _id: '$_id.player',
            code: '$_id.code',
            name: '$_id.name',
            courseId: '$_id.courseId',
            totalScore: '$totalScore',
            quizzesAttended: '$quizzesAttended',
          },
        },
      },
    },

    { $unwind: { path: '$course', includeArrayIndex: 'ranking' } },
    { $match: { 'course._id': username } },
    { $project: { rank: { $add: ['$ranking', 1] }, course: 1, totalScore: 1, quizzesAttended: 1, _id: 0 } },
  ]);

  try {
    res.status(201).json({
      message: `StudyPlan: ${studyProgrammeCode}`,
      studyProgrammeData,
      getUserSpecific,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error when creating study programme' });
  }
};

export const courseSpecificLeaderboard = async (req, res) => {
  const { courseId } = req.params;
  const name = 'kahoot';
  const variant = 'quiz';
  if (!variant || !name) {
    return res.status(400).json({ error: 'Variant and name is required' });
  }

  const findCourse = await courseModel.find({ courseId });

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
        quizzesAttended: { $count: {} },
      },
    },
    { $sort: { totalScore: -1 } },
  ]);

  try {
    totalScoreFromKahoots.length === 0
      ? res.status(201).json({
          message: `Course(s): ${courseId}`,
          data: null,
          error: 'No quizzes found',
        })
      : res.status(201).json({
          message: `Course(s): ${courseId}`,
          data: { totalQuizzes: ids.length, totalScore: totalScoreFromKahoots },
        });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error when creating study programme' });
  }
};
