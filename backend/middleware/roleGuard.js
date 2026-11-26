'use strict';

/**
 * Role-based access control middleware factory.
 * Usage: roleGuard('admin') or roleGuard('admin', 'guard')
 */
const roleGuard = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access restricted. Requires role: [${allowedRoles.join(' | ')}].`,
      });
    }
    next();
  };
};

module.exports = { roleGuard };
