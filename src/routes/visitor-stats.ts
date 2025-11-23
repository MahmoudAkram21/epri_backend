import express from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

// Generate a simple session ID
function generateSessionId(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Track a page visit
router.post('/track', async (req, res) => {
  try {
    const { sessionId, pagePath = '/' } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Session ID is required' 
      });
    }

    // Check if this session already visited this page using raw SQL
    const existingVisit = await prisma.$queryRaw`
      SELECT id FROM site_visit 
      WHERE session_id = ${sessionId} AND page_path = ${pagePath}
      LIMIT 1
    `;

    if (!Array.isArray(existingVisit) || existingVisit.length === 0) {
      // New visit - create visit record using raw SQL
      await prisma.$executeRaw`
        INSERT INTO site_visit (id, session_id, page_path, visited_at)
        VALUES (UUID(), ${sessionId}, ${pagePath}, NOW())
      `;

      // Get or create site stats using raw SQL
      const stats = await prisma.$queryRaw`
        SELECT * FROM site_stats LIMIT 1
      `;
      
      if (!Array.isArray(stats) || stats.length === 0) {
        // Create initial stats record
        await prisma.$executeRaw`
          INSERT INTO site_stats (id, total_visits, unique_sessions, created_at, updated_at)
          VALUES (UUID(), 1, 1, NOW(), NOW())
        `;
      } else {
        // Check if this is a new session
        const sessionExists = await prisma.$queryRaw`
          SELECT id FROM site_visit 
          WHERE session_id = ${sessionId} 
          AND NOT (session_id = ${sessionId} AND page_path = ${pagePath})
          LIMIT 1
        `;

        if (Array.isArray(sessionExists) && sessionExists.length > 0) {
          // Existing session, only increment total visits
          await prisma.$executeRaw`
            UPDATE site_stats 
            SET total_visits = total_visits + 1, updated_at = NOW()
            WHERE id = ${(stats as any)[0].id}
          `;
        } else {
          // New session, increment both
          await prisma.$executeRaw`
            UPDATE site_stats 
            SET total_visits = total_visits + 1, unique_sessions = unique_sessions + 1, updated_at = NOW()
            WHERE id = ${(stats as any)[0].id}
          `;
        }
      }
    }

    return res.json({ 
      success: true, 
      message: 'Visit tracked successfully' 
    });

  } catch (error) {
    console.error('Error tracking visit:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to track visit' 
    });
  }
});

// Get website statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await prisma.$queryRaw`
      SELECT * FROM site_stats LIMIT 1
    `;

    if (!Array.isArray(stats) || stats.length === 0) {
      // Return default stats if none exist
      return res.json({
        success: true,
        data: {
          totalVisits: 0,
          uniqueSessions: 0,
          since: new Date(),
          lastUpdated: new Date()
        }
      });
    }

    const statsData = (stats as any)[0];
    return res.json({
      success: true,
      data: {
        totalVisits: statsData.total_visits || 0,
        uniqueSessions: statsData.unique_sessions || 0,
        since: statsData.created_at,
        lastUpdated: statsData.updated_at
      }
    });

  } catch (error) {
    console.error('Error getting stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get statistics'
    });
  }
});

// Generate new session ID for clients
router.get('/session', (req, res) => {
  try {
    const sessionId = generateSessionId();
    res.json({
      success: true,
      sessionId
    });
  } catch (error) {
    console.error('Error generating session ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate session ID'
    });
  }
});

// Reset counter (admin only - you might want to add authentication)
router.post('/reset', async (req, res) => {
  try {
    // Clear all site visits using raw SQL
    await prisma.$executeRaw`DELETE FROM site_visit`;

    // Reset or create stats using raw SQL
    const stats = await prisma.$queryRaw`SELECT * FROM site_stats LIMIT 1`;
    
    if (Array.isArray(stats) && stats.length > 0) {
      await prisma.$executeRaw`
        UPDATE site_stats 
        SET total_visits = 0, unique_sessions = 0, updated_at = NOW()
        WHERE id = ${(stats as any)[0].id}
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO site_stats (id, total_visits, unique_sessions, created_at, updated_at)
        VALUES (UUID(), 0, 0, NOW(), NOW())
      `;
    }

    return res.json({
      success: true,
      message: 'Counter reset successfully'
    });

  } catch (error) {
    console.error('Error resetting counter:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset counter'
    });
  }
});

export default router;