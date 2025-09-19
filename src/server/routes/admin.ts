import { Router, Request, Response } from 'express';
import { db } from '../../database/connection';
import { aiService } from '../../services/aiService';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { logger } from '../../utils/logger';

const router = Router();

// Middleware to check admin access
const requireAdmin = (req: Request, res: Response, next: any) => {
  if (req.user?.role !== 'admin') {
    throw createError('Admin access required', 403);
  }
  next();
};

// Apply admin middleware to all routes
router.use(requireAdmin);

// Get system statistics
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const statsQuery = `
    SELECT 
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM exploits) as total_exploits,
      (SELECT COUNT(*) FROM user_reports) as total_reports,
      (SELECT COUNT(*) FROM chat_sessions) as total_chat_sessions,
      (SELECT COUNT(*) FROM chromeos_versions) as total_versions,
      (SELECT COUNT(*) FROM ai_training_data) as total_training_data,
      (SELECT COUNT(*) FROM system_logs WHERE level = 'error' AND created_at >= CURRENT_DATE - INTERVAL '7 days') as recent_errors
  `;

  const result = await db.query(statsQuery);
  const stats = result.rows[0];

  // Get recent activity
  const activityQuery = `
    SELECT 
      'exploit' as type,
      title as name,
      created_at
    FROM exploits
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    UNION ALL
    SELECT 
      'report' as type,
      title as name,
      created_at
    FROM user_reports
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    UNION ALL
    SELECT 
      'user' as type,
      username as name,
      created_at
    FROM users
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    ORDER BY created_at DESC
    LIMIT 20
  `;

  const activityResult = await db.query(activityQuery);

  res.json({
    overview: stats,
    recent_activity: activityResult.rows
  });
}));

// Get system logs
router.get('/logs', asyncHandler(async (req: Request, res: Response) => {
  const { level, page = 1, limit = 50 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereClause = '';
  const queryParams: any[] = [];
  let paramIndex = 1;

  if (level) {
    whereClause = `WHERE level = $${paramIndex}`;
    queryParams.push(level);
    paramIndex++;
  }

  const query = `
    SELECT * FROM system_logs
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  queryParams.push(Number(limit), offset);

  const result = await db.query(query, queryParams);

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM system_logs
    ${whereClause}
  `;
  const countResult = await db.query(countQuery, queryParams.slice(0, -2));

  res.json({
    logs: result.rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: parseInt(countResult.rows[0].total),
      pages: Math.ceil(parseInt(countResult.rows[0].total) / Number(limit))
    }
  });
}));

// Trigger AI vulnerability scan for a ChromeOS version
router.post('/scan/:versionId', asyncHandler(async (req: Request, res: Response) => {
  const { versionId } = req.params;

  // Get ChromeOS version info
  const versionQuery = 'SELECT * FROM chromeos_versions WHERE id = $1';
  const versionResult = await db.query(versionQuery, [versionId]);

  if (versionResult.rows.length === 0) {
    throw createError('ChromeOS version not found', 404);
  }

  const version = versionResult.rows[0];

  // Get existing exploits for this version
  const exploitsQuery = `
    SELECT title, description, severity
    FROM exploits
    WHERE chromeos_version_id = $1 AND is_public = true
  `;
  const exploitsResult = await db.query(exploitsQuery, [versionId]);
  const existingExploits = exploitsResult.rows.map(e => `${e.title}: ${e.description}`);

  // Use AI to find new vulnerabilities
  const newVulnerabilities = await aiService.findNewVulnerabilities(
    version.version,
    existingExploits
  );

  // Store scan results
  const scanQuery = `
    INSERT INTO system_logs (level, message, context)
    VALUES ('info', 'AI vulnerability scan completed', $1)
    RETURNING *
  `;

  const scanContext = {
    version_id: versionId,
    version: version.version,
    vulnerabilities_found: newVulnerabilities.length,
    vulnerabilities: newVulnerabilities,
    scan_date: new Date().toISOString()
  };

  await db.query(scanQuery, [JSON.stringify(scanContext)]);

  logger.info('AI vulnerability scan completed', {
    versionId,
    version: version.version,
    vulnerabilitiesFound: newVulnerabilities.length
  });

  res.json({
    version_id: versionId,
    version: version.version,
    vulnerabilities_found: newVulnerabilities.length,
    vulnerabilities: newVulnerabilities,
    scan_date: new Date().toISOString()
  });
}));

