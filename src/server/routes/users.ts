import { Router, Request, Response } from 'express';
import { db } from '../../database/connection';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { logger } from '../../utils/logger';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();

// Register new user
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw createError('Username, email, and password are required', 400);
  }

  // Check if user already exists
  const existingUserQuery = 'SELECT id FROM users WHERE username = $1 OR email = $2';
  const existingUser = await db.query(existingUserQuery, [username, email]);

  if (existingUser.rows.length > 0) {
    throw createError('Username or email already exists', 409);
  }

  // Hash password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user
  const createUserQuery = `
    INSERT INTO users (username, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, username, email, role, created_at
  `;

  const result = await db.query(createUserQuery, [username, email, passwordHash]);

  logger.info('New user registered', {
    userId: result.rows[0].id,
    username,
    email
  });

  res.status(201).json({
    user: result.rows[0],
    message: 'User registered successfully'
  });
}));

// Login user
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw createError('Username and password are required', 400);
  }

  // Find user
  const userQuery = 'SELECT * FROM users WHERE username = $1 AND is_active = true';
  const userResult = await db.query(userQuery, [username]);

  if (userResult.rows.length === 0) {
    throw createError('Invalid credentials', 401);
  }

  const user = userResult.rows[0];

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    throw createError('Invalid credentials', 401);
  }

  // Generate JWT token
  const token = jwt.sign(
    { 
      userId: user.id, 
      username: user.username, 
      role: user.role 
    },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '7d' }
  );

  logger.info('User logged in', {
    userId: user.id,
    username: user.username
  });

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    }
  });
}));

// Get current user profile
router.get('/profile', asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('Authentication required', 401);
  }

  const userQuery = `
    SELECT id, username, email, role, created_at, updated_at
    FROM users
    WHERE id = $1
  `;

  const result = await db.query(userQuery, [req.user.id]);

  if (result.rows.length === 0) {
    throw createError('User not found', 404);
  }

  res.json(result.rows[0]);
}));

// Update user profile
router.put('/profile', asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('Authentication required', 401);
  }

  const { email } = req.body;
  const updateFields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (email) {
    // Check if email is already taken
    const emailCheckQuery = 'SELECT id FROM users WHERE email = $1 AND id != $2';
    const emailCheck = await db.query(emailCheckQuery, [email, req.user.id]);

    if (emailCheck.rows.length > 0) {
      throw createError('Email already in use', 409);
    }

    updateFields.push(`email = $${paramIndex}`);
    values.push(email);
    paramIndex++;
  }

  if (updateFields.length === 0) {
    throw createError('No fields to update', 400);
  }

  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(req.user.id);

  const query = `
    UPDATE users 
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING id, username, email, role, created_at, updated_at
  `;

  const result = await db.query(query, values);

  logger.info('User profile updated', {
    userId: req.user.id,
    updatedFields: Object.keys(req.body)
  });

  res.json(result.rows[0]);
}));

// Change password
router.put('/change-password', asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('Authentication required', 401);
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw createError('Current password and new password are required', 400);
  }

  // Get current user with password hash
  const userQuery = 'SELECT password_hash FROM users WHERE id = $1';
  const userResult = await db.query(userQuery, [req.user.id]);

  if (userResult.rows.length === 0) {
    throw createError('User not found', 404);
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);

  if (!isValidPassword) {
    throw createError('Current password is incorrect', 401);
  }

  // Hash new password
  const saltRounds = 12;
  const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await db.query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [newPasswordHash, req.user.id]
  );

  logger.info('User password changed', {
    userId: req.user.id
  });

  res.json({ message: 'Password changed successfully' });
}));

// Get user statistics
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('Authentication required', 401);
  }

  const statsQuery = `
    SELECT 
      (SELECT COUNT(*) FROM exploits WHERE created_by = $1) as exploits_created,
      (SELECT COUNT(*) FROM user_reports WHERE user_id = $1) as reports_submitted,
      (SELECT COUNT(*) FROM chat_sessions WHERE user_id = $1) as chat_sessions,
      (SELECT COUNT(*) FROM user_reports WHERE user_id = $1 AND status = 'accepted') as accepted_reports
  `;

  const result = await db.query(statsQuery, [req.user.id]);

  res.json(result.rows[0]);
}));

export { router as userRoutes };
