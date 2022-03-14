import express from 'express';

import { semesterLeaderBoard } from '../controllers/leaderboard.controllers.js';

const router = express.Router();

router.get('/', semesterLeaderBoard);

export default router;
