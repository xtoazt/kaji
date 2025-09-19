import { Router, Request, Response } from 'express';
import { db } from '../../database/connection';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { logger } from '../../utils/logger';

const router = Router();

// Get all ChromeOS versions
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { current_only = false } = req.query;

  let whereClause = '';
  const queryParams: any[] = [];

  if (current_only === 'true') {
    whereClause = 'WHERE is_current = true';
  }

  const query = `
    SELECT 
      cv.*,
      COUNT(e.id) as exploit_count,
      COUNT(CASE WHEN e.severity = 'critical' THEN 1 END) as critical_exploits,
      COUNT(CASE WHEN e.severity = 'high' THEN 1 END) as high_exploits
    FROM chromeos_versions cv
    LEFT JOIN exploits e ON cv.id = e.chromeos_version_id AND e.is_public = true
    ${whereClause}
    GROUP BY cv.id
    ORDER BY cv.release_date DESC
  `;

  const result = await db.query(query, queryParams);
  res.json(result.rows);
}));

// Get ChromeOS version by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const query = `
    SELECT 
      cv.*,
      COUNT(e.id) as exploit_count,
      COUNT(CASE WHEN e.severity = 'critical' THEN 1 END) as critical_exploits,
      COUNT(CASE WHEN e.severity = 'high' THEN 1 END) as high_exploits,
      COUNT(CASE WHEN e.severity = 'medium' THEN 1 END) as medium_exploits,
      COUNT(CASE WHEN e.severity = 'low' THEN 1 END) as low_exploits
    FROM chromeos_versions cv
    LEFT JOIN exploits e ON cv.id = e.chromeos_version_id AND e.is_public = true
    WHERE cv.id = $1
    GROUP BY cv.id
  `;

  const result = await db.query(query, [id]);

  if (result.rows.length === 0) {
    throw createError('ChromeOS version not found', 404);
  }

  res.json(result.rows[0]);
}));

// Get exploits for a specific ChromeOS version
router.get('/:id/exploits', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { page = 1, limit = 20, severity } = req.query;

  const offset = (Number(page) - 1) * Number(limit);
  let whereConditions = ['e.chromeos_version_id = $1', 'e.is_public = true'];
  const queryParams: any[] = [id];
  let paramIndex = 2;

  if (severity) {
    whereConditions.push(`e.severity = $${paramIndex}`);
    queryParams.push(severity);
    paramIndex++;
  }

  const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

  const query = `
    SELECT 
      e.*,
      vc.name as category_name,
      u.username as created_by_username
    FROM exploits e
    LEFT JOIN vulnerability_categories vc ON e.category_id = vc.id
    LEFT JOIN users u ON e.created_by = u.id
    ${whereClause}
    ORDER BY e.discovered_date DESC, e.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  queryParams.push(Number(limit), offset);

  const result = await db.query(query, queryParams);

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM exploits e
    ${whereClause}
  `;
  const countResult = await db.query(countQuery, queryParams.slice(0, -2));

  res.json({
    exploits: result.rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: parseInt(countResult.rows[0].total),
      pages: Math.ceil(parseInt(countResult.rows[0].total) / Number(limit))
    }
  });
}));

// Create new ChromeOS version
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { version, build_number, release_date, end_of_life_date, is_stable = true } = req.body;

  if (!version) {
    throw createError('Version is required', 400);
  }

  // Check if version already exists
  const existingQuery = 'SELECT id FROM chromeos_versions WHERE version = $1';
  const existing = await db.query(existingQuery, [version]);

  if (existing.rows.length > 0) {
    throw createError('ChromeOS version already exists', 409);
  }

  const query = `
    INSERT INTO chromeos_versions (version, build_number, release_date, end_of_life_date, is_stable)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const values = [
    version,
    build_number || null,
    release_date || null,
    end_of_life_date || null,
    is_stable
  ];

  const result = await db.query(query, values);

  logger.info('New ChromeOS version created', {
    versionId: result.rows[0].id,
    version,
    buildNumber: build_number
  });

  res.status(201).json(result.rows[0]);
}));

// Update ChromeOS version
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  // Build dynamic update query
  const updateFields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined) {
      updateFields.push(`${key} = $${paramIndex}`);
      values.push(updateData[key]);
      paramIndex++;
    }
  });

  if (updateFields.length === 0) {
    throw createError('No fields to update', 400);
  }

  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `
    UPDATE chromeos_versions 
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const result = await db.query(query, values);

  if (result.rows.length === 0) {
    throw createError('ChromeOS version not found', 404);
  }

  logger.info('ChromeOS version updated', {
    versionId: id,
    updatedFields: Object.keys(updateData)
  });

  res.json(result.rows[0]);
}));

// Set current ChromeOS version
router.patch('/:id/set-current', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if user is admin
  if (req.user?.role !== 'admin') {
    throw createError('Admin access required', 403);
  }

  await db.transaction(async (client) => {
    // Clear current flag from all versions
    await client.query('UPDATE chromeos_versions SET is_current = false');

    // Set new current version
    const result = await client.query(
      'UPDATE chromeos_versions SET is_current = true WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      throw createError('ChromeOS version not found', 404);
    }

    return result.rows[0];
  });

  logger.info('Current ChromeOS version updated', {
    versionId: id,
    updatedBy: req.user.id
  });

  res.json({ message: 'Current ChromeOS version updated successfully' });
}));

// Get version statistics
router.get('/stats/overview', asyncHandler(async (req: Request, res: Response) => {
  const statsQuery = `
    SELECT 
      COUNT(*) as total_versions,
      COUNT(CASE WHEN is_current = true THEN 1 END) as current_versions,
      COUNT(CASE WHEN is_stable = true THEN 1 END) as stable_versions,
      COUNT(CASE WHEN end_of_life_date IS NOT NULL AND end_of_life_date < CURRENT_DATE THEN 1 END) as eol_versions,
      COUNT(CASE WHEN release_date >= CURRENT_DATE - INTERVAL '1 year' THEN 1 END) as recent_versions
    FROM chromeos_versions
  `;

  const result = await db.query(statsQuery);
  const stats = result.rows[0];

  // Get version distribution
  const distributionQuery = `
    SELECT 
      cv.version,
      cv.is_current,
      COUNT(e.id) as exploit_count,
      COUNT(CASE WHEN e.severity = 'critical' THEN 1 END) as critical_count
    FROM chromeos_versions cv
    LEFT JOIN exploits e ON cv.id = e.chromeos_version_id AND e.is_public = true
    GROUP BY cv.id, cv.version, cv.is_current
    ORDER BY cv.release_date DESC
    LIMIT 10
  `;

  const distributionResult = await db.query(distributionQuery);

  res.json({
    overview: stats,
    version_distribution: distributionResult.rows
  });
}));

export { router as versionRoutes };
