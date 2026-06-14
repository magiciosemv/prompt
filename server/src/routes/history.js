import { Router } from 'express';

export const historyRouter = Router();

historyRouter.get('/history', (req, res) => {
  res.json([]);
});

historyRouter.delete('/history/:id', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});
