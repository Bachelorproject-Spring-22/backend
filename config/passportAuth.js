
/***************************************************************************************
 *    Title: backend/controllers/auth.controller.js
 *    Author: Cornelius Sandmæl, Glenn Hansen, Tom Schrier
 *    Date: 13.05.2021
 *    Code version: 1.o
 *    Availability: https://github.com/Webproject-exam/backend/blob/main/auth/user.auth.js
 *
 ***************************************************************************************/

import passport from 'passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

const jwtStrategy = Strategy;
const jwtExtract = ExtractJwt;

import userModel from '../models/user.js';

export default passport.use(
  new jwtStrategy(
    {
      jwtFromRequest: jwtExtract.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.TOKEN_SECRET,
    },
    async (jwtPayload, done) => {
      try {
        const user = await userModel.findById(jwtPayload._id);
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);
