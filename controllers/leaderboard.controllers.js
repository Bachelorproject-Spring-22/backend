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
  if (!variant || !name) {
    return { error: 'Variant and name is required' };
  }

  let findCourse;
  let coursesInPeriod = [];
  if (!periodNumber && !studyProgrammeCode)
    res.status(400).json({
      error: 'Provide either a period number and study program code or courseId or study program code and yearCode',
    });
  try {
    const studyProgramme = await studyProgrammeModel.find({ studyProgrammeCode });
    if (!studyProgramme) return res.status(404).json({ error: 'StudyProgramme does not exist' });

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
      { $limit: 5 },
    ]);

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
    ]);

    const courses =
      getCourseAndQuizResults.length === 0
        ? 'You have not completed any quizzes this semester'
        : getCourseAndQuizResults;

    totalScoreFromKahoots.length === 0
      ? res.status(201).json({
          message: `StudyPlan: ${studyProgrammeCode} periodNumber: ${periodNumber}`,
          data: null,
          error: 'No quizzes found',
        })
      : res.status(201).json({
          message: `StudyPlan: ${studyProgrammeCode} periodNumber: ${periodNumber}`,
          data: {
            semesterLeaderBoard: {
              totalQuizzes: ids.length,
              totalScore: totalScoreFromKahoots,
            },
            courses,
          },
        });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error when creating study programme' });
  }
};
