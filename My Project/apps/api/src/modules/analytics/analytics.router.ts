import { Router } from 'express';
import { trackEvent, getAnalytics, getAISuggestions } from './analytics.controller';

const router = Router();

router.post('/event', trackEvent);
router.get('/:projectId', getAnalytics);
router.get('/:projectId/suggestions', getAISuggestions);

export default router;

