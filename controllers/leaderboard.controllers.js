import studyProgrammeModel from '../models/studyProgramme.js';
import jwtDecode from 'jwt-decode';

import { createUnauthorized } from '../utils/errors.js';

export const semesterLeaderboardAndUserCourses = async (req, res) => {
  const { username } = req.user;
  const headers = req.headers.authorization;
  if (!headers) return next(createUnauthorized());

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
        player: {
          $push: {
            _id: '$_id.player',
            courseId: '$_id.courseId',
            totalScore: '$totalScore',
            quizzesAttended: '$quizzesAttended',
          },
        },
      },
    },
    { $unwind: { path: '$player', includeArrayIndex: 'ranking' } },
    {
      $project: {
        rank: { $add: ['$ranking', 1] },
        player: 1,
        totalScore: 1,
        quizzesAttended: 1,
        _id: 0,
      },
    },
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
        player: {
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
    { $unwind: { path: '$player', includeArrayIndex: 'ranking' } },
    { $match: { 'player._id': username } },
    { $project: { rank: { $add: ['$ranking', 1] }, player: 1, totalScore: 1, quizzesAttended: 1, _id: 0 } },
  ]);
  const courseAndTotalAmountOfQuizzes = await studyProgrammeModel.aggregate([
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
      $project: {
        totalAmountOfQuizzes: { $size: '$coursesInPeriod.activities.sources' },
        code: '$coursesInPeriod.code',
        name: '$coursesInPeriod.name',
        year: '$year',
        semester: '$studyPeriods.dates.term',
        courseId: '$coursesInPeriod.courseId',
        _id: 0,
      },
    },
  ]);
  res.status(201).json({
    message: `StudyPlan: ${studyProgrammeCode}`,
    studyProgrammeData,
    getUserSpecific,
    courseAndTotalAmountOfQuizzes,
  });
};

export const courseSpecificLeaderboard = async (req, res) => {
  const headers = req.headers.authorization;
  const { username } = req.user;
  const { courseId } = req.params;
  if (!headers) return next(createUnauthorized());

  const token = headers.split(' ')[1];
  const { periodNumber, studyProgrammeCode } = jwtDecode(token);
  const name = 'kahoot';
  const variant = 'quiz';

  const getUserData = await studyProgrammeModel.aggregate([
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
    { $match: { 'coursesInPeriod.courseId': courseId } },
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
        player: {
          $push: {
            _id: '$_id.player',
            courseId: '$_id.courseId',
            totalScore: '$totalScore',
            quizzesAttended: '$quizzesAttended',
          },
        },
      },
    },
    { $unwind: { path: '$player', includeArrayIndex: 'ranking' } },
    {
      $project: {
        rank: { $add: ['$ranking', 1] },
        player: 1,
        totalScore: 1,
        quizzesAttended: 1,
        _id: 0,
      },
    },
  ]);

  const courseAndTotalAmountOfQuizzes = await studyProgrammeModel.aggregate([
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
    { $match: { 'coursesInPeriod.courseId': courseId } },
    { $unwind: '$coursesInPeriod.activities' },
    {
      $match: { $and: [{ 'coursesInPeriod.activities.name': name, 'coursesInPeriod.activities.variant': variant }] },
    },
    {
      $project: {
        totalAmountOfQuizzes: { $size: '$coursesInPeriod.activities.sources' },
        code: '$coursesInPeriod.code',
        name: '$coursesInPeriod.name',
        courseId: '$coursesInPeriod.courseId',
        _id: 0,
      },
    },
  ]);

  // Hide player names that are lower than rank five or current user

  const studyProgrammeData = getUserData.map(({ player, rank }) =>
    rank <= 5 || player._id === username ? { player, rank } : { ...player, _id: 'Anonymous', rank },
  );

  res.status(201).json({
    message: `StudyPlan: ${studyProgrammeCode}`,
    studyProgrammeData,
    courseAndTotalAmountOfQuizzes,
  });
};

export const selectQuizSnapshot = async (req, res, next) => {
  const headers = req.headers.authorization;
  const { courseId } = req.params;
  const { startDate, endDate } = req.body;
  if (!headers) return next(createUnauthorized());

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
    { $match: { 'coursesInPeriod.courseId': courseId } },
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
    {
      $match: {
        'kahootsInPeriod.playedOn': {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    },
    { $unwind: '$kahootsInPeriod.finalScores' },
    {
      $group: {
        _id: {
          player: '$kahootsInPeriod.finalScores.player',
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
        player: {
          $push: {
            _id: '$_id.player',
            courseId: '$_id.courseId',
            totalScore: '$totalScore',
            quizzesAttended: '$quizzesAttended',
          },
        },
      },
    },
    { $unwind: { path: '$player', includeArrayIndex: 'ranking' } },
    {
      $project: {
        rank: { $add: ['$ranking', 1] },
        player: 1,
        totalScore: 1,
        quizzesAttended: 1,
        date: 1,
        _id: 0,
      },
    },
  ]);

  const courseAndTotalAmountOfQuizzes = await studyProgrammeModel.aggregate([
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
    { $match: { 'coursesInPeriod.courseId': courseId } },
    { $unwind: '$coursesInPeriod.activities' },
    {
      $match: { $and: [{ 'coursesInPeriod.activities.name': name, 'coursesInPeriod.activities.variant': variant }] },
    },
    {
      $project: {
        totalAmountOfQuizzes: { $size: '$coursesInPeriod.activities.sources' },
        code: '$coursesInPeriod.code',
        name: '$coursesInPeriod.name',
        courseId: '$coursesInPeriod.courseId',
        _id: 0,
      },
    },
  ]);
  res.status(201).json({
    message: `StudyPlan: ${studyProgrammeCode} | courseId: ${courseId} | periodNumber: ${periodNumber}`,
    studyProgrammeData,
    courseAndTotalAmountOfQuizzes,
  });
};
