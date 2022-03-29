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

router.post('/user', asyncMiddleware(createUser));

router.post('/course', asyncMiddleware(createCourse));

router.post('/studyprogramme', asyncMiddleware(updateUserWithStudyplan));

router.post('/programme', asyncMiddleware(createStudyProgramme));

router.patch('/programme/:studyProgrammeCode', asyncMiddleware(updateStudyProgrammeWithUsers));

router.patch('/programme/:studyProgrammeCode/:courseId', asyncMiddleware(updateStudyPeriodWithCourse));

export default router;
