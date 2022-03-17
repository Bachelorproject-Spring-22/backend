import express from 'express';
import {
  userSpecificCourseAndRank,
  getUserSpecificCourseResultsLeaderBoard,
  getUserSpecificCourseResultsLeaderBoardQuiz,
} from '../controllers/home.controllers.js';
import asyncMiddleware from '../middleware/async.middleware.js';

const router = express.Router();

router.get('/', asyncMiddleware(userSpecificCourseAndRank));

router.get('/:courseId', asyncMiddleware(getUserSpecificCourseResultsLeaderBoard));

router.get('/:courseId/:quizId', asyncMiddleware(getUserSpecificCourseResultsLeaderBoardQuiz));

export default router;
