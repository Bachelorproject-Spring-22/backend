import kahootModel from '../models/kahoot.js';
import courseModel from '../models/course.js';

import { readDataFromExcel } from '../config/excelToJson.js';
import { createBadRequest } from '../utils/errors.js';

export const quizUpload = async (req, res, next) => {
  const filePath = req.file;
  const courseId = req.body.courseId;

  if (!filePath) return next(createBadRequest('Please upload a file'));
  const dataFromExcel = readDataFromExcel(req.file.path);
  if (!dataFromExcel) return next(createBadRequest('Upload a valid file'));

  const finalScores = dataFromExcel['Final Scores'].map((user) => user);
  const activityIds = [];

  const course = await courseModel.findOne({ courseId });
  if (!course) return next(createBadRequest('Course not found'));

  course.activities.forEach((kahoot) => {
    if (kahoot.name === 'kahoot' && kahoot.variant === 'quiz') {
      const [kahoots] = kahoot.sources;
      activityIds.push(kahoots);
    }
  });

  const titleFromExcel = dataFromExcel['Overview'][0].A;
  var sanitized = titleFromExcel.replace(/[^\w\s]/gi, '');
  const title = sanitized.replace(/\s\s+/g, '');

  const kahoot = new kahootModel({
    title,
    playedOn: dataFromExcel['Overview'][1].B,
    hostedBy: dataFromExcel['Overview'][2].B,
    numberOfPlayers: dataFromExcel['Overview'][3].B,
    course: {
      code: course.code,
      name: course.name,
      courseId,
    },
    finalScores,
  });

  await kahoot.save();
  await courseModel.updateOne(
    { courseId },
    { $push: { 'activities.$[activities].sources': kahoot._id } },
    { arrayFilters: [{ 'activities.name': 'kahoot' }] },
  );
  res.status(201).json({ message: 'Quiz uploaded successfully' });
};
