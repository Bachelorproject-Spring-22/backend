import express from 'express';

import { aggregateQuizScores } from '../controllers/employee.controllers.js';
import { userLeaderboard } from '../controllers/leaderboard.controllers.js';

const router = express.Router();

router.get('/', userLeaderboard);

export default router;
