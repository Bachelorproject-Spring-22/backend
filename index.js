import dotenv from 'dotenv';

dotenv.config();
import express from 'express';
import passport from 'passport';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { connectToMongoDB } from './config/mongoose.js ';

import authRoute from './routes/auth.routes.js';
import userRoute from './routes/superAdmin.routes.js';
import leaderboardRoute from './routes/leaderboard.routes.js';

import './config/passportAuth.js';

import hasRole from './middleware/role.middleware.js';
/**
 * CookieParser: Read cookie information
 * Morgan: Easier to see what requests are sent via postman
 */
async function bootstrap() {
  // Init express
  const app = express();

  // Middlewares
  // parse request of content-type - application/json
  app.use(express.json({ limit: '50mb' }));
  // parse request of content-type - application/x-www-form-urlencoded
  app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
  app.use(cookieParser());

  if (process.env && process.env.NODE_ENV && process.env.NODE_ENV !== 'production') {
    app.use(cors({ credentials: true, origin: process.env.FRONTENDHOST }));
  } else {
    app.use(cors());
  }
  app.use(morgan('dev'));

  const authUser = passport.authenticate('jwt', { session: false });
  app.use('/', authRoute);
  app.use('/leaderboard', authUser, leaderboardRoute);
  //app.use('/superAdmin', userRoute);
  app.use('/superAdmin', authUser, hasRole.SuperAdmin, userRoute);

  app.listen(process.env.PORT, () =>
    console.log(`Server listening on PORT: ${process.env.PORT} | NODE_ENV: ${process.env.NODE_ENV.toUpperCase()}`),
  );

  //app.use((error, _, res, __) => res.status(error.status || 500).json({ error: 'Something went wrong' }));

  connectToMongoDB();
}

bootstrap();
