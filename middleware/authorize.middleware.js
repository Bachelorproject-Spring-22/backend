/*
 * @Author Cornflourblue
 * @Date June 17 2020
 * @Title Node.js + MongoDB API - JWT Authentication with Refresh Tokens
 * @Type Forum post code
 * @URL = https://jasonwatmore.com/post/2020/06/17/nodejs-mongodb-api-jwt-authentication-with-refresh-tokens
 */

import jwt from 'express-jwt';
const secret = process.env.TOKEN_SECRET;
import userModel from '../models/user.js';
import refreshTokenModel from '../models/refreshToken.js';

export default function authorize(roles = []) {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return [
    // authenticate JWT token and attach user to request object (req.user)
    jwt({ secret, algorithms: ['HS256'] }),

    // authorize based on user role
    async (req, res, next) => {
      const user = await userModel.findById(req.user._id);
      const refreshToken = await refreshTokenModel.find({ user: user.id });

      if (!user || (roles.length && !roles.includes(user.role))) {
        // user no longer exists or role not authorized
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // authentication and authorization successful
      req.user.role = user.role;
      req.user.ownsToken = (token) => !!refreshToken.find((x) => x.token === token);
      next();
    },
  ];
}
