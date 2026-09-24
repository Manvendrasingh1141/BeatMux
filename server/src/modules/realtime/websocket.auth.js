import jwt from 'jsonwebtoken';
import User from '../../models/User.js';

export const authenticateWebSocket = async (accessToken) => {
  if (!accessToken) {
    throw new Error('No access token provided');
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.id).select('_id username avatar');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (error) {
    throw new Error('Invalid token');
  }
};
