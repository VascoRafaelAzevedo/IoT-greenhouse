
import jwt from "jsonwebtoken"; // IMPORTANT

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return res.status(401).json({ error: 'No token provided' });

  const secret =process.env.JWT_SECRET|| 'veryverycomplicatedsecret'
  jwt.verify(token, secret, (err, user) => {
    if (err) return res.status(403).json({ error: err.message });
    req.user = user; 
    next();
  });
};