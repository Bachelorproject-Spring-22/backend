// Models
import userModel from '../models/user.js';
import studyProgrammeModel from '../models/studyProgramme.js';
import courseModel from '../models/course.js';
import kahootModel from '../models/kahoot.js';

// Utils
import generateJwtToken from '../utils/generateTokens.js';
import calculateSemester from '../utils/calculateSemester.js';
import { createBadRequest, createNotFound } from '../utils/errors.js';

// Misc
import { readDataFromExcel } from '../config/excelToJson.js';

export const quizUpload = async (req, res, next) => {
  const filePath = req.file;
  const courseId = req.body.courseId;

  if (!courseId) return next(createNotFound('Course id not found'));
  if (!filePath) return next(createNotFound('File not found'));

  const name = 'kahoot';
  const variant = 'quiz';

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

  // Remove spaces and insert _ for title
  const titleFromExcel = dataFromExcel['Overview'][0].A;
  var sanitized = titleFromExcel.replace(/[^\w\s]/gi, '');
  const title = sanitized.replace(/\s+/g, '_');

  // https://stackoverflow.com/questions/38735927/add-offset-to-utc-date-in-javascript
  // Add one hour to playedOn because of timezone difference
  const utc = dataFromExcel['Overview'][1].B;
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

  // Save kahoot and ppopulate course with quiz reference
  await kahoot.save().then(async ({ _id }) => {
    await courseModel.updateOne(
      { courseId },
      { $push: { 'activities.$[activities].sources': _id } },
      { arrayFilters: [{ 'activities.name': name }] },
    );
  });
  res.status(201).json({ message: 'Quiz uploaded successfully' });
};

export const updateUserWithStudyplan = async (req, res, next) => {
  const { studyProgrammeCode } = req.body;
  const user = req.user;
  const { username } = user;

  if (!studyProgrammeCode) return next(createNotFound('StudyProgramme not found'));

  const userToUpdate = await userModel.findOne({ username }, { studyProgrammes: 1 }).sort({ _id: 1 }).lean();
  if (!userToUpdate) return next(createBadRequest('User does not exist'));

  const checkStudyProgramme = await studyProgrammeModel.find({ studyProgrammeCode }).lean();
  if (checkStudyProgramme.length === 0) return next(createBadRequest('Studyplan(s) does not exist'));

  const checkIfStudyProgrammeIsAddedToUser = [];
  studyProgrammeCode.forEach((studyProgramme) => {
    userToUpdate.studyProgrammes.forEach((userStudyProgramme) => {
      if (userStudyProgramme === studyProgramme) return checkIfStudyProgrammeIsAddedToUser.push(studyProgramme);
    });
  });

  if (checkIfStudyProgrammeIsAddedToUser.length !== 0)
    return next(
      createBadRequest(`Remove following studyProgrammeCode(s) from input [${checkIfStudyProgrammeIsAddedToUser}]`, {
        studyProgramme: checkIfStudyProgrammeIsAddedToUser,
      }),
    );

  // studyProgrammes that will be added to user
  const studyProgrammes = studyProgrammeCode.filter((studyProgramme) =>
    userToUpdate.studyProgrammes.filter((data) => studyProgramme !== data),
  );

  // Filter to get studyProgramme data
  const studyProgramme = checkStudyProgramme.filter((data) => data.studyProgrammeCode === studyProgrammes[0]);

  // Update default studyProgrammeCode and year on user if studyProgrammes is empty else update studyprogrammes on user
  // Generate new JWT with updated information
  let jwtToken;
  userToUpdate.studyProgrammes.length === 0
    ? await userModel
        .updateOne(
          { username },
          {
            $push: { studyProgrammes },
            programmeCode: studyProgramme[0].studyProgrammeCode,
            year: studyProgramme[0].year,
          },
        )
        .then(
          (jwtToken = generateJwtToken(
            user,
            studyProgramme[0].studyProgrammeCode,
            studyProgramme[0].year,
            studyProgrammes,
          )),
        )
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

  // fetch all studyProgrammes from the database
  const studyProgrammeCodes = await studyProgrammeModel.find({}, { studyProgrammeCode: 1, _id: 0 });
  if (!studyProgrammeCodes) return next(createNotFound('Studyprogrammes not found'));

  res.status(201).json({
    message: 'All studyProgrammeCodes',
    studyProgrammeCodes,
    currentStudyProgrammes: user.studyProgrammes,
  });
};

