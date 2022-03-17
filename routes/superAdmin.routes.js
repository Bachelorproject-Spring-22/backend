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
router.post('/users', asyncMiddleware(createUser));

router.post('/user', asyncMiddleware(updateStudyProgrammeWithUsers));

router.post('/programme', asyncMiddleware(createStudyProgramme));

router.post('/course', asyncMiddleware(createCourse));

router.post('/update', asyncMiddleware(updateStudyPeriodWithCourse));

export default router;
