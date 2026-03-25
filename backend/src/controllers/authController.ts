import crypto from 'crypto';
import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import User from '../models/User';
import { generateToken } from '../utils/token';
import { config } from '../config';
import { UserRole } from '../types/enums';
import { AuthRequest } from '../middleware/auth';

const transporter = nodemailer.createTransport({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: false,
  auth: {
    user: config.smtpUser,
    pass: config.smtpPass,
  },
  tls: {
    minVersion: 'TLSv1.2',
  },
});

const googleClient = new OAuth2Client(config.googleClientId);

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'Email already registered' });
      return;
    }

    const user = await User.create({ name, email, password, role: UserRole.USER });
    const token = generateToken(String(user._id));

    res.status(201).json({ user, token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ message: 'Account suspended', reason: user.suspendReason });
      return;
    }

    const token = generateToken(String(user._id));
    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    const user = await User.findByIdAndUpdate(req.user!._id, { name }, { new: true });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const toggleFavoriteRemitter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { remitterId } = req.params;
    const user = req.user!;

    const index = user.favoriteRemitters.indexOf(remitterId as any);
    if (index > -1) {
      user.favoriteRemitters.splice(index, 1);
    } else {
      user.favoriteRemitters.push(remitterId as any);
    }

    await user.save();
    res.json({ favoriteRemitters: user.favoriteRemitters });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'currentPassword and newPassword are required' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ message: 'New password must be at least 6 characters' });
      return;
    }

    const user = await User.findById(req.user!._id).select('+password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ message: 'Current password is incorrect' });
      return;
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { credential } = req.body;
    if (!credential) {
      res.status(400).json({ message: 'Google credential is required' });
      return;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: config.googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ message: 'Invalid Google token' });
      return;
    }

    const { sub: googleId, email, name, email_verified } = payload;

    if (!email_verified) {
      res.status(400).json({ message: 'Google email not verified' });
      return;
    }

    let user = await User.findOne({ email });

    if (user) {
      // Link Google account if not already linked
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }

      if (user.status === 'suspended') {
        res.status(403).json({ message: 'Account suspended', reason: user.suspendReason });
        return;
      }
    } else {
      // Create new user from Google account
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        googleId,
        role: UserRole.USER,
      });
    }

    const token = generateToken(String(user._id));
    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ message: 'Google authentication failed' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
      return;
    }

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: `"SajiloRemit" <${config.smtpUser}>`,
      to: user.email,
      subject: 'SajiloRemit - Password Reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #16a34a;">SajiloRemit</h2>
          <p>Hi ${user.name},</p>
          <p>You requested a password reset. Click the button below to set a new password:</p>
          <a href="${resetUrl}" style="display: inline-block; background: #16a34a; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Reset Password</a>
          <p style="margin-top: 16px; font-size: 13px; color: #666;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      res.status(400).json({ message: 'Token and new password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters' });
      return;
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid or expired reset token' });
      return;
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
