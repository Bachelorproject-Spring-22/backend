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

  let findCourse;
  let coursesInPeriod = [];
  const checkStudyPeriod = await studyProgrammeModel.aggregate([
    { $match: { studyProgrammeCode } },
    { $unwind: '$studyPeriods' },
    { $match: { 'studyPeriods.periodNumber': periodNumber } },
    { $unwind: '$studyPeriods.courses' },
    { $project: { 'studyPeriods.code': 1, 'studyPeriods.courses': 1 } },
  ]);
  checkStudyPeriod.forEach((data) => {
    coursesInPeriod.push(data.studyPeriods.courses);
  });
  findCourse = await courseModel.find({ _id: coursesInPeriod });

  let sources = [];
  findCourse.forEach(({ activities }) => {
    const [activity] = activities;
    if (activity.name === name && activity.variant === variant && activity.sources.length !== 0)
      activity.sources.forEach((source) => sources.push(source));
  });

  const getAllKahootsFromActivity = await kahootModel.find({ _id: sources }, { _id: 1 });

  const ids = getAllKahootsFromActivity.map((doc) => doc._id);
  const getCourseAndQuizResults = await kahootModel.aggregate([
    { $match: { _id: { $in: ids } } },
    { $unwind: '$finalScores' },
    { $match: { 'finalScores.player': username } },
    {
      $group: {
        _id: {
          player: '$finalScores.player',
          rank: '$finalScores.rank',
          courseId: '$course.courseId',
          code: '$course.code',
          name: '$course.name',
        },
        totalScore: { $sum: '$finalScores.totalScore' },
        quizzesAttended: { $count: {} },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const courses =
    getCourseAndQuizResults.length === 0 ? 'You have not completed any quizzes this semester' : getCourseAndQuizResults;
  try {
    res.status(201).json({
      message: `StudyPlan: ${studyProgrammeCode} periodNumber: ${periodNumber}`,
      data: {
        courses,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error when creating study programme' });
  }
};
