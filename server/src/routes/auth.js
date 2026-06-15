import { Router } from 'express';

export const authRouter = Router();

authRouter.post('/login', (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;

  if (!adminUser || !adminPass) {
    return res.status(500).json({ error: 'Server auth not configured' });
  }

  if (username === adminUser && password === adminPass) {
    return res.json({ success: true, username });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
});
