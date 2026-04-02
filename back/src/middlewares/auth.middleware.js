import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('La variable JWT_SECRET est requise.');
  }
  return secret;
};

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant ou format invalide.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret());

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur associe au token introuvable.',
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Compte desactive. Contactez un manager.',
      });
    }

    req.user = user;
    return next();
  } catch (_error) {
    return res.status(401).json({
      success: false,
      message: 'Token invalide ou expire.',
    });
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé : vous n\'avez pas la permission d\'effectuer cette action.',
      });
    }
    return next();
  };
};
