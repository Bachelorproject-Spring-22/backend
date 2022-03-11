import kahootModel from '../models/kahoot.js';
import courseModel from '../models/course.js';

import { readDataFromExcel } from '../config/excelToJson.js';

export const quizUpload = async (req, res, next) => {
  const filePath = req.file;
  if (!filePath) return res.status(400).json({ error: 'Please upload a file' });
  const dataFromExcel = readDataFromExcel(req.file.path);
  if (!dataFromExcel) {
    return res.status(500).json({ error: 'Server error' }); // TODO: Change this error
  }
  const finalScores = dataFromExcel['Final Scores'].map((user) => user);

  const kahoot = new kahootModel({
    playedOn: dataFromExcel['Overview'][0].B,
    hostedBy: dataFromExcel['Overview'][1].B,
    numberOfPlayers: dataFromExcel['Overview'][2].B,
    finalScores,
  });

  // TODO: Change this to course model | x
  // add a way to define if it is kahoot or something else. (maybe use params??)
  const courseId = 'IDG3100_f2019';
  await courseModel.updateOne(
    { courseId },
    { $push: { 'activities.$[activities].sources': kahoot._id } },
    { arrayFilters: [{ 'activities.name': 'kahoot' }] },
  );
  try {
    await kahoot.save();

    res.status(201).json({ message: 'Quiz uploaded successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error when creating quiz' });
  }
};

export const aggregateQuizScores = async (req, res) => {
  const { courseId, variant, name } = req.body;

  if (!courseId || !variant || !name) {
    return res.status(400).json({ error: 'CourseId and variant and name is required' });
  }

  const findCourse = await courseModel.find({ courseId });

  let sources = [];
  findCourse.forEach(({ activities }) => {
    const [a] = activities;
    if (a.name === name && a.variant === variant && a.sources.length !== 0)
      a.sources.forEach((source) => sources.push(source));
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

  try {
    res
      .status(201)
      .json({ message: `Course(s): ${courseId}`, totalQuizzes: ids.length, totalScore: totalScoreFromKahoots });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error when creating quiz' });
  }
};
