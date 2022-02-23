/*
 * @Author Cornflourblue
 * @Date June 17 2020
 * @Title Node.js + MongoDB API - JWT Authentication with Refresh Tokens
 * @Type Forum post code
 * @URL = https://jasonwatmore.com/post/2020/06/17/nodejs-mongodb-api-jwt-authentication-with-refresh-tokens
 */

import jwt from 'express-jwt';
const secret = process.env.TOKEN_SECRET;
import { findById } from '../models/User';
import { find } from '../models/RefreshToken';

export default function authorize(roles = []) {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return [
    jwt({ secret, algorithms: ['HS256'] }),

    async (req, res, next) => {
      const user = await findById(req.user._id);
      const refreshToken = await find({ user: user.id });

      if (!user || (roles.length && !roles.includes(user.role))) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      req.user.role = user.role;
      req.user.ownsToken = (token) =>
        !!refreshToken.find((x) => x.token === token);
      next();
    },
  ];
}
