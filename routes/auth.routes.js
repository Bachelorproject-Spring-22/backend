import { Router } from 'express';
import Joi from 'joi';

const router = Router();

import '../middleware/authorize.middleware.js';
import { login, refreshToken, revokeToken } from '../controllers/auth.controllers.js';
import validateRequest from '../middleware/validate.middleware.js';

import authorize from '../middleware/authorize.middleware.js';
import asyncMiddleware from '../middleware/async.middleware.js';

/*
  ROUTE Auth '/'
  GET /                                       | Used to check connection
  POST /login                                 | Input: Username && password
  POST /refresh                               | Input: HTTPOnly cookie
  POST /revoke                                | Input: HTTPOnly cookie
*/

router.get('/', authorize(), (req, res) => res.status(200).json({ msg: 'check' }));

router.post('/login', authenticateSchema, asyncMiddleware(login));

router.post('/refresh', asyncMiddleware(refreshToken));

router.post('/revoke', authorize(), asyncMiddleware(revokeToken));

export default router;

// Validate payload to ensure request body is valid
function authenticateSchema(req, _, next) {
  const schema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}
