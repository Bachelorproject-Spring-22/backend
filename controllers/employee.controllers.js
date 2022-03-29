import userModel from '../models/user.js';
import studyProgrammeModel from '../models/studyProgramme.js';
import courseModel from '../models/course.js';
import kahootModel from '../models/kahoot.js';
import generateJwtToken from '../utils/generateTokens.js';
import mongoose from 'mongoose';

import { createBadRequest, createNotFound } from '../utils/errors.js';

const ObjectId = mongoose.Types.ObjectId;

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
