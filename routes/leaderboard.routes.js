import express from 'express';

import { semesterLeaderboardAndUserCourses } from '../controllers/leaderboard.controllers.js';

const router = express.Router();

router.get('/', semesterLeaderboardAndUserCourses);

export default router;
