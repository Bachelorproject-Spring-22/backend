import express from 'express';

import {
  semesterLeaderboardAndUserCourses,
  courseSpecificLeaderboard,
  selectQuizSnapshot,
} from '../controllers/leaderboard.controllers.js';
import asyncMiddleware from '../middleware/async.middleware.js';

const router = express.Router();

router.get('/', asyncMiddleware(semesterLeaderboardAndUserCourses));

router.get('/:courseId', asyncMiddleware(courseSpecificLeaderboard));

router.post('/:courseId', asyncMiddleware(selectQuizSnapshot));

export default router;