// Update system configuration
router.put('/config', asyncHandler(async (req: Request, res: Response) => {
  const { key, value } = req.body;

  if (!key || value === undefined) {
    throw createError('Configuration key and value are required', 400);
  }

  // Store configuration in system logs for now (could be moved to a dedicated config table)
  const configQuery = `
    INSERT INTO system_logs (level, message, context)
    VALUES ('info', 'System configuration updated', $1)
    RETURNING *
  `;

  const configContext = {
    config_key: key,
    config_value: value,
    updated_by: req.user.id,
    updated_at: new Date().toISOString()
  };

  await db.query(configQuery, [JSON.stringify(configContext)]);

  logger.info('System configuration updated', {
    key,
    value,
    updatedBy: req.user.id
  });

  res.json({
    message: 'Configuration updated successfully',
    key,
    value
  });
}));

// Get AI training data
router.get('/ai-training', asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, validated_only = false } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereClause = '';
  const queryParams: any[] = [];
  let paramIndex = 1;

  if (validated_only === 'true') {
    whereClause = 'WHERE is_validated = true';
  }

  const query = `
    SELECT 
      atd.*,
      e.title as exploit_title,
      e.severity
    FROM ai_training_data atd
    LEFT JOIN exploits e ON atd.exploit_id = e.id
    ${whereClause}
    ORDER BY atd.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  queryParams.push(Number(limit), offset);

  const result = await db.query(query, queryParams);

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM ai_training_data atd
    ${whereClause}
  `;
  const countResult = await db.query(countQuery, queryParams.slice(0, -2));

  res.json({
    training_data: result.rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: parseInt(countResult.rows[0].total),
      pages: Math.ceil(parseInt(countResult.rows[0].total) / Number(limit))
    }
  });
}));

// Validate AI training data
router.patch('/ai-training/:id/validate', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { is_validated = true } = req.body;

  const query = `
    UPDATE ai_training_data 
    SET is_validated = $1
    WHERE id = $2
    RETURNING *
  `;

  const result = await db.query(query, [is_validated, id]);

  if (result.rows.length === 0) {
    throw createError('Training data not found', 404);
  }

  logger.info('AI training data validation updated', {
    trainingDataId: id,
    isValidated: is_validated,
    updatedBy: req.user.id
  });

  res.json(result.rows[0]);
}));

// Get user management data
router.get('/users', asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, role, active_only = true } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereConditions = [];
  const queryParams: any[] = [];
  let paramIndex = 1;

  if (role) {
    whereConditions.push(`role = $${paramIndex}`);
    queryParams.push(role);
    paramIndex++;
  }

  if (active_only === 'true') {
    whereConditions.push(`is_active = true`);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const query = `
    SELECT 
      u.*,
      COUNT(e.id) as exploits_created,
      COUNT(ur.id) as reports_submitted
    FROM users u
    LEFT JOIN exploits e ON u.id = e.created_by
    LEFT JOIN user_reports ur ON u.id = ur.user_id
    ${whereClause}
    GROUP BY u.id
    ORDER BY u.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  queryParams.push(Number(limit), offset);

  const result = await db.query(query, queryParams);

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM users u
    ${whereClause}
  `;
  const countResult = await db.query(countQuery, queryParams.slice(0, -2));

  res.json({
    users: result.rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: parseInt(countResult.rows[0].total),
      pages: Math.ceil(parseInt(countResult.rows[0].total) / Number(limit))
    }
  });
}));

// Update user role
router.patch('/users/:id/role', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || !['user', 'researcher', 'admin'].includes(role)) {
    throw createError('Valid role is required', 400);
  }

  const query = `
    UPDATE users 
    SET role = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING id, username, email, role, created_at, updated_at
  `;

  const result = await db.query(query, [role, id]);

  if (result.rows.length === 0) {
    throw createError('User not found', 404);
  }

  logger.info('User role updated', {
    userId: id,
    newRole: role,
    updatedBy: req.user.id
  });

  res.json(result.rows[0]);
}));

export { router as adminRoutes };
