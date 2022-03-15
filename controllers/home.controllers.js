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

  const studyProgrammeData = await studyProgrammeModel.aggregate([
    { $match: { studyProgrammeCode } },
    { $unwind: '$studyPeriods' },
    { $match: { 'studyPeriods.periodNumber': 6 } },
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
    { $unwind: { path: '$kahootsInPeriod.finalScores' } },
    {
      $group: {
        _id: {
          player: '$kahootsInPeriod.finalScores.player',
          code: '$coursesInPeriod.code',
          name: '$coursesInPeriod.name',
          courseId: '$coursesInPeriod.courseId',
        },
        totalScore: { $sum: '$kahootsInPeriod.finalScores.totalScore' },
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
          },
        },
      },
    },
    { $unwind: { path: '$course', includeArrayIndex: 'ranking' } },
    { $match: { 'course.user': username } },
    { $project: { rank: { $add: ['$ranking', 1] }, course: 1, _id: 0 } },
  ]);

  try {
    res.status(201).json({
      message: `StudyPlan: ${studyProgrammeCode}`,
      studyProgrammeData,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error when creating study programme' });
  }
};

/*     {
      $group: {
        _id: '$kahootsInPeriod.finalScores.player',
        totalScore: { $sum: '$kahootsInPeriod.finalScores.totalScore' },
      },
    }, */

/*  { $project: { ranking: 1, _id: 0, name: 1 } }, */
