import express from 'express';
import { createUser, createCourse } from '../controllers/superAdmin.controllers.js';

const router = express.Router();

//
// @USER
//

/**
 * POST
 * req.body = name, surname, role, password
 */
router.post('/users', createUser);

router.post('course', createCourse);

export default router;
