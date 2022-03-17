import express from 'express';
import {
  createUser,
  createStudyProgramme,
  createCourse,
  updateStudyPeriodWithCourse,
  updateStudyProgrammeWithUsers,
} from '../controllers/superAdmin.controllers.js';
import asyncMiddleware from '../middleware/async.middleware.js';

const router = express.Router();

/**
 * POST
 * req.body = name, surname, role, password
 */
router.post('/user', asyncMiddleware(createUser));

router.post('/course', asyncMiddleware(createCourse));

router.post('/programme', asyncMiddleware(createStudyProgramme));

router.patch('/programme/:studyProgrammeCode', asyncMiddleware(updateStudyProgrammeWithUsers));

router.patch('/programme/:courseId', asyncMiddleware(updateStudyPeriodWithCourse));

export default router;
