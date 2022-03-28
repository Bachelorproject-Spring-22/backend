import express from 'express';
import { updateUserWithCourses, updateUserWithStudyplan } from '../controllers/employee.controllers.js';
import asyncMiddleware from '../middleware/async.middleware.js';

const router = express.Router();

router.post('/course', asyncMiddleware(updateUserWithCourses));
router.post('/programme', asyncMiddleware(updateUserWithStudyplan));

export default router;
