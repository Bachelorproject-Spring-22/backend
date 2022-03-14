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

  const checkStudyPeriod = await studyProgrammeModel.aggregate([
    { $match: { studyProgrammeCode } },
    { $unwind: '$studyPeriods' },
    { $unwind: '$studyPeriods.courses' },
    { $match: { 'studyPeriods.periodNumber': periodNumber } },
    {
      $lookup: {
        from: 'courses',
        localField: 'studyPeriods.courses',
        foreignField: '_id',
        as: 'coursesInPeriod',
      },
    },
    { $unwind: '$coursesInPeriod' },
    {
      $project: { coursesInPeriod: 1, studyPeriods: 1 },
    },
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
      $group: {
        _id: {
          courseId: '$coursesInPeriod.courseId',
          periodNumber: '$studyPeriods.periodNumber',
          studyCode: '$studyPeriods.code',
          dates: '$studyPeriods.dates',
          periodCode: '$coursesInPeriod.code',
          periodName: '$coursesInPeriod.name',
          rank: '$kahootsInPeriod.finalScores.rank',
          player: '$kahootsInPeriod.finalScores.player',
        },
      },
    },
  ]);

  try {
    res.status(201).json({
      message: `StudyPlan: ${studyProgrammeCode}`,
      checkStudyPeriod,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error when creating study programme' });
  }
};
