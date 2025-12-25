import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { getT } from "../lib/i18n";

/**
 * Get all pending courses for approval
 * Accessible by ADMIN and SUPER_ADMIN
 */
export const getPendingCourses = async (req: Request, res: Response): Promise<void> => {
    try {
        const t = getT(req);

        const courses = await prisma.course.findMany({
            where: {
                approval_status: "pending",
            },
            include: {
                submitted_by: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
                department: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                submitted_at: "desc",
            },
        });

        res.json({
            success: true,
            courses,
            count: courses.length,
        });
    } catch (error: any) {
        const t = getT(req);
        console.error("Error fetching pending courses:", error);
        res.status(500).json({
            success: false,
            message: t("errors.server_error"),
            error: error.message,
        });
    }
};

/**
 * Approve a course
 * Accessible by ADMIN with can_approve permission or SUPER_ADMIN
 */
export const approveCourse = async (req: Request, res: Response): Promise<void> => {
    try {
        const t = getT(req);
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: t("auth.authentication_required"),
            });
            return;
        }

        if (!id) {
            res.status(400).json({
                success: false,
                message: "Course ID is required",
            });
            return;
        }

        // Check if course exists and is pending
        const course = await prisma.course.findUnique({
            where: { id },
        });

        if (!course) {
            res.status(404).json({
                success: false,
                message: t("errors.course_not_found"),
            });
            return;
        }

        if (course.approval_status !== "pending") {
            res.status(400).json({
                success: false,
                message: "Course is not pending approval",
            });
            return;
        }

        // Update course status
        const updatedCourse = await prisma.course.update({
            where: { id },
            data: {
                approval_status: "approved",
                approved_by_id: userId,
                approved_at: new Date(),
                is_published: true, // Auto-publish approved courses
            },
            include: {
                submitted_by: {
                    select: {
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
            },
        });

        res.json({
            success: true,
            message: "Course approved successfully",
            course: updatedCourse,
        });
    } catch (error: any) {
        const t = getT(req);
        console.error("Error approving course:", error);
        res.status(500).json({
            success: false,
            message: t("errors.server_error"),
            error: error.message,
        });
    }
};

/**
 * Reject a course with reason
 * Accessible by ADMIN with can_approve permission or SUPER_ADMIN
 */
export const rejectCourse = async (req: Request, res: Response): Promise<void> => {
    try {
        const t = getT(req);
        const { id } = req.params;
        const { rejection_reason } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: t("auth.authentication_required"),
            });
            return;
        }

        if (!id) {
            res.status(400).json({
                success: false,
                message: "Course ID is required",
            });
            return;
        }

        if (!rejection_reason || !rejection_reason.trim()) {
            res.status(400).json({
                success: false,
                message: "Rejection reason is required",
            });
            return;
        }

        // Check if course exists and is pending
        const course = await prisma.course.findUnique({
            where: { id },
        });

        if (!course) {
            res.status(404).json({
                success: false,
                message: t("errors.course_not_found"),
            });
            return;
        }

        if (course.approval_status !== "pending") {
            res.status(400).json({
                success: false,
                message: "Course is not pending approval",
            });
            return;
        }

        // Update course status
        const updatedCourse = await prisma.course.update({
            where: { id },
            data: {
                approval_status: "rejected",
                approved_by_id: userId,
                approved_at: new Date(),
                rejection_reason: rejection_reason.trim(),
            },
            include: {
                submitted_by: {
                    select: {
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
            },
        });

        res.json({
            success: true,
            message: "Course rejected",
            course: updatedCourse,
        });
    } catch (error: any) {
        const t = getT(req);
        console.error("Error rejecting course:", error);
        res.status(500).json({
            success: false,
            message: t("errors.server_error"),
            error: error.message,
        });
    }
};

/**
 * Get courses submitted by the current user (Department Manager)
 */
export const getMySubmissions = async (req: Request, res: Response): Promise<void> => {
    try {
        const t = getT(req);
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: t("auth.authentication_required"),
            });
            return;
        }

        const courses = await prisma.course.findMany({
            where: {
                submitted_by_id: userId,
            },
            include: {
                approved_by: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                    },
                },
                department: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                submitted_at: "desc",
            },
        });

        res.json({
            success: true,
            courses,
            count: courses.length,
        });
    } catch (error: any) {
        const t = getT(req);
        console.error("Error fetching submissions:", error);
        res.status(500).json({
            success: false,
            message: t("errors.server_error"),
            error: error.message,
        });
    }
};

/**
 * Get course orders for the department manager's department
 */
export const getDepartmentOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const t = getT(req);
        const userId = req.user?.id;
        const departmentId = req.user?.department_id;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: t("auth.authentication_required"),
            });
            return;
        }

        if (!departmentId) {
            res.status(400).json({
                success: false,
                message: "User is not assigned to a department",
            });
            return;
        }

        // Get orders where the course belongs to this department
        const orders = await prisma.courseOrder.findMany({
            where: {
                items: {
                    some: {
                        course: {
                            department_id: departmentId,
                        },
                    },
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
                items: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                title: true,
                                price: true,
                                department_id: true,
                            },
                        },
                    },
                    where: {
                        course: {
                            department_id: departmentId,
                        },
                    },
                },
            },
            orderBy: {
                created_at: "desc",
            },
        });

        res.json({
            success: true,
            orders,
            count: orders.length,
        });
    } catch (error: any) {
        const t = getT(req);
        console.error("Error fetching department orders:", error);
        res.status(500).json({
            success: false,
            message: t("errors.server_error"),
            error: error.message,
        });
    }
};
