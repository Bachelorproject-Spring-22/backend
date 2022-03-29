import express from 'express';
import {
  createUser,
  createStudyProgramme,
  createCourse,
  updateStudyPeriodWithCourse,
  updateStudyProgrammeWithUsers,
} from '../controllers/superAdmin.controllers.js';
import asyncMiddleware from '../middleware/async.middleware.js';
import { updateUserWithStudyplan } from '../controllers/employee.controllers.js';

const router = express.Router();

/*
  ROUTE superAdmin '/superAdmin'
  POST /user                                  | Input: Username, role, email, password, programmeCode, year
  POST /course                                | Input: code, name, credits, year, semester, activities
  POST /programme                             | Input: ProgrammeCode, year, name, startTerm, semesters
  PATCH /programme/:studyProgrammeCode        | Input: array[username(s)]
  PATCH /programme/:courseId                  | Input: periodNumber, courseId
*/

router.post('/user', asyncMiddleware(createUser));

router.post('/course', asyncMiddleware(createCourse));

router.post('/studyprogramme', asyncMiddleware(updateUserWithStudyplan));

router.post('/programme', asyncMiddleware(createStudyProgramme));

router.patch('/programme/:studyProgrammeCode', asyncMiddleware(updateStudyProgrammeWithUsers));

router.patch('/programme/:studyProgrammeCode/:courseId', asyncMiddleware(updateStudyPeriodWithCourse));

export default router;
