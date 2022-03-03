export const SuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'superAdmin') {
    next();
  } else {
    next('You are not a super admin');
  }
};

export const Teacher = (req, res, next) => {
  if ((!req.user && !req.user.role === 'teacher') || (!req.user && !req.user.role === 'superAdmin')) {
    next({ error: 'You are not a teacher' });
  }
  next();
};

export const Student = (req, res, next) => {
  if (!req.user) {
    next({ error: 'You are not a student' });
  }
  next();
};

export const Admin = (req, res, next) => {
  if ((req.user && req.user.role === 'teacher') || (req.user && req.user.role === 'superAdmin')) {
    next();
  } else {
    next('You are not an admin');
  }
};

export default { Teacher, SuperAdmin, Student, Admin };
