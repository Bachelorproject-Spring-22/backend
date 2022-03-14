import express from 'express';
import { userSpecificCourseAndRank } from '../controllers/home.controllers.js';

const router = express.Router();

router.get('/', userSpecificCourseAndRank);

export default router;
