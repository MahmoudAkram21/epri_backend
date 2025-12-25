import { Router } from "express";
import {
    getPendingCourses,
    approveCourse,
    rejectCourse,
    getMySubmissions,
    getDepartmentOrders,
} from "../controllers/courseApproval.controller";
import {
    authenticateToken,
    requirePermission,
    requireDepartmentManager,
} from "../middleware/auth";

const router = Router();

/**
 * @route   GET /api/courses/pending
 * @desc    Get all pending courses for approval
 * @access  Admin (with approve permission) or Super Admin
 */
router.get(
    "/pending",
    authenticateToken,
    requirePermission("course_approvals", "approve"),
    getPendingCourses
);

/**
 * @route   POST /api/courses/:id/approve
 * @desc    Approve a pending course
 * @access  Admin (with approve permission) or Super Admin
 */
router.post(
    "/:id/approve",
    authenticateToken,
    requirePermission("course_approvals", "approve"),
    approveCourse
);

/**
 * @route   POST /api/courses/:id/reject
 * @desc    Reject a pending course with reason
 * @access  Admin (with approve permission) or Super Admin
 */
router.post(
    "/:id/reject",
    authenticateToken,
    requirePermission("course_approvals", "approve"),
    rejectCourse
);

/**
 * @route   GET /api/courses/my-submissions
 * @desc    Get courses submitted by the current user (Department Manager)
 * @access  Department Manager
 */
router.get(
    "/my-submissions",
    authenticateToken,
    requireDepartmentManager,
    getMySubmissions
);

/**
 * @route   GET /api/department-orders
 * @desc    Get course orders for department manager's department
 * @access  Department Manager
 */
router.get(
    "/department-orders",
    authenticateToken,
    requireDepartmentManager,
    getDepartmentOrders
);

export default router;
