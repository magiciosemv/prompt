import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { optimizeRouter } from './routes/optimize.js';
import { historyRouter } from './routes/history.js';
import { initDb } from './db/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

initDb();

app.use('/api', optimizeRouter);
app.use('/api', historyRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
