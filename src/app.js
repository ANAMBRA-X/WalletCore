import express from 'express';
import walletRouter from './routes/wallet.route.js';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'wallet API',
    status: 'running',
  });
});

app.use('/', walletRouter);

export default app;
