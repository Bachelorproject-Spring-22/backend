import express from 'express';
import {
  createUser,
  createStudyProgramme,
  getSemesterData,
  createCourse,
  updateStudyPeriodWithCourse,
  updateStudyProgrammeWithUsers,
} from '../controllers/superAdmin.controllers.js';

const router = express.Router();

/**
 * POST
 * req.body = name, surname, role, password
 */
router.post('/users', createUser);

router.post('/user', updateStudyProgrammeWithUsers);

router.post('/programme', createStudyProgramme);

router.post('/course', createCourse);

router.post('/update', updateStudyPeriodWithCourse);

router.post('/test', getSemesterData);

export default router;
