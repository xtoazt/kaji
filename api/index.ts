import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { setupRoutes } from '../src/server/routes';
import { errorHandler } from '../src/server/middleware/errorHandler';
import { rateLimiter } from '../src/server/middleware/rateLimiter';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Rate limiting
app.use(rateLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// AI chat endpoint with real OpenRouter integration
app.post('/api/v1/ai/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Message is required'
      });
    }

    // Import AI service dynamically to avoid issues in serverless
    const { aiService } = await import('../src/services/aiService');
    
    const response = await aiService.answerUserQuestion(message, context);

    return res.json({
      response,
      timestamp: new Date().toISOString(),
      model: 'gpt-4o'
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Exploits endpoints with real database integration
app.get('/api/v1/exploits', async (req, res) => {
  try {
    const { db } = await import('../src/database/connection');
    
    const result = await db.query(`
      SELECT 
        e.*,
        u.username as created_by_username,
        u2.username as updated_by_username
      FROM exploits e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN users u2 ON e.updated_by = u2.id
      ORDER BY e.created_at DESC
      LIMIT 100
    `);

    return res.json({
      exploits: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Exploits fetch error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get exploit by ID
app.get('/api/v1/exploits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { db } = await import('../src/database/connection');
    
    const result = await db.query(`
      SELECT 
        e.*,
        u.username as created_by_username,
        u2.username as updated_by_username
      FROM exploits e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN users u2 ON e.updated_by = u2.id
      WHERE e.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Exploit not found'
      });
    }

    return res.json({
      exploit: result.rows[0]
    });
  } catch (error) {
    console.error('Exploit fetch error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create new exploit
app.post('/api/v1/exploits', async (req, res) => {
  try {
    const { title, description, severity, chromeos_version, exploit_code, references } = req.body;
    
    if (!title || !description || !severity || !chromeos_version) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Title, description, severity, and chromeos_version are required'
      });
    }

    const { db } = await import('../src/database/connection');
    
    const result = await db.query(`
      INSERT INTO exploits (title, description, severity, chromeos_version, exploit_code, references, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [title, description, severity, chromeos_version, exploit_code, references, req.user?.id || null]);

    return res.status(201).json({
      exploit: result.rows[0],
      message: 'Exploit created successfully'
    });
  } catch (error) {
    console.error('Exploit creation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update exploit
app.put('/api/v1/exploits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, severity, chromeos_version, exploit_code, references, verified } = req.body;
    
    const { db } = await import('../src/database/connection');
    
    const result = await db.query(`
      UPDATE exploits 
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          severity = COALESCE($3, severity),
          chromeos_version = COALESCE($4, chromeos_version),
          exploit_code = COALESCE($5, exploit_code),
          references = COALESCE($6, references),
          verified = COALESCE($7, verified),
          updated_by = $8,
          updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `, [title, description, severity, chromeos_version, exploit_code, references, verified, req.user?.id || null, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Exploit not found'
      });
    }

    return res.json({
      exploit: result.rows[0],
      message: 'Exploit updated successfully'
    });
  } catch (error) {
    console.error('Exploit update error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete exploit
app.delete('/api/v1/exploits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { db } = await import('../src/database/connection');
    
    const result = await db.query('DELETE FROM exploits WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Exploit not found'
      });
    }

    return res.json({
      message: 'Exploit deleted successfully'
    });
  } catch (error) {
    console.error('Exploit deletion error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Authentication endpoints
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Username, email, and password are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Password must be at least 8 characters long'
      });
    }

    const { db } = await import('../src/database/connection');
    const bcrypt = await import('bcrypt');
    
    // Check if user already exists
    const existingUser = await db.query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Username or email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const result = await db.query(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES ($1, $2, $3, 'user')
      RETURNING id, username, email, role, created_at
    `, [username, email, hashedPassword]);

    const user = result.rows[0];
    
    // Generate JWT token
    const jwt = await import('jsonwebtoken');
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Username and password are required'
      });
    }

    const { db } = await import('../src/database/connection');
    const bcrypt = await import('bcrypt');
    
    // Find user
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials'
      });
    }

    const user = result.rows[0];
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const jwt = await import('jsonwebtoken');
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Setup routes
setupRoutes(app);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

export default app;
