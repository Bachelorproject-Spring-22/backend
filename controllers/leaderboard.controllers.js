import jwtDecode from 'jwt-decode';
import mongoose from 'mongoose';

// Models
import studyProgrammeModel from '../models/studyProgramme.js';

// Utils
import { createUnauthorized, createBadRequest, createNotFound } from '../utils/errors.js';

// Misc
const ObjectId = mongoose.Types.ObjectId;

export const semesterLeaderboardAndUserCourses = async (req, res, next) => {
  const { username, role } = req.user;
  const headers = req.headers.authorization;
  if (!headers) return next(createUnauthorized());
  if (!username) return next(createNotFound('Username not found'));

  const token = headers.split(' ')[1];
  const { periodNumber, studyProgrammeCode, _id } = jwtDecode(token);
  const name = 'kahoot';
  const variant = 'quiz';

  let studyProgrammeData;
  let getUserSpecific;
  let courseAndTotalAmountOfQuizzes;

  // Change query based on role
  if (role === 'student') {
    studyProgrammeData = await studyProgrammeModel.aggregate([
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

    getUserSpecific = await studyProgrammeModel.aggregate([
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
              totalScore: '$totalScore',
              quizzesAttended: '$quizzesAttended',
            },
          },
        },
      },
      { $unwind: { path: '$player', includeArrayIndex: 'ranking' } },
      { $match: { 'player.name': username } },
      { $project: { rank: { $add: ['$ranking', 1] }, player: 1, totalScore: 1, quizzesAttended: 1, _id: 0 } },
    ]);

    courseAndTotalAmountOfQuizzes = await studyProgrammeModel.aggregate([
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
      {
        $group: {
          _id: { course: '$kahootsInPeriod.course' },
          date: {
            $push: {
              _id: '$kahootsInPeriod',
            },
          },
        },
      },
      {
        $project: {
          totalAmountOfQuizzes: { $size: ['$date'] },
          course: '$_id.course',
          _id: 0,
        },
      },
    ]);
  } else {
    studyProgrammeData = await studyProgrammeModel.aggregate([
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
        $match: {
          $and: [{ 'coursesInPeriod.activities.name': name, 'coursesInPeriod.activities.variant': variant }],
        },
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
              name: '$_id.player',
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

    const courses = await studyProgrammeModel.aggregate([
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
      { $project: { 'coursesInPeriod.name': 1, 'coursesInPeriod.code': 1, 'coursesInPeriod.courseId': 1, _id: 0 } },
    ]);

    getUserSpecific = courses.map(({ coursesInPeriod }) => {
      const { code, courseId, name } = coursesInPeriod;
      return { player: { courseId, code, courseName: name } };
    });

    courseAndTotalAmountOfQuizzes = await studyProgrammeModel.aggregate([
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
        $match: {
          $and: [{ 'coursesInPeriod.activities.name': name, 'coursesInPeriod.activities.variant': variant }],
        },
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
        $group: {
          _id: { course: '$kahootsInPeriod.course' },
          date: {
            $push: {
              _id: '$kahootsInPeriod',
            },
          },
        },
      },
      {
        $project: {
          totalAmountOfQuizzes: { $size: ['$date'] },
          course: '$_id.course',
          _id: 0,
        },
      },
    ]);
  }

  res.status(201).json({
    message: `StudyPlan: ${studyProgrammeCode}`,
    studyProgrammeData,
    getUserSpecific,
    courseAndTotalAmountOfQuizzes: courseAndTotalAmountOfQuizzes[0],
  });
};

