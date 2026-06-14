import { Router } from 'express';

export const optimizeRouter = Router();

optimizeRouter.post('/optimize', async (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});
