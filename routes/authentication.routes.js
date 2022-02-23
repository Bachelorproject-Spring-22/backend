import { Router } from 'express';
import Joi from 'joi';

const router = Router();

import '../middleware/authorize.middleware.js';
// const authorize = require('../middleware/authorize.middleware');
// const auth = require('../controllers/auth.controller');

router.get('/', (req, res) => {
  res.status(200).json({ error: 'Hello this is a test' });
});
/**
 * POST: User Login
 * req.body = email, password
 */
router.post('/login', authenticateSchema);

/**
 * POST: Revoke token
 * Authorize: Restrict access to the route to authenticated users with specified roles
 */
// router.post('/revoke-token', authorize(), auth.revokeToken);

/**
 * POST: Refresh Token
 */
// router.post('/refresh-token', auth.refreshToken);

export default router;

// Validate payload to ensure request body is valid
function authenticateSchema(req, _, next) {
  const schema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}
