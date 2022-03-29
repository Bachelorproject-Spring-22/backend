import jwtDecode from 'jwt-decode';
import mongoose from 'mongoose';

// Models
import studyProgrammeModel from '../models/studyProgramme.js';

// Utils
import { createBadRequest, createNotFound, createUnauthorized } from '../utils/errors.js';

// Misc
const ObjectId = mongoose.Types.ObjectId;

export const userSpecificCourseAndRank = async (req, res, next) => {
  const { username } = req.user;
  const headers = req.headers.authorization;

  if (!headers) return next(createUnauthorized());
  if (!username) return next(createNotFound('username not found'));

  const token = headers.split(' ')[1];
  const { periodNumber, studyProgrammeCode, _id } = jwtDecode(token);

  const name = 'kahoot';
  const variant = 'quiz';
  const studyProgramme = await studyProgrammeModel.find({ studyProgrammeCode });

  if (!variant || !name) return next(createBadRequest('Variant and name is required'));
  if (!studyProgramme) return next(createNotFound('StudyProgramme does not exist'));

  // Query: check if user is added to course
  // Output: User rank for the course, course code and course name
  const studyProgrammeData = await studyProgrammeModel.aggregate([
    { $match: { $and: [{ studyProgrammeCode }, { users: { $in: [ObjectId(_id), '$users'] } }] } },
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
            name: '$_id.player',
            code: '$_id.code',
            courseName: '$_id.name',
            courseId: '$_id.courseId',
            quizzesAttended: '$quizzesAttended',
          },
        },
      },
    },
    { $unwind: { path: '$player', includeArrayIndex: 'ranking' } },
    { $match: { 'player.name': username } },
    { $project: { rank: { $add: ['$ranking', 1] }, player: 1, _id: 0 } },
  ]);

  res.status(201).json({
    message: `StudyPlan: ${studyProgrammeCode}`,
    studyProgrammeData,
  });
};

export const getUserSpecificCourseResultsLeaderBoard = async (req, res, next) => {
  const { username } = req.user;
  const { courseId } = req.params;
  const headers = req.headers.authorization;

  if (!headers) return next(createUnauthorized());
  if (!courseId) return next(createNotFound('Course id not found'));
  if (!username) return next(createNotFound('Username not found'));

  const token = headers.split(' ')[1];
  const { periodNumber, studyProgrammeCode, _id } = jwtDecode(token);

  const name = 'kahoot';
  const variant = 'quiz';

  // Query: check if user is added to course
  // Output: User rank for the course, course code and course name
  const studyProgrammeData = await studyProgrammeModel.aggregate([
    { $match: { $and: [{ studyProgrammeCode }, { users: { $in: [ObjectId(_id), '$users'] } }] } },
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
        player: {
          $push: {
            name: '$_id.player',
            code: '$_id.code',
            courseName: '$_id.name',
            courseId: '$_id.courseId',
            totalScore: '$totalScore',
            quizzesAttended: '$quizzesAttended',
          },
        },
      },
    },
    { $unwind: { path: '$player', includeArrayIndex: 'ranking' } },
    { $project: { rank: { $add: ['$ranking', 1] }, player: 1, totalScore: 1, quizzesAttended: 1, _id: 0 } },
  ]);

  // Query: Get all quizes that user has participate in selected course
  const getUserSpecific = await studyProgrammeModel.aggregate([
    { $match: { $and: [{ studyProgrammeCode }, { users: { $in: [ObjectId(_id), '$users'] } }] } },
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
    { $unwind: { path: '$kahootsInPeriod', includeArrayIndex: 'quizNumber' } },
    { $unwind: '$kahootsInPeriod.finalScores' },
    { $match: { 'kahootsInPeriod.finalScores.player': username } },
    { $sort: { 'kahootsInPeriod.playedOn': 1 } }, // sort by ascending date
    {
      $project: {
        'kahootsInPeriod.finalScores.totalScore': 1,
        'kahootsInPeriod.finalScores.correctAnswers': 1,
        'kahootsInPeriod.finalScores.incorrectAnswers': 1,
        'kahootsInPeriod.playedOn': 1,
        'kahootsInPeriod.quizId': 1,
        'kahootsInPeriod.title': 1,
        quizNumber: '$quizNumber',
        _id: 0,
      },
    },
  ]);

  res.status(201).json({
    message: `StudyPlan: ${studyProgrammeCode}, courseId: ${courseId}`,
    studyProgrammeData,
    getUserSpecific,
  });
};

export const getUserSpecificCourseResultsLeaderBoardQuiz = async (req, res, next) => {
  const { username } = req.user;
  const { courseId, quizId } = req.params;
  const headers = req.headers.authorization;

  if (!headers) return next(createUnauthorized());
  if (!courseId || !quizId) return next(createNotFound('Course id or quiz id not found'));
  if (!username) return next(createNotFound('Username not found'));

  const token = headers.split(' ')[1];
  const { periodNumber, studyProgrammeCode, _id } = jwtDecode(token);

  const name = 'kahoot';
  const variant = 'quiz';

  // Query: Get all quizes that user has participate in selected course
  const getUserSpecific = await studyProgrammeModel.aggregate([
    { $match: { $and: [{ studyProgrammeCode }, { users: { $in: [ObjectId(_id), '$users'] } }] } },
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
    { $unwind: { path: '$kahootsInPeriod', includeArrayIndex: 'quizNumber' } },
    { $unwind: '$kahootsInPeriod.finalScores' },
    { $match: { $and: [{ 'kahootsInPeriod.finalScores.player': username }, { 'kahootsInPeriod.quizId': quizId }] } },
    { $sort: { 'kahootsInPeriod.playedOn': 1 } }, // sort by ascending date
    {
      $project: {
        'kahootsInPeriod.finalScores.totalScore': 1,
        'kahootsInPeriod.finalScores.correctAnswers': 1,
        'kahootsInPeriod.finalScores.incorrectAnswers': 1,
        'kahootsInPeriod.finalScores.rank': 1,
        'kahootsInPeriod.playedOn': 1,
        'kahootsInPeriod.quizId': 1,
        'kahootsInPeriod.title': 1,
        'coursesInPeriod.code': 1,
        'coursesInPeriod.name': 1,
        quizNumber: '$quizNumber',
        _id: 0,
      },
    },
  ]);

  res.status(201).json({
    message: `StudyPlan: ${studyProgrammeCode}, courseId: ${courseId}`,
    getUserSpecific,
  });
};
