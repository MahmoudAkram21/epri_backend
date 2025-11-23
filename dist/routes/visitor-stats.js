"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
function generateSessionId() {
    return crypto_1.default.randomBytes(16).toString('hex');
}
router.post('/track', async (req, res) => {
    try {
        const { sessionId, pagePath = '/' } = req.body;
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID is required'
            });
        }
        const existingVisit = await prisma.$queryRaw `
      SELECT id FROM site_visit 
      WHERE session_id = ${sessionId} AND page_path = ${pagePath}
      LIMIT 1
    `;
        if (!Array.isArray(existingVisit) || existingVisit.length === 0) {
            await prisma.$executeRaw `
        INSERT INTO site_visit (id, session_id, page_path, visited_at)
        VALUES (UUID(), ${sessionId}, ${pagePath}, NOW())
      `;
            const stats = await prisma.$queryRaw `
        SELECT * FROM site_stats LIMIT 1
      `;
            if (!Array.isArray(stats) || stats.length === 0) {
                await prisma.$executeRaw `
          INSERT INTO site_stats (id, total_visits, unique_sessions, created_at, updated_at)
          VALUES (UUID(), 1, 1, NOW(), NOW())
        `;
            }
            else {
                const sessionExists = await prisma.$queryRaw `
          SELECT id FROM site_visit 
          WHERE session_id = ${sessionId} 
          AND NOT (session_id = ${sessionId} AND page_path = ${pagePath})
          LIMIT 1
        `;
                if (Array.isArray(sessionExists) && sessionExists.length > 0) {
                    await prisma.$executeRaw `
            UPDATE site_stats 
            SET total_visits = total_visits + 1, updated_at = NOW()
            WHERE id = ${stats[0].id}
          `;
                }
                else {
                    await prisma.$executeRaw `
            UPDATE site_stats 
            SET total_visits = total_visits + 1, unique_sessions = unique_sessions + 1, updated_at = NOW()
            WHERE id = ${stats[0].id}
          `;
                }
            }
        }
        return res.json({
            success: true,
            message: 'Visit tracked successfully'
        });
    }
    catch (error) {
        console.error('Error tracking visit:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to track visit'
        });
    }
});
router.get('/stats', async (req, res) => {
    try {
        const stats = await prisma.$queryRaw `
      SELECT * FROM site_stats LIMIT 1
    `;
        if (!Array.isArray(stats) || stats.length === 0) {
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
        const statsData = stats[0];
        return res.json({
            success: true,
            data: {
                totalVisits: statsData.total_visits || 0,
                uniqueSessions: statsData.unique_sessions || 0,
                since: statsData.created_at,
                lastUpdated: statsData.updated_at
            }
        });
    }
    catch (error) {
        console.error('Error getting stats:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get statistics'
        });
    }
});
router.get('/session', (req, res) => {
    try {
        const sessionId = generateSessionId();
        res.json({
            success: true,
            sessionId
        });
    }
    catch (error) {
        console.error('Error generating session ID:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate session ID'
        });
    }
});
router.post('/reset', async (req, res) => {
    try {
        await prisma.$executeRaw `DELETE FROM site_visit`;
        const stats = await prisma.$queryRaw `SELECT * FROM site_stats LIMIT 1`;
        if (Array.isArray(stats) && stats.length > 0) {
            await prisma.$executeRaw `
        UPDATE site_stats 
        SET total_visits = 0, unique_sessions = 0, updated_at = NOW()
        WHERE id = ${stats[0].id}
      `;
        }
        else {
            await prisma.$executeRaw `
        INSERT INTO site_stats (id, total_visits, unique_sessions, created_at, updated_at)
        VALUES (UUID(), 0, 0, NOW(), NOW())
      `;
        }
        return res.json({
            success: true,
            message: 'Counter reset successfully'
        });
    }
    catch (error) {
        console.error('Error resetting counter:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to reset counter'
        });
    }
});
exports.default = router;
//# sourceMappingURL=visitor-stats.js.map