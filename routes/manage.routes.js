import express from 'express';
import { updateUserWithStudyplan } from '../controllers/employee.controllers.js';
import asyncMiddleware from '../middleware/async.middleware.js';

const router = express.Router();
router.post('/programme', asyncMiddleware(updateUserWithStudyplan));

export default router;
