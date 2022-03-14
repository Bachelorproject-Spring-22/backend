import { Router } from 'express';
import Joi from 'joi';

const router = Router();

import '../middleware/authorize.middleware.js';
import { login, refreshToken } from '../controllers/auth.controllers.js';
import validateRequest from '../middleware/validate.middleware.js';
import { quizUpload } from '../controllers/employee.controllers.js';
// const authorize = require('../middleware/authorize.middleware');

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

router.get('/', (req, res) => {
  return res.status(200).json({ msg: 'check' });
});
/**
 * POST: User Login
 * req.body = email, password
 */
router.post('/login', authenticateSchema, login);

router.post('/upload', upload.single('file'), quizUpload);
/**
 * POST: Revoke token
 * Authorize: Restrict access to the route to authenticated users with specified roles
 */
// router.post('/revoke', authorize(), auth.revokeToken);

/**
 * POST: Refresh Token
 */
router.post('/api/refresh', refreshToken);

export default router;

// Validate payload to ensure request body is valid
function authenticateSchema(req, _, next) {
  const schema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}