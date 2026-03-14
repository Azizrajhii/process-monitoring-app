import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendResetPasswordEmail } from '../services/email.service.js';

const generateToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET || 'dev-jwt-secret-change-me',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
  );

const hashResetToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

export const register = async (req, res, next) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'fullName, email et password sont requis.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Un utilisateur avec cet email existe deja.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role,
    });

    return res.status(201).json({
      success: true,
      message: 'Utilisateur cree avec succes.',
      token: generateToken(user),
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'email et password sont requis.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Connexion reussie.',
      token: generateToken(user),
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getUsers = async (_req, res, next) => {
  try {
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    return next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'email est requis.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Aucun utilisateur trouve avec cet email.',
      });
    }

    const rawResetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = hashResetToken(rawResetToken);
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${rawResetToken}`;

    try {
      await sendResetPasswordEmail({
        to: user.email,
        fullName: user.fullName,
        resetUrl,
      });
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message:
          emailError.message ||
          'Impossible d\'envoyer l\'email de reinitialisation.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Lien de reinitialisation envoye par email.',
    });
  } catch (error) {
    return next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'token et password sont requis.',
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caracteres.',
      });
    }

    const user = await User.findOne({
      resetPasswordToken: hashResetToken(token),
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token invalide ou expire.',
      });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Mot de passe reinitialise avec succes.',
      token: generateToken(user),
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
};
