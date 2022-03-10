import express from 'express';
import {
  createUser,
  createProgramme,
  getSemesterData,
  createCourse,
  updateCourseGroupWithCourse,
  updateProgrammeWithUsers,
} from '../controllers/superAdmin.controllers.js';

const router = express.Router();

//
// @USER
//

/**
 * POST
 * req.body = name, surname, role, password
 */
router.post('/users', createUser);

router.post('/user', updateProgrammeWithUsers);

router.post('/programme', createProgramme);

router.post('/course', createCourse);

router.post('/update', updateCourseGroupWithCourse);

router.post('/test', getSemesterData);

export default router;
