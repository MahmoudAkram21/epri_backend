import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { getT } from "../lib/i18n";

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        department_id?: string | null;
      };
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      const t = getT(req);
      res.status(401).json({ message: t("auth.access_token_required") });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET not configured");
    }

    const decoded = jwt.verify(token, jwtSecret, {}) as any;

    // Verify user still exists in database
    const user = await prisma.user.findUnique({
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
      const t = getT(req);
      res.status(401).json({ message: t("auth.user_not_found") });
      return;
    }

    if (!user.is_verified) {
      const t = getT(req);
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
  } catch (error) {
    console.error("Authentication error:", error);
    const t = getT(req);
    res.status(403).json({ message: t("auth.invalid_or_expired_token") });
  }
};

// Admin middleware (includes Super Admin)
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const t = getT(req);
  if (!req.user) {
    res.status(401).json({ message: t("auth.authentication_required") });
    return;
  }

  if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
    res.status(403).json({ message: t("auth.admin_access_required") });
    return;
  }

  next();
};

// Super Admin only middleware
export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const t = getT(req);
  if (!req.user) {
    res.status(401).json({ message: t("auth.authentication_required") });
    return;
  }

  if (req.user.role !== "SUPER_ADMIN") {
    res.status(403).json({ message: t("auth.super_admin_access_required") });
    return;
  }

  next();
};

// Permission-based middleware (checks AdminPermission table)
export const requirePermission = (
  resource: string,
  action: "view" | "create" | "edit" | "delete" | "approve"
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const t = getT(req);
    if (!req.user) {
      res.status(401).json({ message: t("auth.authentication_required") });
      return;
    }

    // Super Admin has all permissions
    if (req.user.role === "SUPER_ADMIN") {
      next();
      return;
    }

    // Regular Admin needs specific permission
    if (req.user.role === "ADMIN") {
      const permission = await prisma.adminPermission.findUnique({
        where: {
          admin_id_resource: {
            admin_id: req.user.id,
            resource: resource,
          },
        },
      });

      if (!permission) {
        res.status(403).json({ message: t("auth.permission_denied") });
        return;
      }

      const hasPermission =
        (action === "view" && permission.can_view) ||
        (action === "create" && permission.can_create) ||
        (action === "edit" && permission.can_edit) ||
        (action === "delete" && permission.can_delete) ||
        (action === "approve" && permission.can_approve);

      if (!hasPermission) {
        res.status(403).json({ message: t("auth.permission_denied") });
        return;
      }

      next();
      return;
    }

    // Other roles don't have permission
    res.status(403).json({ message: t("auth.permission_denied") });
  };
};

export const requireInstructor = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const t = getT(req);
  if (!req.user) {
    res.status(401).json({ message: t("auth.authentication_required") });
    return;
  }

  if (!["SUPER_ADMIN", "ADMIN", "INSTRUCTOR", "DEPARTMENT_MANAGER"].includes(req.user.role)) {
    res.status(403).json({ message: t("auth.instructor_access_required") });
    return;
  }

  next();
};

export const requireDepartmentManager = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const t = getT(req);
  if (!req.user) {
    res.status(401).json({ message: t("auth.authentication_required") });
    return;
  }

  if (req.user.role !== "DEPARTMENT_MANAGER") {
    res.status(403).json({
      message:
        t("auth.department_manager_access_required") ||
        "Department manager access required",
    });
    return;
  }

  if (!req.user.department_id) {
    res.status(403).json({
      message:
        t("auth.department_not_assigned") ||
        "User is not assigned to a department",
    });
    return;
  }

  next();
};

export const requireVerifiedUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const t = getT(req);
  if (!req.user) {
    res.status(401).json({ message: t("auth.authentication_required") });
    return;
  }

  // Check for allowed roles (all roles)
  const allowedRoles = [
    "SUPER_ADMIN",
    "ADMIN",
    "EMPLOYEE",
    "INSTRUCTOR",
    "DEPARTMENT_MANAGER",
    "GUEST",
  ];

  if (!allowedRoles.includes(req.user.role)) {
    res.status(403).json({ message: t("auth.invalid_role") });
    return;
  }

  next();
};
