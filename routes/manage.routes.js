import express from 'express';
import {
  updateUserWithStudyplan,
  deleteQuizFromCourse,
  quizUpload,
  getUserSpecificCourseAndStudyprogrammeCode,
  getAllStudyPlans,
} from '../controllers/employee.controllers.js';
import asyncMiddleware from '../middleware/async.middleware.js';

import multer from 'multer';

const fileStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './tmp');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: fileStorageEngine });
const router = express.Router();

router.post('/', upload.single('file'), asyncMiddleware(quizUpload));

router.get('/', asyncMiddleware(getUserSpecificCourseAndStudyprogrammeCode));

router.get('/programme', asyncMiddleware(getAllStudyPlans));
router.post('/programme', asyncMiddleware(updateUserWithStudyplan));

router.delete('/courses/:courseId/:quizId', asyncMiddleware(deleteQuizFromCourse));

export default router;
