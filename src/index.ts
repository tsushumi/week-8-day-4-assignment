import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import productsRouter from './routes/products';
import { ApiResponse } from './types';

const DEFAULT_PORT = 3001;
const PORT = Number(process.env.PORT) || DEFAULT_PORT;

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/products', productsRouter);

app.use((req: Request, res: Response<ApiResponse<never>>) => {
  res
    .status(404)
    .json({ success: false, error: `Route ${req.method} ${req.originalUrl} not found` });
});

app.use(
  (
    err: Error & { status?: number },
    _req: Request,
    res: Response<ApiResponse<never>>,
    _next: NextFunction,
  ) => {
    const status = err.status ?? 500;
    res.status(status).json({
      success: false,
      error: status === 500 ? 'Internal server error' : err.message,
    });
  },
);

if (require.main === module) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`TypeScript server running on port ${PORT}`);
  });
}

export default app;
