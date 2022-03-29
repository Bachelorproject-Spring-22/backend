import userModel from '../models/user.js';
import studyProgrammeModel from '../models/studyProgramme.js';
import courseModel from '../models/course.js';
import kahootModel from '../models/kahoot.js';
import generateJwtToken from '../utils/generateTokens.js';

import calculateSemester from '../utils/calculateSemester.js';
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
  const studyProgrammeCode = user.studyProgrammes;
  if (!user.studyProgrammes) next(createNotFound('StudyProgrammes not found'));

  let codes = [];
  let number = [];

  studyProgrammeCode.forEach((code) => {
    let filterOutstring = code.match(/\d+/g);
    let createYear = `20${filterOutstring}`;
    let periodNumber = calculateSemester(createYear);
    codes.push({ studyProgrammeCode: code, periodNumber });
    number.push(periodNumber);
  });

  const studyProgrammeData = await studyProgrammeModel.aggregate([
    { $match: { studyProgrammeCode: { $in: studyProgrammeCode } } },
    { $unwind: '$studyPeriods' },
    { $match: { 'studyPeriods.periodNumber': { $in: number } } },
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
  ]);
  const array = [];
  codes.forEach((code) =>
    studyProgrammeData.forEach(
      (data) =>
        code.studyProgrammeCode === data.studyProgrammeCode &&
        code.periodNumber === data.studyPeriods.periodNumber &&
        array.push(data.coursesInPeriod),
    ),
  );

  const unique = getUniqueObjecs(array, 'courseId');
  const courseIds = unique.map((course) => createCourseObject(course));

  res.status(201).json({ message: 'CourseId(s) found', courseIds });
};

export const updateUserWithStudyplan = async (req, res, next) => {
  const { studyProgrammeCode } = req.body;
  const user = req.user;
  const { username } = user;
  if (!studyProgrammeCode) return next(createNotFound('StudyProgrammeCode not found'));

  const checkUser = await userModel.findOne({ username }, { studyProgrammes: 1 }).sort({ _id: 1 }).lean();
  if (!checkUser) return next(createBadRequest('User(s) does not exist'));

  const checkStudyProgramme = await studyProgrammeModel.find({ studyProgrammeCode }).lean();
  if (checkStudyProgramme.length === 0) return next(createBadRequest('studyplan(s) does not exist'));

  const checkIfStudyProgrammeIsAddedToUser = [];
  studyProgrammeCode.forEach((studyProgramme) => {
    checkUser.studyProgrammes.forEach((data) => {
      if (data === studyProgramme) return checkIfStudyProgrammeIsAddedToUser.push(studyProgramme);
    });
  });

  if (checkIfStudyProgrammeIsAddedToUser.length !== 0)
    return next(
      createBadRequest(`Remove following studyProgrammeCode(s) from input [${checkIfStudyProgrammeIsAddedToUser}]`, {
        studyProgramme: checkIfStudyProgrammeIsAddedToUser,
      }),
    );

  const studyProgrammes = studyProgrammeCode.filter((studyProgramme) =>
    checkUser.studyProgrammes.filter((data) => studyProgramme !== data),
  );

  const test = checkStudyProgramme.filter((data) => data.studyProgrammeCode === studyProgrammes[0]);
  let jwtToken;
  checkUser.studyProgrammes.length === 0
    ? await userModel
        .updateOne(
          { username },
          { $push: { studyProgrammes }, programmeCode: test[0].studyProgrammeCode, year: test[0].year },
        )
        .then((jwtToken = generateJwtToken(user, test[0].studyProgrammeCode, test[0].year, studyProgrammes)))
    : await userModel.updateOne({ username }, { $push: { studyProgrammes } });

  res.status(201).json({
    message: `Courses added successfully [${studyProgrammes}]`,
    jwtToken,
  });
};

export const deleteQuizFromCourse = async (req, res, next) => {
  const { courseId, quizId } = req.params;
  if (!courseId) return next(createNotFound('Course not found'));
  if (!quizId) return next(createNotFound('Quiz not found'));

  const checkIfCourseExists = await courseModel.findOne({ courseId });
  if (!checkIfCourseExists) return next(createNotFound('Course not found'));

  const courseQuizzes = checkIfCourseExists.activities[0].sources;
  const checkIfQuizzesExists = await kahootModel.find({ quizId });
  if (checkIfQuizzesExists.length === 0) return next(createNotFound('Quiz not found'));

  const quizzesToDelete = [];

  checkIfQuizzesExists.forEach((quiz) => {
    courseQuizzes.forEach((item) => {
      if (quiz._id.toString() === item.toString()) {
        quizzesToDelete.push(item);
      }
    });
  });

  // Delete kahoot _id from course
  await courseModel.updateOne(
    { courseId },
    { $pull: { 'activities.$[activities].sources': { $in: quizzesToDelete } } },
    { arrayFilters: [{ 'activities.name': 'kahoot' }] },
  );
  // Delete kahoot by quizId
  await kahootModel.findOneAndDelete({ quizId });

  res.status(201).json({
    message: 'Quizz deleted successfully',
  });
};

