import express from 'express';
import { userSpecificCourseAndRank, getUserSpecificCourseResultsLeaderBoard } from '../controllers/home.controllers.js';

const router = express.Router();

router.get('/', userSpecificCourseAndRank);

router.get('/:courseId', getUserSpecificCourseResultsLeaderBoard);

export default router;
