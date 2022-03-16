import kahootModel from '../models/kahoot.js';
import courseModel from '../models/course.js';
import studyProgrammeModel from '../models/studyProgramme.js';
import jwtDecode from 'jwt-decode';

export const userSpecificCourseAndRank = async (req, res) => {
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
  if (!variant || !name) {
    return { error: 'Variant and name is required' };
  }
  const studyProgramme = await studyProgrammeModel.find({ studyProgrammeCode });
  if (!studyProgramme) return res.status(404).json({ error: 'StudyProgramme does not exist' });

  try {
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
      {
        $group: {
          _id: false,
          course: {
            $push: {
              user: '$_id.player',
              code: '$_id.code',
              name: '$_id.name',
              courseId: '$_id.courseId',
              quizzesAttended: '$quizzesAttended',
            },
          },
        },
      },
      { $unwind: { path: '$course', includeArrayIndex: 'ranking' } },
      { $match: { 'course.user': username } },
      { $project: { rank: { $add: ['$ranking', 1] }, course: 1, _id: 0 } },
    ]);

    res.status(201).json({
      message: `StudyPlan: ${studyProgrammeCode}`,
      studyProgrammeData,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error when creating study programme' });
  }
};

export const getUserSpecificCourseResultsLeaderBoard = async (req, res) => {
  const { username } = req.user;
  const { courseId } = req.params;
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
    { $limit: 3 },
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
    { $match: { 'kahootsInPeriod.finalScores.player': username } },
    {
      $project: {
        'kahootsInPeriod.finalScores.totalScore': 1,
        'kahootsInPeriod.finalScores.correctAnswers': 1,
        'kahootsInPeriod.finalScores.incorrectAnswers': 1,
        'kahootsInPeriod.quizId': 1,
        'kahootsInPeriod.title': 1,
        _id: 0,
      },
    },
  ]);
  try {
    res.status(201).json({
      message: `StudyPlan: ${studyProgrammeCode}, courseId: ${courseId}`,
      studyProgrammeData,
      getUserSpecific,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error when creating study programme' });
  }
};

export const getUserSpecificCourseResultsLeaderBoardQuiz = async (req, res) => {
  const { username } = req.user;
  const { courseId, quizId } = req.params;
  const headers = req.headers.authorization;
  if (!headers)
    return res.status(401).send({
      error: 'Unauthorized',
    });
  const token = headers.split(' ')[1];
  const { periodNumber, studyProgrammeCode } = jwtDecode(token);
  const name = 'kahoot';
  const variant = 'quiz';

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
    {
      $project: {
        'kahootsInPeriod.finalScores.totalScore': 1,
        'kahootsInPeriod.finalScores.correctAnswers': 1,
        'kahootsInPeriod.finalScores.incorrectAnswers': 1,
        'kahootsInPeriod.finalScores.rank': 1,
        'kahootsInPeriod.quizId': 1,
        'kahootsInPeriod.title': 1,
        'coursesInPeriod.code': 1,
        'coursesInPeriod.name': 1,
        quizNumber: { $add: ['$quizNumber', 1] },
        _id: 0,
      },
    },
  ]);

  try {
    res.status(201).json({
      message: `StudyPlan: ${studyProgrammeCode}, courseId: ${courseId}`,
      getUserSpecific,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error when creating study programme' });
  }
};
