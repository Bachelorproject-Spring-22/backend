import express from 'express';
import {
  updateUserWithStudyplan,
  deleteQuizFromCourse,
  quizUpload,
  getAllStudyPlans,
  getUserSpecificCourse,
  getUserSpecificCourseAndQuiz,
  removeUserFromStudyplan,
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

/*
  ROUTE Manage '/manage'
  POST /                                      | Input: File && courseId
  GET /                                       | Get course ids from admin user
  GET /programme                              | Get all studyplans
  POST /programme                             | Input: array of studyProgrammeCode(s)
  GET /courses                                | Get course info from user subscribed studyplans
  GET /courses/:courseId                      | Get course and quiz info from user subscribed studyplans
  DELETE /courses/:courseId/:quizId'          | Params: courseId && quizId
*/

router.post('/', upload.single('file'), asyncMiddleware(quizUpload));
router.get('/', asyncMiddleware(getUserSpecificCourse));

router.get('/programme', asyncMiddleware(getAllStudyPlans));
router.post('/programme', asyncMiddleware(updateUserWithStudyplan));
router.delete('/programme', asyncMiddleware(removeUserFromStudyplan));

router.get('/courses', asyncMiddleware(getUserSpecificCourse));
router.get('/courses/:courseId', asyncMiddleware(getUserSpecificCourseAndQuiz));

router.delete('/courses/:courseId/:quizId', asyncMiddleware(deleteQuizFromCourse));

export default router;