export const getAllStudyPlans = async (req, res, next) => {
  const user = req.user;
  if (!user) return next(createNotFound('User not found'));

  const studyProgrammeCodes = await studyProgrammeModel.find({}, { studyProgrammeCode: 1, _id: 0 });
  if (!studyProgrammeCodes) return next(createNotFound('Studyprogrammes not found'));

  res.status(201).json({
    message: 'All studyProgrammeCodes',
    studyProgrammeCodes,
  });
};

export const getUserSpecificCourse = async (req, res, next) => {
  const user = req.user;
  if (!user) return next(createNotFound('User not found'));

  const studyProgrammeCode = user.studyProgrammes;
  if (!user.studyProgrammes) next(createNotFound('StudyProgrammes not found'));

  let codes = [];
  let number = [];

  studyProgrammeCode.forEach((code) => {
    let filterOutstring = code.match(/\d+/g);
    let createYear = `20${filterOutstring}`;
    let periodNumber = calculateSemester(createYear);
    codes.push({ studyProgrammeCode: code, periodNumber });
    number.push(periodNumber);
  });

  const studyProgrammeData = await studyProgrammeModel.aggregate([
    { $match: { studyProgrammeCode: { $in: studyProgrammeCode } } },
    { $unwind: '$studyPeriods' },
    { $match: { 'studyPeriods.periodNumber': { $in: number } } },
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
  ]);
  const array = [];
  codes.forEach((code) =>
    studyProgrammeData.forEach(
      (data) =>
        code.studyProgrammeCode === data.studyProgrammeCode &&
        code.periodNumber === data.studyPeriods.periodNumber &&
        array.push(data.coursesInPeriod),
    ),
  );
  const unique = getUniqueObjecs(array, 'courseId');
  const courses = unique.map((course) => createCourseObject(course, 'course'));
  res.status(201).json({ message: 'CourseId(s) found', courses });
};

export const getUserSpecificCourseAndQuiz = async (req, res, next) => {
  const { courseId } = req.params;
  const user = req.user;
  if (!user) return next(createNotFound('User not found'));

  const studyProgrammeCode = user.studyProgrammes;
  if (!user.studyProgrammes) next(createNotFound('StudyProgrammes not found'));

  let codes = [];
  let number = [];

  studyProgrammeCode.forEach((code) => {
    let filterOutstring = code.match(/\d+/g);
    let createYear = `20${filterOutstring}`;
    let periodNumber = calculateSemester(createYear);
    codes.push({ studyProgrammeCode: code, periodNumber });
    number.push(periodNumber);
  });

  const studyProgrammeData = await studyProgrammeModel.aggregate([
    { $match: { studyProgrammeCode: { $in: studyProgrammeCode } } },
    { $unwind: '$studyPeriods' },
    { $match: { 'studyPeriods.periodNumber': { $in: number } } },
    { $unwind: '$studyPeriods.courses' },
    {
      $lookup: {
        from: 'courses',
        localField: 'studyPeriods.courses',
        foreignField: '_id',
        as: 'coursesInPeriod',
      },
    },
    { $match: { 'coursesInPeriod.courseId': courseId } },
    { $unwind: '$coursesInPeriod' },
    { $unwind: '$coursesInPeriod.activities' },
    {
      $match: { $and: [{ 'coursesInPeriod.activities.name': 'kahoot', 'coursesInPeriod.activities.variant': 'quiz' }] },
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
  ]);

  const array = [];
  const arr = [];
  codes.forEach((code) =>
    studyProgrammeData.forEach(
      (data) =>
        code.studyProgrammeCode === data.studyProgrammeCode &&
        code.periodNumber === data.studyPeriods.periodNumber &&
        array.push(data.coursesInPeriod) &&
        arr.push(data.kahootsInPeriod),
    ),
  );
  // sort out unique courses from all studyProgrammes
  const uniqueCourses = getUniqueObjecs(array, 'courseId');
  const courses = uniqueCourses.map((course) => createCourseObject(course));

  // sort out all unique quizzes from all studyProgrammes
  const uniqueQuizzes = getUniqueObjecs(arr, 'quizId');
  const quizzes = uniqueQuizzes.map((quiz) => createQuizObject(quiz));
  res.status(201).json({ message: 'Course and quiz information found', courses: courses[0], quizzes });
};

//https://reactgo.com/removeduplicateobjects/
const getUniqueObjecs = (arr, comp) => {
  const unique = arr
    .map((e) => e[comp])
    .map((e, i, final) => final.indexOf(e) === i && i)
    .filter((e) => arr[e])
    .map((e) => arr[e]);
  return unique;
};

const createCourseObject = (item) => {
  return { courseId: item.courseId, name: item.name, code: item.code };
};

const createQuizObject = (item) => {
  return { title: item.title, quizId: item.quizId };
};
