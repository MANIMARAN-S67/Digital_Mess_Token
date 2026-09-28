export const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ success: false, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to perform this action', code: 'FORBIDDEN' });
    }

    next();
  };
};
