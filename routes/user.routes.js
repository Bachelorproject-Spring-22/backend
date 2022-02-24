import express from 'express';
import { createUser } from '../controllers/user.controllers.js';

const router = express.Router();

//
// @USER
//

/**
 * POST
 * req.body = name, surname, role, password
 */
router.post('/users', createUser);

export default router;
