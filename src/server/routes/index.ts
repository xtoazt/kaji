import { Application } from 'express';
import { exploitRoutes } from './exploits';
import { userRoutes } from './users';
import { reportRoutes } from './reports';
import { chatRoutes } from './chat';
import { adminRoutes } from './admin';
import { versionRoutes } from './versions';

export function setupRoutes(app: Application) {
  // API version prefix
  const apiPrefix = '/api/v1';

  // Mount route modules
  app.use(`${apiPrefix}/exploits`, exploitRoutes);
  app.use(`${apiPrefix}/users`, userRoutes);
  app.use(`${apiPrefix}/reports`, reportRoutes);
  app.use(`${apiPrefix}/chat`, chatRoutes);
  app.use(`${apiPrefix}/admin`, adminRoutes);
  app.use(`${apiPrefix}/versions`, versionRoutes);

  // API documentation endpoint
  app.get(`${apiPrefix}/docs`, (req, res) => {
    res.json({
      name: 'Kaji ChromeOS Security Research API',
      version: '1.0.0',
      description: 'AI-powered ChromeOS vulnerability research and analysis',
      endpoints: {
        exploits: `${apiPrefix}/exploits`,
        users: `${apiPrefix}/users`,
        reports: `${apiPrefix}/reports`,
        chat: `${apiPrefix}/chat`,
        admin: `${apiPrefix}/admin`,
        versions: `${apiPrefix}/versions`
      },
      documentation: 'https://docs.kaji-security.com'
    });
  });
}
