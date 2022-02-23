const passport = require('passport');
const jwt = require('passport-jwt');

const jwtStrategy = jwt.Strategy;
const jwtExtract = jwt.ExtractJwt;

const User = require('../models/User');

passport.use(
  new jwtStrategy(
    {
      jwtFromRequest: jwtExtract.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.TOKEN_SECRET,
    },
    (jwtPayload, done) => {
      return User.findById(jwtPayload._id)
        .then((user) => {
          return done(null, user);
        })
        .catch((error) => {
          return done(error);
        });
    },
  ),
);
