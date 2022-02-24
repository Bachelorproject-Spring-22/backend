/*
 * @Author Cornflourblue
 * @Date June 17 2020
 * @Title Node.js + MongoDB API - JWT Authentication with Refresh Tokens
 * @Type Forum post code
 * @URL = https://jasonwatmore.com/post/2020/06/17/nodejs-mongodb-api-jwt-authentication-with-refresh-tokens
 */

// Validate request against a JOI schema object

export default function validateRequest(req, next, schema) {
  const options = {
    abortEarly: false,
    allowUnknown: true,
    stripUnkown: true,
  };
  const { error, value } = schema.validate(req.body, options);
  if (error) {
    next(`Validation error: ${error.details.map((x) => x.message).join(', ')}`);
  } else {
    req.body = value;
    next();
  }
}
