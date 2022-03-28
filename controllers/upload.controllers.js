import kahootModel from '../models/kahoot.js';
import courseModel from '../models/course.js';

import { readDataFromExcel } from '../config/excelToJson.js';
import { createBadRequest, createNotFound } from '../utils/errors.js';

export const quizUpload = async (req, res, next) => {
  const filePath = req.file;
  const courseId = req.body.courseId;

  if (!courseId) return next(createNotFound('Course id not found'));
  if (!filePath) return next(createNotFound('filePath'));

  const name = 'kahoot';
  const variant = 'quiz';

  if (!filePath) return next(createBadRequest('Please upload a file'));
  const dataFromExcel = readDataFromExcel(req.file.path);
  if (!dataFromExcel) return next(createBadRequest('Upload a valid file'));

  const finalScores = dataFromExcel['Final Scores'].map((user) => user);
  const activityIds = [];

  const course = await courseModel.findOne({ courseId });
  if (!course) return next(createNotFound('Course not found'));

  course.activities.forEach((kahoot) => {
    if (kahoot.name === name && kahoot.variant === variant) {
      const [kahoots] = kahoot.sources;
      activityIds.push(kahoots);
    }
  });

  const titleFromExcel = dataFromExcel['Overview'][0].A;
  var sanitized = titleFromExcel.replace(/[^\w\s]/gi, '');
  const title = sanitized.replace(/\s+/g, '_');
  const utc = dataFromExcel['Overview'][1].B;

  // https://stackoverflow.com/questions/38735927/add-offset-to-utc-date-in-javascript
  // Add one hour to playedOn because of timezone difference
  const playedOn = new Date(new Date(utc) * 1 + 60 * 60 * 1000);
  const kahoot = new kahootModel({
    title,
    playedOn,
    hostedBy: dataFromExcel['Overview'][2].B,
    numberOfPlayers: dataFromExcel['Overview'][3].B,
    course: {
      code: course.code,
      name: course.name,
      courseId,
    },
    finalScores,
  });

  const checkIfQuizExists = await kahootModel.findOne({ quizId: kahoot.quizId }, { quizId: 1, _id: 0 }).lean();
  if (checkIfQuizExists) return next(createBadRequest(`Quiz ${title} is already uploaded to this course`));

  await kahoot.save().then(async ({ _id }) => {
    await courseModel.updateOne(
      { courseId },
      { $push: { 'activities.$[activities].sources': _id } },
      { arrayFilters: [{ 'activities.name': name }] },
    );
  });
  res.status(201).json({ message: 'Quiz uploaded successfully' });
};

export const getUserSpecificCourseAndStudyprogrammeCode = async (req, res, next) => {
  const user = req.user;
  if (!user) next(createNotFound('User not found'));
  const courseIds = user.courses;
  res.status(201).json({ message: 'CourseId(s) found', courseIds });
};
