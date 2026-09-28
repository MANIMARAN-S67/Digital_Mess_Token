import express from 'express';
import { authenticateFirebase } from '../middleware/authenticateFirebase.js';

const router = express.Router();

router.get('/me', authenticateFirebase, (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
});

export default router;
