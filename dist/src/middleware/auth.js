"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireVerifiedUser = exports.requireInstructor = exports.requireAdmin = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const server_1 = require("../server");
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: 'Access token required' });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET not configured');
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret, {});
        const user = await server_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, role: true, is_verified: true }
        });
        if (!user) {
            res.status(401).json({ message: 'User not found' });
            return;
        }
        if (!user.is_verified) {
            res.status(401).json({ message: 'Account not verified' });
            return;
        }
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role
        };
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(403).json({ message: 'Invalid or expired token' });
    }
};
exports.authenticateToken = authenticateToken;
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
    }
    if (req.user.role !== 'ADMIN') {
        res.status(403).json({ message: 'Admin access required' });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requireInstructor = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
    }
    if (!['ADMIN', 'INSTRUCTOR'].includes(req.user.role)) {
        res.status(403).json({ message: 'Instructor access required' });
        return;
    }
    next();
};
exports.requireInstructor = requireInstructor;
const requireVerifiedUser = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
    }
    if (!['STUDENT', 'RESEARCHER', 'INSTRUCTOR', 'ADMIN'].includes(req.user.role)) {
        res.status(403).json({ message: 'Verified user access required' });
        return;
    }
    next();
};
exports.requireVerifiedUser = requireVerifiedUser;
//# sourceMappingURL=auth.js.map