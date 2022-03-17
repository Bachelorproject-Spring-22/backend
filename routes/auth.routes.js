import { Router } from 'express';
import Joi from 'joi';

const router = Router();

import '../middleware/authorize.middleware.js';
import { login, refreshToken, revokeToken } from '../controllers/auth.controllers.js';
import validateRequest from '../middleware/validate.middleware.js';
import { quizUpload } from '../controllers/employee.controllers.js';
import authorize from '../middleware/authorize.middleware.js';
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

router.get('/', (req, res) => res.status(200).json({ msg: 'check' }));

/**
 * POST: User Login
 * req.body = email, password
 */
router.post('/login', authenticateSchema, asyncMiddleware(login));

router.post('/upload', upload.single('file'), asyncMiddleware(quizUpload));

/**
 * POST: Refresh Token
 */
router.post('/api/refresh', asyncMiddleware(refreshToken));

/**
 * POST: Revoke token
 * Authorize: Restrict access to the route to authenticated users with specified roles
 */
router.post('/api/revoke', authorize(), asyncMiddleware(revokeToken));

export default router;

// Validate payload to ensure request body is valid
function authenticateSchema(req, _, next) {
  const schema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}
