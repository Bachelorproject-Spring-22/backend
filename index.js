import dotenv from 'dotenv';

dotenv.config();
import express from 'express';
import passport from 'passport';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';

// Config
import { connectToMongoDB } from './config/mongoose.js ';
import './config/passportAuth.js';

// Routes
import authRoute from './routes/auth.routes.js';
import userRoute from './routes/superAdmin.routes.js';
import leaderboardRoute from './routes/leaderboard.routes.js';
import homeRoute from './routes/home.routes.js';
import manageRoute from './routes/manage.routes.js';

// Middleware
import hasRole from './middleware/role.middleware.js';

/**
 * CookieParser: Read cookie information
 * Morgan: Easier to see what requests are sent via postman
 */
async function bootstrap() {
  // Init express
  const app = express();
  app.use(helmet());

  // Middlewares
  // parse request of content-type - application/json
  app.use(express.json({ limit: '50mb' }));
  // parse request of content-type - application/x-www-form-urlencoded
  app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
  app.use(cookieParser());
  // Compress the response from backend to frontend | save bandwidth
  app.use(compression());

  if (process.env && process.env.NODE_ENV && process.env.NODE_ENV === 'production') {
    app.use(cors({ credentials: true, origin: process.env.FRONTENDHOST }));
  } else {
    app.use(cors());
  }
  app.use(morgan('dev')); //TODO: Change this before deploy

  const authUser = passport.authenticate('jwt', { session: false });

  app.use('/api/v1/', authRoute);
  app.use('/api/v1/home', authUser, homeRoute);
  app.use('/api/v1/leaderboard', authUser, leaderboardRoute);
  app.use('/api/v1/manage', authUser, hasRole.Employee, manageRoute);
  app.use('/api/v1/superAdmin', authUser, hasRole.SuperAdmin, userRoute);

  app.use((req, res, next) => {
    const error = new Error('Not Found!');
    error.status = 404;
    next(error);
  });

  app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
      error: {
        message: error.message,
      },
    });
  });

  app.listen(process.env.PORT || 5000, () =>
    console.log(`Server listening on PORT: ${process.env.PORT} | NODE_ENV: ${process.env.NODE_ENV.toUpperCase()}`),
  );
  connectToMongoDB();
}

bootstrap();
