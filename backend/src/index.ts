import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import authRouter from './routes/auth';
import vapidRouter from './routes/vapid';
import subscriptionsRouter from './routes/subscriptions';
import notifyRouter from './routes/notify';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

app.use(
  cors({
    origin: isProduction ? false : 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api', vapidRouter);
app.use('/api', subscriptionsRouter);
app.use('/api', notifyRouter);

if (isProduction) {
  const publicDir = path.join(__dirname, '..', 'public');
  app.use(express.static(publicDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
