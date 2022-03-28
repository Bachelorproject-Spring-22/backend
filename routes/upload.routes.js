import express from 'express';
import asyncMiddleware from '../middleware/async.middleware.js';
import { quizUpload } from '../controllers/upload.controllers.js';
import { getUserSpecificCourseAndStudyprogrammeCode } from '../controllers/upload.controllers.js';

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

export default router;
