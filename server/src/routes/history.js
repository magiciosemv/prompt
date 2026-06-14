import { Router } from 'express';
import { getDb } from '../db/index.js';

export const historyRouter = Router();

historyRouter.get('/history', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM optimizations ORDER BY created_at DESC LIMIT 50').all();
  res.json(rows);
});

historyRouter.delete('/history/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM optimizations WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Record not found' });
  }
  res.json({ success: true });
});
