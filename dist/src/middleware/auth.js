"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireVerifiedUser = exports.requireDepartmentManager = exports.requireInstructor = exports.requireAdmin = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const i18n_1 = require("../lib/i18n");
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        if (!token) {
            const t = (0, i18n_1.getT)(req);
            res.status(401).json({ message: t("auth.access_token_required") });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("JWT_SECRET not configured");
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret, {});
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                role: true,
                is_verified: true,
                department_id: true,
            },
        });
        if (!user) {
            const t = (0, i18n_1.getT)(req);
            res.status(401).json({ message: t("auth.user_not_found") });
            return;
        }
        if (!user.is_verified) {
            const t = (0, i18n_1.getT)(req);
            res.status(401).json({ message: t("auth.account_not_verified") });
            return;
        }
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            department_id: user.department_id,
        };
        next();
    }
    catch (error) {
        console.error("Authentication error:", error);
        const t = (0, i18n_1.getT)(req);
        res.status(403).json({ message: t("auth.invalid_or_expired_token") });
    }
};
exports.authenticateToken = authenticateToken;
const requireAdmin = (req, res, next) => {
    const t = (0, i18n_1.getT)(req);
    if (!req.user) {
        res.status(401).json({ message: t("auth.authentication_required") });
        return;
    }
    if (req.user.role !== "ADMIN") {
        res.status(403).json({ message: t("auth.admin_access_required") });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requireInstructor = (req, res, next) => {
    const t = (0, i18n_1.getT)(req);
    if (!req.user) {
        res.status(401).json({ message: t("auth.authentication_required") });
        return;
    }
    if (!["ADMIN", "INSTRUCTOR", "DEPARTMENT_MANAGER"].includes(req.user.role)) {
        res.status(403).json({ message: t("auth.instructor_access_required") });
        return;
    }
    next();
};
exports.requireInstructor = requireInstructor;
const requireDepartmentManager = (req, res, next) => {
    const t = (0, i18n_1.getT)(req);
    if (!req.user) {
        res.status(401).json({ message: t("auth.authentication_required") });
        return;
    }
    if (req.user.role !== "DEPARTMENT_MANAGER") {
        res.status(403).json({
            message: t("auth.department_manager_access_required") ||
                "Department manager access required",
        });
        return;
    }
    if (!req.user.department_id) {
        res.status(403).json({
            message: t("auth.department_not_assigned") ||
                "User is not assigned to a department",
        });
        return;
    }
    next();
};
exports.requireDepartmentManager = requireDepartmentManager;
const requireVerifiedUser = (req, res, next) => {
    const t = (0, i18n_1.getT)(req);
    if (!req.user) {
        res.status(401).json({ message: t("auth.authentication_required") });
        return;
    }
    if (![
        "STUDENT",
        "RESEARCHER",
        "INSTRUCTOR",
        "ADMIN",
        "DEPARTMENT_MANAGER",
    ].includes(req.user.role)) {
        res.status(403).json({ message: t("auth.verified_user_access_required") });
        return;
    }
    next();
};
exports.requireVerifiedUser = requireVerifiedUser;
//# sourceMappingURL=auth.js.map