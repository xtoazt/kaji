import { Router, Request, Response } from 'express';
import { db } from '../../database/connection';
import { aiService } from '../../services/aiService';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { logger } from '../../utils/logger';
import { CreateUserReportRequest } from '../../types';

const router = Router();

// Create new user report
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const reportData: CreateUserReportRequest = req.body;

  // Validate required fields
  if (!reportData.title || !reportData.description || !reportData.report_type) {
    throw createError('Title, description, and report type are required', 400);
  }

  const query = `
    INSERT INTO user_reports (
      user_id, report_type, title, description, 
      exploit_id, chromeos_version_id
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const values = [
    req.user?.id || null,
    reportData.report_type,
    reportData.title,
    reportData.description,
    reportData.exploit_id || null,
    reportData.chromeos_version_id || null
  ];

  const result = await db.query(query, values);

  // Use AI to analyze the report
  try {
    const aiValidation = await aiService.validateUserReport(
      `${reportData.title}: ${reportData.description}`,
      reportData.exploit_id
    );

    // Update report with AI analysis
    await db.query(
      'UPDATE user_reports SET ai_analysis = $1 WHERE id = $2',
      [aiValidation.analysis, result.rows[0].id]
    );

    logger.info('User report created and analyzed', {
      reportId: result.rows[0].id,
      reportType: reportData.report_type,
      userId: req.user?.id,
      aiValid: aiValidation.isValid,
      aiConfidence: aiValidation.confidence
    });
  } catch (error) {
    logger.error('AI analysis failed for user report', error);
  }

  res.status(201).json(result.rows[0]);
}));

// Get user reports with filtering
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 20,
    status,
    report_type,
    user_id
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);
  let whereConditions: string[] = [];
  const queryParams: any[] = [];
  let paramIndex = 1;

  if (status) {
    whereConditions.push(`status = $${paramIndex}`);
    queryParams.push(status);
    paramIndex++;
  }

  if (report_type) {
    whereConditions.push(`report_type = $${paramIndex}`);
    queryParams.push(report_type);
    paramIndex++;
  }

  if (user_id) {
    whereConditions.push(`user_id = $${paramIndex}`);
    queryParams.push(user_id);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const query = `
    SELECT 
      ur.*,
      u.username,
      e.title as exploit_title,
      cv.version as chromeos_version
    FROM user_reports ur
    LEFT JOIN users u ON ur.user_id = u.id
    LEFT JOIN exploits e ON ur.exploit_id = e.id
    LEFT JOIN chromeos_versions cv ON ur.chromeos_version_id = cv.id
    ${whereClause}
    ORDER BY ur.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  queryParams.push(Number(limit), offset);

  const result = await db.query(query, queryParams);

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM user_reports ur
    ${whereClause}
  `;
  const countResult = await db.query(countQuery, queryParams.slice(0, -2));

  res.json({
    reports: result.rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: parseInt(countResult.rows[0].total),
      pages: Math.ceil(parseInt(countResult.rows[0].total) / Number(limit))
    }
  });
}));

// Get report by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const query = `
    SELECT 
      ur.*,
      u.username,
      e.title as exploit_title,
      cv.version as chromeos_version
    FROM user_reports ur
    LEFT JOIN users u ON ur.user_id = u.id
    LEFT JOIN exploits e ON ur.exploit_id = e.id
    LEFT JOIN chromeos_versions cv ON ur.chromeos_version_id = cv.id
    WHERE ur.id = $1
  `;

  const result = await db.query(query, [id]);

  if (result.rows.length === 0) {
    throw createError('Report not found', 404);
  }

  res.json(result.rows[0]);
}));

// Update report status (admin only)
router.patch('/:id/status', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, admin_notes } = req.body;

  if (!status || !['pending', 'reviewing', 'accepted', 'rejected'].includes(status)) {
    throw createError('Invalid status', 400);
  }

  // Check if user is admin
  if (req.user?.role !== 'admin') {
    throw createError('Admin access required', 403);
  }

  const query = `
    UPDATE user_reports 
    SET status = $1, admin_notes = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
  `;

  const result = await db.query(query, [status, admin_notes || null, id]);

  if (result.rows.length === 0) {
    throw createError('Report not found', 404);
  }

  logger.info('Report status updated', {
    reportId: id,
    newStatus: status,
    updatedBy: req.user.id
  });

  res.json(result.rows[0]);
}));

// Get report statistics
router.get('/stats/overview', asyncHandler(async (req: Request, res: Response) => {
  const statsQuery = `
    SELECT 
      COUNT(*) as total_reports,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
      COUNT(CASE WHEN status = 'reviewing' THEN 1 END) as reviewing_count,
      COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_count,
      COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
      COUNT(CASE WHEN report_type = 'error' THEN 1 END) as error_reports,
      COUNT(CASE WHEN report_type = 'false_positive' THEN 1 END) as false_positive_reports,
      COUNT(CASE WHEN report_type = 'missing_exploit' THEN 1 END) as missing_exploit_reports,
      COUNT(CASE WHEN report_type = 'suggestion' THEN 1 END) as suggestion_reports,
      COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as recent_reports
    FROM user_reports
  `;

  const result = await db.query(statsQuery);
  const stats = result.rows[0];

  // Get reports by status over time (last 30 days)
  const timelineQuery = `
    SELECT 
      DATE(created_at) as date,
      status,
      COUNT(*) as count
    FROM user_reports
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(created_at), status
    ORDER BY date DESC
  `;

  const timelineResult = await db.query(timelineQuery);

  res.json({
    overview: stats,
    timeline: timelineResult.rows
  });
}));

export { router as reportRoutes };
