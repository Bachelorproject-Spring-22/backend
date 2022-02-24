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