export const courseSpecificLeaderboard = async (req, res, next) => {
  const headers = req.headers.authorization;
  const { username, role } = req.user;
  const { courseId } = req.params;
  if (!headers) return next(createUnauthorized());
  if (!username) return next(createNotFound('Username not found '));
  if (!courseId) return next(createBadRequest('Please enter a valid course id'));

  const token = headers.split(' ')[1];
  const { periodNumber, studyProgrammeCode, _id } = jwtDecode(token);
  const name = 'kahoot';
  const variant = 'quiz';

  let getUserData;
  let courseAndTotalAmountOfQuizzes;

  if (role === 'student') {
    getUserData = await studyProgrammeModel.aggregate([
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

    courseAndTotalAmountOfQuizzes = await studyProgrammeModel.aggregate([
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
      {
        $group: {
          _id: { course: '$kahootsInPeriod.course' },
          date: {
            $push: {
              _id: '$kahootsInPeriod',
            },
          },
        },
      },
      {
        $project: {
          totalAmountOfQuizzes: { $size: ['$date'] },
          course: '$_id.course',
          _id: 0,
        },
      },
    ]);
  } else {
    getUserData = await studyProgrammeModel.aggregate([
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
              name: '$_id.player',
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
    courseAndTotalAmountOfQuizzes = await studyProgrammeModel.aggregate([
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
        $match: {
          $and: [{ 'coursesInPeriod.activities.name': name, 'coursesInPeriod.activities.variant': variant }],
        },
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
        $group: {
          _id: { course: '$kahootsInPeriod.course' },
          date: {
            $push: {
              _id: '$kahootsInPeriod',
            },
          },
        },
      },
      {
        $project: {
          totalAmountOfQuizzes: { $size: ['$date'] },
          course: '$_id.course',
          _id: 0,
        },
      },
    ]);
  }

  // Add anonymous usernames except top 5 or current user
  const studyProgrammeData = getUserData.map(({ player, rank }) =>
    rank <= 5 || player.name === username || role !== 'student'
      ? { player, rank }
      : { player: { ...player, name: 'anonymous' }, rank },
  );
  res.status(201).json({
    message: `StudyPlan: ${studyProgrammeCode}`,
    studyProgrammeData,
    courseAndTotalAmountOfQuizzes: courseAndTotalAmountOfQuizzes[0],
  });
};

export const selectQuizSnapshot = async (req, res, next) => {
  const headers = req.headers.authorization;
  const { username, role } = req.user;
  const { courseId } = req.params;
  const { startDate, endDate } = req.body;
  if (!headers) return next(createUnauthorized());
  if (!username) return next(createNotFound('Username not found '));
  if (!courseId) return next(createNotFound('Course id not found'));
  if (!startDate || !endDate) return next(createBadRequest('Please enter a valid timeframe'));

  const token = headers.split(' ')[1];
  const { periodNumber, studyProgrammeCode, _id } = jwtDecode(token);
  const name = 'kahoot';
  const variant = 'quiz';

  let getUserData;
  let courseAndTotalAmountOfQuizzes;

  if (role === 'student') {
    getUserData = await studyProgrammeModel.aggregate([
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
              name: '$_id.player',
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

    courseAndTotalAmountOfQuizzes = await studyProgrammeModel.aggregate([
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
      {
        $match: {
          'kahootsInPeriod.playedOn': {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $group: {
          _id: { course: '$kahootsInPeriod.course' },
          date: {
            $push: {
              _id: '$kahootsInPeriod',
            },
          },
        },
      },
      {
        $project: {
          totalAmountOfQuizzes: { $size: ['$date'] },
          course: '$_id.course',
          _id: 0,
        },
      },
    ]);
  } else {
    getUserData = await studyProgrammeModel.aggregate([
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
              name: '$_id.player',
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

    courseAndTotalAmountOfQuizzes = await studyProgrammeModel.aggregate([
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
      {
        $group: {
          _id: { course: '$kahootsInPeriod.course' },
          date: {
            $push: {
              _id: '$kahootsInPeriod',
            },
          },
        },
      },
      {
        $project: {
          totalAmountOfQuizzes: { $size: ['$date'] },
          course: '$_id.course',
          _id: 0,
        },
      },
    ]);
  }

  // Add anonymous usernames except top 5 or current user
  const studyProgrammeData = getUserData.map(({ player, rank }) =>
    rank <= 5 || player.name === username || role !== 'student'
      ? { player, rank }
      : { player: { ...player, name: 'anonymous' }, rank },
  );
  res.status(201).json({
    message: `StudyPlan: ${studyProgrammeCode} | courseId: ${courseId} | periodNumber: ${periodNumber}`,
    studyProgrammeData,
    courseAndTotalAmountOfQuizzes: courseAndTotalAmountOfQuizzes[0],
  });
};
