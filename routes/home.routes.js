import express from 'express';
import { userSpecificCourseAndRank, getUserSpecificCourseResults } from '../controllers/home.controllers.js';

const router = express.Router();

router.get('/', userSpecificCourseAndRank);

router.get('/:courseId', getUserSpecificCourseResults);

export default router;
