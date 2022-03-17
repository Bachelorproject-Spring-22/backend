let error = {};

// ERROR

export const createBadRequest = (message, object) => {
  error.status = 400;
  error.message = message;
  return error, object;
};

export const createUnauthorized = () => {
  error.status = 401;
  error.message = 'Unauthorized';
  return error;
};

export const createNotFound = (message) => {
  error.status = 404;
  error.message = message;
  return error;
};
