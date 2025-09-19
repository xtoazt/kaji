import cron from 'node-cron';
import { db } from '../database/connection';
import { aiService } from '../services/aiService';
import { logger } from '../utils/logger';

export function setupCronJobs() {
  // Check for new ChromeOS versions daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('Starting daily ChromeOS version check');
    await checkForNewChromeOSVersions();
  });

  // AI vulnerability scan for current ChromeOS version weekly on Sundays at 3 AM
  cron.schedule('0 3 * * 0', async () => {
    logger.info('Starting weekly AI vulnerability scan');
    await performWeeklyVulnerabilityScan();
  });

  // Clean up old system logs monthly on the 1st at 4 AM
  cron.schedule('0 4 1 * *', async () => {
    logger.info('Starting monthly log cleanup');
    await cleanupOldLogs();
  });

  // Update AI knowledge base daily at 1 AM
  cron.schedule('0 1 * * *', async () => {
    logger.info('Starting daily AI knowledge base update');
    await updateAIKnowledgeBase();
  });

  logger.info('Cron jobs scheduled successfully');
}

async function checkForNewChromeOSVersions() {
  try {
    // This would typically fetch from ChromeOS release notes or official sources
    // For now, we'll simulate checking for new versions
    const currentVersionsQuery = `
      SELECT version, build_number, release_date
      FROM chromeos_versions
      WHERE is_current = true
      ORDER BY release_date DESC
      LIMIT 1
    `;

    const currentVersions = await db.query(currentVersionsQuery);
    
    if (currentVersions.rows.length > 0) {
      const latestVersion = currentVersions.rows[0];
      
      // Simulate finding a new version (in real implementation, this would check official sources)
      const newVersion = {
        version: '121.0.6167.85',
        build_number: '121.0.6167.85',
        release_date: new Date().toISOString().split('T')[0],
        is_stable: true,
        is_current: false
      };

      // Check if this version already exists
      const existingQuery = 'SELECT id FROM chromeos_versions WHERE version = $1';
      const existing = await db.query(existingQuery, [newVersion.version]);

      if (existing.rows.length === 0) {
        // Insert new version
        const insertQuery = `
          INSERT INTO chromeos_versions (version, build_number, release_date, is_stable)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `;

        await db.query(insertQuery, [
          newVersion.version,
          newVersion.build_number,
          newVersion.release_date,
          newVersion.is_stable
        ]);

        logger.info('New ChromeOS version detected and added', {
          version: newVersion.version,
          buildNumber: newVersion.build_number
        });

        // Trigger AI analysis for the new version
        await analyzeNewChromeOSVersion(newVersion.version);
      }
    }
  } catch (error) {
    logger.error('Error checking for new ChromeOS versions', error);
  }
}

async function performWeeklyVulnerabilityScan() {
  try {
    // Get current ChromeOS version
    const currentVersionQuery = `
      SELECT id, version
      FROM chromeos_versions
      WHERE is_current = true
      LIMIT 1
    `;

    const currentVersion = await db.query(currentVersionQuery);

    if (currentVersion.rows.length > 0) {
      const version = currentVersion.rows[0];

      // Get existing exploits for this version
      const exploitsQuery = `
        SELECT title, description, severity
        FROM exploits
        WHERE chromeos_version_id = $1 AND is_public = true
      `;
      const exploits = await db.query(exploitsQuery, [version.id]);
      const existingExploits = exploits.rows.map(e => `${e.title}: ${e.description}`);

      // Use AI to find new vulnerabilities
      const newVulnerabilities = await aiService.findNewVulnerabilities(
        version.version,
        existingExploits
      );

      if (newVulnerabilities.length > 0) {
        // Log the findings
        const logQuery = `
          INSERT INTO system_logs (level, message, context)
          VALUES ('info', 'Weekly vulnerability scan completed', $1)
        `;

        const context = {
          version_id: version.id,
          version: version.version,
          vulnerabilities_found: newVulnerabilities.length,
          vulnerabilities: newVulnerabilities,
          scan_date: new Date().toISOString()
        };

        await db.query(logQuery, [JSON.stringify(context)]);

        logger.info('Weekly vulnerability scan completed', {
          version: version.version,
          vulnerabilitiesFound: newVulnerabilities.length
        });
      }
    }
  } catch (error) {
    logger.error('Error performing weekly vulnerability scan', error);
  }
}

async function cleanupOldLogs() {
  try {
    // Delete logs older than 90 days
    const deleteQuery = `
      DELETE FROM system_logs
      WHERE created_at < CURRENT_DATE - INTERVAL '90 days'
      AND level IN ('debug', 'info')
    `;

    const result = await db.query(deleteQuery);

    logger.info('Old logs cleaned up', {
      deletedCount: result.rowCount
    });
  } catch (error) {
    logger.error('Error cleaning up old logs', error);
  }
}

async function updateAIKnowledgeBase() {
  try {
    // Get recent exploits and updates
    const recentExploitsQuery = `
      SELECT e.*, cv.version as chromeos_version
      FROM exploits e
      LEFT JOIN chromeos_versions cv ON e.chromeos_version_id = cv.id
      WHERE e.created_at >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY e.created_at DESC
    `;

    const recentExploits = await db.query(recentExploitsQuery);

    if (recentExploits.rows.length > 0) {
      // Update AI knowledge base with recent data
      for (const exploit of recentExploits.rows) {
        try {
          const knowledgeUpdate = await aiService.updateChromeOSKnowledge(
            exploit.chromeos_version,
            exploit
          );

          // Store the knowledge update
          const logQuery = `
            INSERT INTO system_logs (level, message, context)
            VALUES ('info', 'AI knowledge base updated', $1)
          `;

          const context = {
            exploit_id: exploit.id,
            chromeos_version: exploit.chromeos_version,
            knowledge_update: knowledgeUpdate,
            update_date: new Date().toISOString()
          };

          await db.query(logQuery, [JSON.stringify(context)]);
        } catch (error) {
          logger.error('Error updating AI knowledge for exploit', {
            exploitId: exploit.id,
            error: error.message
          });
        }
      }

      logger.info('AI knowledge base updated with recent exploits', {
        exploitsProcessed: recentExploits.rows.length
      });
    }
  } catch (error) {
    logger.error('Error updating AI knowledge base', error);
  }
}

async function analyzeNewChromeOSVersion(version: string) {
  try {
    // Use AI to analyze the new ChromeOS version
    const analysis = await aiService.updateChromeOSKnowledge(version, {
      version,
      analysis_date: new Date().toISOString(),
      source: 'automated_detection'
    });

    // Store the analysis
    const logQuery = `
      INSERT INTO system_logs (level, message, context)
      VALUES ('info', 'New ChromeOS version analyzed', $1)
    `;

    const context = {
      version,
      analysis,
      analysis_date: new Date().toISOString()
    };

    await db.query(logQuery, [JSON.stringify(context)]);

    logger.info('New ChromeOS version analyzed', {
      version,
      analysisLength: analysis.length
    });
  } catch (error) {
    logger.error('Error analyzing new ChromeOS version', {
      version,
      error: error.message
    });
  }
}
