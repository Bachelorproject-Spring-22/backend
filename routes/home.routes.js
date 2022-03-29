import express from 'express';
import {
  userSpecificCourseAndRank,
  getUserSpecificCourseResultsLeaderBoard,
  getUserSpecificCourseResultsLeaderBoardQuiz,
} from '../controllers/home.controllers.js';
import asyncMiddleware from '../middleware/async.middleware.js';

const router = express.Router();

/**
  ROUTE Home '/home'
  GET /                                       | Current semester course name, code and quiz overall placement
  GET /:courseId                              | Course leaderboard top 3, individual quiz results
  GET /:courseId/:quizId                      | Individual quiz results
*/

router.get('/', asyncMiddleware(userSpecificCourseAndRank));

router.get('/:courseId', asyncMiddleware(getUserSpecificCourseResultsLeaderBoard));

router.get('/:courseId/:quizId', asyncMiddleware(getUserSpecificCourseResultsLeaderBoardQuiz));

export default router;
