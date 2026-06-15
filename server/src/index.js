import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { optimizeRouter } from './routes/optimize.js';
import { historyRouter } from './routes/history.js';
import { authRouter } from './routes/auth.js';
import { initDb } from './db/index.js';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

initDb();

app.use('/api', authRouter);
app.use('/api', optimizeRouter);
app.use('/api', historyRouter);

const __dirname = dirname(fileURLToPath(import.meta.url));

// Serve React build in production
const clientBuildPath = join(__dirname, '../../client/dist');
if (existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(join(clientBuildPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
