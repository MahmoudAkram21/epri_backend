"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3002;
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'EPRI Backend API is running',
        timestamp: new Date().toISOString()
    });
});
app.post('/api/auth/register', (req, res) => {
    res.json({
        message: 'Registration endpoint - ready for implementation',
        data: req.body
    });
});
app.post('/api/auth/login', (req, res) => {
    res.json({
        message: 'Login endpoint - ready for implementation',
        data: req.body
    });
});
app.get('/api/auth/profile', (req, res) => {
    res.json({
        message: 'Profile endpoint - ready for implementation'
    });
});
app.get('/api/events', (req, res) => {
    res.json({
        events: [],
        message: 'Events endpoint - ready for implementation',
        query: req.query
    });
});
app.get('/api/events/:id', (req, res) => {
    res.json({
        message: 'Single event endpoint - ready for implementation',
        id: req.params.id
    });
});
app.post('/api/events', (req, res) => {
    res.json({
        message: 'Create event endpoint - ready for implementation',
        data: req.body
    });
});
app.get('/api/dashboard/stats', (req, res) => {
    res.json({
        stats: {
            totalUsers: 0,
            totalEvents: 0,
            totalRegistrations: 0
        },
        message: 'Dashboard stats endpoint - ready for implementation'
    });
});
app.get('/api/dashboard/user', (req, res) => {
    res.json({
        dashboard: {
            profile: null
        },
        message: 'User dashboard endpoint - ready for implementation'
    });
});
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});
app.listen(port, () => {
    console.log(`🚀 EPRI Backend server running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/api/health`);
    console.log(`🔧 API endpoints ready for implementation`);
});
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    process.exit(0);
});
//# sourceMappingURL=server-clean.js.map