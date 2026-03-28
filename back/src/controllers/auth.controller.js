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

const ALLOWED_ROLES = ['operator', 'quality', 'manager'];

export const register = async (req, res, next) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'fullName, email et password sont requis.',
      });
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Le role est requis.',
      });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide.',
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

// ─── User management (manager only) ───────────────────────────────────────────

export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'fullName, email et password sont requis.',
      });
    }

    if (role && !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: 'Rôle invalide.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role: role || 'operator',
    });

    return res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès.',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { fullName, role, isActive } = req.body;

    if (role && !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: 'Rôle invalide.' });
    }

    // Prevent manager from deactivating or demoting themselves
    if (req.params.id === String(req.user._id)) {
      if (isActive === false) {
        return res.status(400).json({
          success: false,
          message: 'Vous ne pouvez pas désactiver votre propre compte.',
        });
      }
      if (role && role !== req.user.role) {
        return res.status(400).json({
          success: false,
          message: 'Vous ne pouvez pas modifier votre propre rôle.',
        });
      }
    }

    const updates = {};
    if (fullName !== undefined) updates.fullName = fullName;
    if (role !== undefined) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }

    return res.status(200).json({ success: true, message: 'Utilisateur mis à jour.', user });
  } catch (error) {
    return next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte.',
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }

    return res.status(200).json({ success: true, message: 'Utilisateur supprimé.' });
  } catch (error) {
    return next(error);
  }
};

// ─── Current user profile ─────────────────────────────────────────────────────

export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      role: req.user.role,
      isActive: req.user.isActive,
      createdAt: req.user.createdAt,
    },
  });
};

export const updateMe = async (req, res, next) => {
  try {
    const { fullName, email, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    if (fullName !== undefined) {
      const normalizedFullName = String(fullName).trim();
      if (!normalizedFullName) {
        return res.status(400).json({
          success: false,
          message: 'Le nom complet est requis.',
        });
      }
      user.fullName = normalizedFullName;
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!normalizedEmail || !/\S+@\S+\.\S+/.test(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Email invalide.',
        });
      }

      if (normalizedEmail !== user.email) {
        const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
        if (existing) {
          return res.status(409).json({
            success: false,
            message: 'Un utilisateur avec cet email existe deja.',
          });
        }
        user.email = normalizedEmail;
      }
    }

    if (newPassword) {
      if (user.password && !currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe actuel est requis pour en définir un nouveau.',
        });
      }

      if (user.password) {
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return res.status(400).json({
            success: false,
            message: 'Mot de passe actuel incorrect.',
          });
        }
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.',
        });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profil mis à jour.',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// ─── OAuth Login (Google & Facebook) ──────────────────────────────────────────

export const loginWithGoogle = async (req, res, next) => {
  try {
    const { googleId, email, fullName, role } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({
        success: false,
        message: 'googleId et email sont requis.',
      });
    }

    // Find or create user with Google ID
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if email exists from another provider
      user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        if (!role) {
          return res.status(400).json({
            success: false,
            message: 'Choisissez un role pour finaliser l\'inscription Google.',
          });
        }

        if (!ALLOWED_ROLES.includes(role)) {
          return res.status(400).json({
            success: false,
            message: 'Rôle invalide.',
          });
        }

        // Create new user
        user = await User.create({
          googleId,
          fullName: fullName || email.split('@')[0],
          email: email.toLowerCase(),
          role,
        });
      } else {
        // Link Google ID to existing user
        user.googleId = googleId;
        await user.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Connexion avec Google reussie.',
      token: generateToken(user),
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const loginWithFacebook = async (req, res, next) => {
  try {
    const { facebookId, email, fullName } = req.body;

    if (!facebookId) {
      return res.status(400).json({
        success: false,
        message: 'facebookId est requis.',
      });
    }

    const normalizedEmail = email
      ? email.toLowerCase()
      : `facebook_${facebookId}@no-email.local`;

    // Find or create user with Facebook ID
    let user = await User.findOne({ facebookId });

    if (!user) {
      // Check if email exists from another provider
      user = await User.findOne({ email: normalizedEmail });

      if (!user) {
        // Create new user
        user = await User.create({
          facebookId,
          fullName: fullName || normalizedEmail.split('@')[0],
          email: normalizedEmail,
          role: 'operator',
        });
      } else {
        // Link Facebook ID to existing user
        user.facebookId = facebookId;
        await user.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Connexion avec Facebook reussie.',
      token: generateToken(user),
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    return next(error);
  }
};
