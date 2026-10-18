import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'loksangam-mern-super-secret-key-2026';

export function authRequired(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // ignore invalid token in optional auth
    }
  }
  next();
}

export { JWT_SECRET };
