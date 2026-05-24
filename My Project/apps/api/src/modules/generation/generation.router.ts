import { Router } from 'express';
import { handleGenerate, handleGetGeneration } from './generation.controller';
import { optionalAuth } from '../../middleware/auth';
import { rateLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.post('/', optionalAuth, rateLimiter, handleGenerate);
router.get('/:projectId', handleGetGeneration);

export default router;

