"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("../lib/prisma");
const i18n_1 = require("../lib/i18n");
const router = express_1.default.Router();
function generateSessionId() {
    return crypto_1.default.randomBytes(16).toString('hex');
}
router.post('/track', async (req, res) => {
    try {
        const { sessionId, pagePath = '/' } = req.body;
        const t = (0, i18n_1.getT)(req);
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: t('validation.session_id_required')
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
            message: t('visitor_stats.visit_tracked')
        });
    }
    catch (error) {
        console.error('Error tracking visit:', error);
        const t = (0, i18n_1.getT)(req);
        return res.status(500).json({
            success: false,
            message: t('visitor_stats.failed_to_track'),
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
        const t = (0, i18n_1.getT)(req);
        return res.status(500).json({
            success: false,
            message: t('visitor_stats.failed_to_get_stats'),
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
        const t = (0, i18n_1.getT)(req);
        res.status(500).json({
            success: false,
            message: t('visitor_stats.failed_to_generate_session')
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
        const t = (0, i18n_1.getT)(req);
        return res.json({
            success: true,
            message: t('visitor_stats.counter_reset')
        });
    }
    catch (error) {
        console.error('Error resetting counter:', error);
        const t = (0, i18n_1.getT)(req);
        return res.status(500).json({
            success: false,
            message: t('visitor_stats.failed_to_reset'),
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
exports.default = router;
//# sourceMappingURL=visitor-stats.js.map