import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../../models/User.js';
import { sendError, sendSuccess } from '../../utils/response.js';

const generateTokens = (userId) => {
  const accessToken = 
  jwt.sign({ 
    id: userId 
    }, 
    process.env.JWT_SECRET || 'secret', 
    {
    expiresIn: '15m',
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET || 'refresh_secret', {
    expiresIn: '7d',
  });
  return { accessToken, refreshToken };
};

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return sendError(res, 'User already exists', 'USER_EXISTS', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash });

    sendSuccess(res, { user: { _id: user._id, username: user.username, email: user.email } }, 201);
  } catch (error) {
    sendError(res, 'Internal server error', 'SERVER_ERROR', 500);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 'Invalid credentials', 'INVALID_CREDENTIALS', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, 'Invalid credentials', 'INVALID_CREDENTIALS', 401);
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    sendSuccess(res, { accessToken, user: { _id: user._id, username: user.username, email: user.email } });
  } catch (error) {
    sendError(res, 'Internal server error', 'SERVER_ERROR', 500);
  }
};

export const logout = async (req, res) => {
  res.clearCookie('refreshToken');
  sendSuccess(res, { message: 'Logged out successfully' });
};

export const me = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      return sendError(res, 'User not found', 'USER_NOT_FOUND', 404);
    }
    sendSuccess(res, { user });
  } catch (error) {
    sendError(res, 'Internal server error', 'SERVER_ERROR', 500);
  }
};
