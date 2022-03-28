// Node modules
import dotenv from 'dotenv';

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import studyProgrammeModel from '../models/studyProgramme.js';
import generateJwtToken from '../utils/generateTokens.js';

import { createBadRequest, createNotFound } from '../utils/errors.js';

dotenv.config();
// Local files
import refreshTokenModel from '../models/refreshToken.js';
import userModel from '../models/user.js';

// User login with username and password
export const login = async (req, res, next) => {
  const { username, password } = req.body;
  const ipAddress = req.ip;

  if (!username || !password) return next(createBadRequest('Provided username and password'));

  const user = await userModel.findOne({ username });
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return next(createBadRequest('Wrong email and/or password. Please try again.'));
  }

  const jwtToken = generateJwtToken(user);
  const refreshToken = generateRefreshToken(user, ipAddress);
  await refreshToken.save();
  setTokenCookie(res, refreshToken.token);

  res.status(200).json({
    message: 'User logged in successfully',
    role: user.role,
    jwtToken,
  });
};

export const refreshToken = async (req, res, next) => {
  const token = req.cookies.refreshToken;
  const ipAddress = req.ip;
  // Generates refresh token using user information and ip address
  // revokes old refresh token (if any)
  // saves new and old refresh token
  // Generates and returns new JWT token (valid for 15 minutes)
  const refreshToken = await getRefreshToken(token);
  // destructure user out of refreshToken
  const { user } = refreshToken;
  if (!user) return next(createUnauthorized());

  const newRefreshToken = generateRefreshToken(user, ipAddress);
  refreshToken.revoked = Date.now();
  refreshToken.revokedByIp = ipAddress;
  refreshToken.replacedByIp = newRefreshToken.token;
  await refreshToken.save();
  await newRefreshToken.save();

  const jwtToken = generateJwtToken(user);

  setTokenCookie(res, newRefreshToken.token);
  res.status(200).json({
    message: 'Token refreshed successfully',
    user: user.username,
    jwtToken,
  });
};

export const revokeToken = async (req, res, next) => {
  // Accept token from request body or cookie
  const token = req.cookies.refreshToken || req.body.token;
  const ipAddress = req.ip;

  if (!token) return next(createBadRequest('Token is required'));

  // Users can revoke their own token and Managers can revoke any tokens
  if (!req.user.ownsToken(token) && req.user.role !== 'superAdmin') {
    return next(createUnauthorized());
  }

  // Get refreshtoken using helper function
  // Set revoked information and save

  const refreshToken = await getRefreshToken(token);
  if (!refreshToken) return next(createNotFound('Refresh token not found'));

  refreshToken.revoked = Date.now();
  refreshToken.revokedByIp = ipAddress;
  await refreshToken.save();

  res.status(200).json({
    message: 'Token revoked successfully',
    user: refreshToken.user.username,
  });
};

// helper functions
function setTokenCookie(res, token) {
  // Create cookie with refresh token that expires in 7 days
  //@DEVELOPMENT
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + process.env.REFRESH_TOKEN_EXP_SEVEN_DAYS),
    secure: false,
  };
  res.cookie('refreshToken', token, cookieOptions);
}

async function getRefreshToken(token) {
  const refreshToken = await refreshTokenModel.findOne({ token }).populate('user');
  if (!refreshToken || !refreshToken.isActive) throw 'Invalid token';
  return refreshToken;
}

function generateRefreshToken(user, ipAddress) {
  return new refreshTokenModel({
    user: user.id,
    token: randomTokenString(),
    expires: Date.now() + parseInt(process.env.REFRESH_TOKEN_EXP_SEVEN_DAYS),
    createdByIp: ipAddress,
  });
}

function randomTokenString() {
  return crypto.randomBytes(40).toString('hex'); // generates random hex string
}
