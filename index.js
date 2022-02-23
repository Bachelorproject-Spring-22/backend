import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

dotenv.config();
/**
 * CookieParser: Read cookie information
 * Morgan: Easier to see what requests are sent via postman
 */
async function bootstrap() {
  // Init express
  const app = express();
  app.use(cookieParser());
  if (
    process.env &&
    process.env.NODE_ENV &&
    process.env.NODE_ENV !== 'production'
  ) {
    app.use(cors({ credentials: true, origin: process.env.FRONTENDHOST }));
  } else {
    app.use(cors());
  }
  app.use(morgan('dev'));

  const port = process.env.PORT;
  app.listen(port, () => console.log(`Server listening on ${port}`));

  app.use((error, _, res, __) =>
    res.status(error.status || 500).json({ error }),
  );
}

bootstrap();
