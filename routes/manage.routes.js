import express from 'express';
import { updateUserWithStudyplan, deleteQuizFromCourse } from '../controllers/employee.controllers.js';
import asyncMiddleware from '../middleware/async.middleware.js';

const router = express.Router();
router.post('/programme', asyncMiddleware(updateUserWithStudyplan));

router.delete('/courses/:courseId/:quizId', asyncMiddleware(deleteQuizFromCourse));

export default router;
