import { Router, Request, Response } from 'express';
import { db } from '../../database/connection';
import { aiService } from '../../services/aiService';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { logger } from '../../utils/logger';

const router = Router();

// Create new chat session
router.post('/sessions', asyncHandler(async (req: Request, res: Response) => {
  const { session_name } = req.body;

  const query = `
    INSERT INTO chat_sessions (user_id, session_name)
    VALUES ($1, $2)
    RETURNING *
  `;

  const result = await db.query(query, [req.user?.id || null, session_name || null]);

  res.status(201).json(result.rows[0]);
}));

// Get user's chat sessions
router.get('/sessions', asyncHandler(async (req: Request, res: Response) => {
  const query = `
    SELECT cs.*, 
           COUNT(cm.id) as message_count,
           MAX(cm.created_at) as last_message_at
    FROM chat_sessions cs
    LEFT JOIN chat_messages cm ON cs.id = cm.session_id
    WHERE cs.user_id = $1 OR cs.user_id IS NULL
    GROUP BY cs.id
    ORDER BY cs.updated_at DESC
  `;

  const result = await db.query(query, [req.user?.id || null]);
  res.json(result.rows);
}));

// Get chat messages for a session
router.get('/sessions/:sessionId/messages', asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  const query = `
    SELECT * FROM chat_messages
    WHERE session_id = $1
    ORDER BY created_at ASC
    LIMIT $2 OFFSET $3
  `;

  const result = await db.query(query, [sessionId, Number(limit), Number(offset)]);
  res.json(result.rows);
}));

// Send message to AI
router.post('/sessions/:sessionId/messages', asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { message, context } = req.body;

  if (!message) {
    throw createError('Message is required', 400);
  }

  // Verify session exists
  const sessionQuery = 'SELECT * FROM chat_sessions WHERE id = $1';
  const sessionResult = await db.query(sessionQuery, [sessionId]);

  if (sessionResult.rows.length === 0) {
    throw createError('Chat session not found', 404);
  }

  // Store user message
  const userMessageQuery = `
    INSERT INTO chat_messages (session_id, role, content, metadata)
    VALUES ($1, 'user', $2, $3)
    RETURNING *
  `;

  const userMessage = await db.query(userMessageQuery, [
    sessionId,
    message,
    context ? JSON.stringify(context) : null
  ]);

  // Get recent conversation context
  const contextQuery = `
    SELECT role, content FROM chat_messages
    WHERE session_id = $1
    ORDER BY created_at DESC
    LIMIT 10
  `;

  const contextResult = await db.query(contextQuery, [sessionId]);
  const conversationContext = contextResult.rows.reverse();

  // Get relevant exploit data for context
  let exploitContext = {};
  if (context?.exploit_id) {
    const exploitQuery = `
      SELECT e.*, cv.version as chromeos_version
      FROM exploits e
      LEFT JOIN chromeos_versions cv ON e.chromeos_version_id = cv.id
      WHERE e.id = $1
    `;
    const exploitResult = await db.query(exploitQuery, [context.exploit_id]);
    if (exploitResult.rows.length > 0) {
      exploitContext = { exploit: exploitResult.rows[0] };
    }
  }

  // Get AI response
  const aiResponse = await aiService.answerUserQuestion(message, {
    conversation: conversationContext,
    ...exploitContext
  });

  // Store AI response
  const aiMessageQuery = `
    INSERT INTO chat_messages (session_id, role, content, metadata)
    VALUES ($1, 'assistant', $2, $3)
    RETURNING *
  `;

  const aiMessage = await db.query(aiMessageQuery, [
    sessionId,
    aiResponse,
    JSON.stringify({ model: 'gpt-4o', timestamp: new Date().toISOString() })
  ]);

  // Update session timestamp
  await db.query(
    'UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [sessionId]
  );

  logger.info('Chat message processed', {
    sessionId,
    userId: req.user?.id,
    messageLength: message.length,
    responseLength: aiResponse.length
  });

  res.json({
    user_message: userMessage.rows[0],
    ai_message: aiMessage.rows[0]
  });
}));

// Delete chat session
router.delete('/sessions/:sessionId', asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  // Verify ownership
  const sessionQuery = 'SELECT * FROM chat_sessions WHERE id = $1 AND user_id = $2';
  const sessionResult = await db.query(sessionQuery, [sessionId, req.user?.id]);

  if (sessionResult.rows.length === 0) {
    throw createError('Chat session not found or access denied', 404);
  }

  // Delete session (messages will be cascade deleted)
  await db.query('DELETE FROM chat_sessions WHERE id = $1', [sessionId]);

  logger.info('Chat session deleted', {
    sessionId,
    userId: req.user?.id
  });

  res.status(204).send();
}));

// Get AI suggestions based on current context
router.post('/suggestions', asyncHandler(async (req: Request, res: Response) => {
  const { context, query } = req.body;

  const suggestions = [
    "What are the most critical ChromeOS vulnerabilities?",
    "How can I protect my ChromeOS device?",
    "What's the latest ChromeOS security update?",
    "Explain this exploit in simple terms",
    "What are the CVSS scores for recent vulnerabilities?",
    "How do I report a security issue?",
    "What's the difference between these vulnerability types?",
    "Show me vulnerabilities for ChromeOS version 120",
    "What are the mitigation strategies for this exploit?",
    "How often should I update ChromeOS?"
  ];

  // Filter suggestions based on query if provided
  const filteredSuggestions = query 
    ? suggestions.filter(s => s.toLowerCase().includes(query.toLowerCase()))
    : suggestions;

  res.json({
    suggestions: filteredSuggestions.slice(0, 5)
  });
}));

export { router as chatRoutes };
