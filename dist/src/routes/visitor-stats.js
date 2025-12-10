"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("../lib/prisma");
const router = express_1.default.Router();
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
        const existingVisit = await prisma_1.prisma.siteVisit.findFirst({
            where: {
                session_id: sessionId,
                page_path: pagePath
            }
        });
        if (!existingVisit) {
            await prisma_1.prisma.siteVisit.create({
                data: {
                    session_id: sessionId,
                    page_path: pagePath
                }
            });
            let stats = await prisma_1.prisma.siteStats.findFirst();
            if (!stats) {
                stats = await prisma_1.prisma.siteStats.create({
                    data: {
                        total_visits: 1,
                        unique_sessions: 1
                    }
                });
            }
            else {
                const otherVisits = await prisma_1.prisma.siteVisit.findFirst({
                    where: {
                        session_id: sessionId,
                        page_path: {
                            not: pagePath
                        }
                    }
                });
                if (otherVisits) {
                    await prisma_1.prisma.siteStats.update({
                        where: { id: stats.id },
                        data: {
                            total_visits: {
                                increment: 1
                            }
                        }
                    });
                }
                else {
                    await prisma_1.prisma.siteStats.update({
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
            message: 'Visit tracked successfully'
        });
    }
    catch (error) {
        console.error('Error tracking visit:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to track visit',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
router.get('/stats', async (req, res) => {
    try {
        const stats = await prisma_1.prisma.siteStats.findFirst();
        if (!stats) {
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
    }
    catch (error) {
        console.error('Error getting stats:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get statistics',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
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
        await prisma_1.prisma.siteVisit.deleteMany({});
        const stats = await prisma_1.prisma.siteStats.findFirst();
        if (stats) {
            await prisma_1.prisma.siteStats.update({
                where: { id: stats.id },
                data: {
                    total_visits: 0,
                    unique_sessions: 0
                }
            });
        }
        else {
            await prisma_1.prisma.siteStats.create({
                data: {
                    total_visits: 0,
                    unique_sessions: 0
                }
            });
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
            message: 'Failed to reset counter',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
exports.default = router;
//# sourceMappingURL=visitor-stats.js.map