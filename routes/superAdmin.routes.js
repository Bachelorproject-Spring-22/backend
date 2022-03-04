import express from 'express';
import { createUser, createProgramme, getSemesterData, createCourse } from '../controllers/superAdmin.controllers.js';

const router = express.Router();

//
// @USER
//

/**
 * POST
 * req.body = name, surname, role, password
 */
router.post('/users', createUser);

router.post('/programme', createProgramme);

router.post('/course', createCourse);

router.post('/test', getSemesterData);

export default router;