export const getUserSpecificCourse = async (req, res, next) => {
  const user = req.user;
  const studyProgrammeCode = user.studyProgrammes;

  if (!user) next(createNotFound('User not found'));
  if (!user.studyProgrammes) next(createNotFound('StudyProgrammes not found'));

  let studyProgrammeCodes = [];
  let periodNumbers = [];

  // Calculate current semester for each studyprogramme the user has subscribed to
  studyProgrammeCode.forEach((code) => {
    let filterOutString = code.match(/\d+/g);
    let createYear = `20${filterOutString}`;
    let periodNumber = calculateSemester(createYear);

    studyProgrammeCodes.push({ studyProgrammeCode: code, periodNumber });
    periodNumbers.push(periodNumber);
  });

  // Fetch courses from each studyplan current semester
  const studyProgrammeData = await studyProgrammeModel.aggregate([
    { $match: { studyProgrammeCode: { $in: studyProgrammeCode } } },
    { $unwind: '$studyPeriods' },
    { $match: { 'studyPeriods.periodNumber': { $in: periodNumbers } } },
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

  const courses = [];

  // Check if user studyProgramme and fetched studyprogramme is matching then push coursesInPeriod for current semester
  studyProgrammeCodes.forEach((userStudyProgramme) =>
    studyProgrammeData.forEach(
      (fetchedStudyProgramme) =>
        userStudyProgramme.studyProgrammeCode === fetchedStudyProgramme.studyProgrammeCode &&
        userStudyProgramme.periodNumber === fetchedStudyProgramme.studyPeriods.periodNumber &&
        courses.push(fetchedStudyProgramme.coursesInPeriod),
    ),
  );

  // Filter out unique course ids from user subscribed studyplans (Same course can be added to different studyplans)
  const unique = getUniqueObjecs(courses, 'courseId');
  const courseIds = unique.map((course) => createCourseObject(course));

  res.status(201).json({ message: 'CourseId(s) found', courseIds });
};

export const getUserSpecificCourseAndQuiz = async (req, res, next) => {
  const { courseId } = req.params;
  const user = req.user;
  const studyProgrammeCode = user.studyProgrammes;

  if (!courseId) return next(createNotFound('Course not found'));
  if (!user) return next(createNotFound('User not found'));
  if (!user.studyProgrammes) next(createNotFound('StudyProgrammes not found'));

  let codes = [];
  let number = [];

  // Calculate current semester for each studyprogramme the user has subscribed to
  studyProgrammeCode.forEach((code) => {
    let filterOutstring = code.match(/\d+/g);
    let createYear = `20${filterOutstring}`;
    let periodNumber = calculateSemester(createYear);
    codes.push({ studyProgrammeCode: code, periodNumber });
    number.push(periodNumber);
  });

  // Fetch courses and quizzes from each studyplan current semester
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

  const courseArray = [];
  const quizArray = [];
  // Check if user studyProgramme and fetched studyprogramme is matching then push coursesInPeriod for current semester
  codes.forEach((code) =>
    studyProgrammeData.forEach(
      (data) =>
        code.studyProgrammeCode === data.studyProgrammeCode &&
        code.periodNumber === data.studyPeriods.periodNumber &&
        courseArray.push(data.coursesInPeriod) &&
        quizArray.push(data.kahootsInPeriod),
    ),
  );
  // Sort out unique courses from all studyProgrammes
  const uniqueCourses = getUniqueObjecs(courseArray, 'courseId');
  const courses = uniqueCourses.map((course) => createCourseObject(course));

  // Sort out all unique quizzes from all studyProgrammes
  const uniqueQuizzes = getUniqueObjecs(quizArray, 'quizId');
  const quizzes = uniqueQuizzes.map((quiz) => createQuizObject(quiz));

  res.status(201).json({ message: 'Course and quiz information found', courses, quizzes });
};

// Helper functions

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
