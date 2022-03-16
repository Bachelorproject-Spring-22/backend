import express from 'express';
import {
  userSpecificCourseAndRank,
  getUserSpecificCourseResultsLeaderBoard,
  getUserSpecificCourseResultsLeaderBoardQuiz,
} from '../controllers/home.controllers.js';

const router = express.Router();

router.get('/', userSpecificCourseAndRank);

router.get('/:courseId', getUserSpecificCourseResultsLeaderBoard);

router.get('/:courseId/:quizId', getUserSpecificCourseResultsLeaderBoardQuiz);

export default router;
