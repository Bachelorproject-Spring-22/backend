import express from 'express';

import {
  semesterLeaderboardAndUserCourses,
  courseSpecificLeaderboard,
} from '../controllers/leaderboard.controllers.js';

const router = express.Router();

router.get('/', semesterLeaderboardAndUserCourses);

router.get('/:courseId', courseSpecificLeaderboard);

export default router;
