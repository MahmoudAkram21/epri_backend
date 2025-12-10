import express from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { getT } from '../lib/i18n';

const router = express.Router();

// Generate a simple session ID
function generateSessionId(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Track a page visit
router.post('/track', async (req, res) => {
  try {
    const { sessionId, pagePath = '/' } = req.body;
    
    const t = getT(req);
    if (!sessionId) {
      return res.status(400).json({ 
        success: false, 
        message: t('validation.session_id_required') 
      });
    }

    // Check if this session already visited this page
    // Use findFirst since we have a compound unique constraint
    const existingVisit = await prisma.siteVisit.findFirst({
      where: {
        session_id: sessionId,
        page_path: pagePath
      }
    });

    if (!existingVisit) {
      // New visit - create visit record
      await prisma.siteVisit.create({
        data: {
          session_id: sessionId,
          page_path: pagePath
        }
      });

      // Get or create site stats
      let stats = await prisma.siteStats.findFirst();
      
      if (!stats) {
        // Create initial stats record
        stats = await prisma.siteStats.create({
          data: {
            total_visits: 1,
            unique_sessions: 1
          }
        });
      } else {
        // Check if this is a new session (has this session visited any other page?)
        const otherVisits = await prisma.siteVisit.findFirst({
          where: {
            session_id: sessionId,
            page_path: {
              not: pagePath
            }
          }
        });

        if (otherVisits) {
          // Existing session, only increment total visits
          await prisma.siteStats.update({
            where: { id: stats.id },
            data: {
              total_visits: {
                increment: 1
              }
            }
          });
        } else {
          // New session, increment both
          await prisma.siteStats.update({
            where: { id: stats.id },
            data: {
              total_visits: {
                increment: 1
              },
              unique_sessions: {
                increment: 1
              }
            }
          });
        }
      }
    }

    return res.json({ 
      success: true, 
      message: t('visitor_stats.visit_tracked') 
    });

  } catch (error: any) {
    console.error('Error tracking visit:', error);
    const t = getT(req);
    return res.status(500).json({ 
      success: false, 
      message: t('visitor_stats.failed_to_track'),
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
});

// Get website statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await prisma.siteStats.findFirst();

    if (!stats) {
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

    return res.json({
      success: true,
      data: {
        totalVisits: stats.total_visits || 0,
        uniqueSessions: stats.unique_sessions || 0,
        since: stats.created_at,
        lastUpdated: stats.updated_at
      }
    });

  } catch (error: any) {
    console.error('Error getting stats:', error);
    const t = getT(req);
    return res.status(500).json({
      success: false,
      message: t('visitor_stats.failed_to_get_stats'),
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
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
    const t = getT(req);
    res.status(500).json({
      success: false,
      message: t('visitor_stats.failed_to_generate_session')
    });
  }
});

// Reset counter (admin only - you might want to add authentication)
router.post('/reset', async (req, res) => {
  try {
    // Clear all site visits
    await prisma.siteVisit.deleteMany({});

    // Reset or create stats
    const stats = await prisma.siteStats.findFirst();
    
    if (stats) {
      await prisma.siteStats.update({
        where: { id: stats.id },
        data: {
          total_visits: 0,
          unique_sessions: 0
        }
      });
    } else {
      await prisma.siteStats.create({
        data: {
          total_visits: 0,
          unique_sessions: 0
        }
      });
    }

    const t = getT(req);
    return res.json({
      success: true,
      message: t('visitor_stats.counter_reset')
    });

  } catch (error: any) {
    console.error('Error resetting counter:', error);
    const t = getT(req);
    return res.status(500).json({
      success: false,
      message: t('visitor_stats.failed_to_reset'),
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
});

export default router;