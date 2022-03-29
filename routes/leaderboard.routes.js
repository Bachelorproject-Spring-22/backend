import express from 'express';

import {
  semesterLeaderboardAndUserCourses,
  courseSpecificLeaderboard,
  selectQuizSnapshot,
} from '../controllers/leaderboard.controllers.js';
import asyncMiddleware from '../middleware/async.middleware.js';

const router = express.Router();

/*
  ROUTE leaderboard '/leaderboard'
  GET /                                       | Current semester course name, code and quiz overall placement
  GET /:courseId                              | Course leaderboard top 3, individual quiz results
  POST /:courseId                             | Input: startDate, endDate
*/

router.get('/', asyncMiddleware(semesterLeaderboardAndUserCourses));

router.get('/:courseId', asyncMiddleware(courseSpecificLeaderboard));

router.post('/:courseId', asyncMiddleware(selectQuizSnapshot));

export default router;
