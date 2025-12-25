import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import os from "os";
import crypto from "crypto";
import { createHttpsServer, isHttpsEnabled } from "./https-server";
import { prisma } from "./lib/prisma";
import { i18nMiddleware, getT, getLocale, Locale } from "./lib/i18n";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3002;

// Helper functions for service centers
const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const parseJsonValue = <T>(value: any, fallback: T): T => {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string") {
    if (value.trim() === "") {
      return fallback;
    }

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.warn("Failed to parse JSON string field. Returning fallback.", {
        value,
        error,
      });
      return fallback;
    }
  }

  return value as T;
};

/**
 * Extract language-specific value from a Json field that contains { en: string, ar: string }
 */
const extractLocalizedValue = (
  value: any,
  locale: Locale = "en"
): string | null => {
  if (!value) return null;

  // If it's already a string, return it
  if (typeof value === "string") {
    return value;
  }

  // If it's an object with locale keys
  if (typeof value === "object" && value !== null) {
    // Try to get the locale-specific value
    if (value[locale]) {
      return value[locale];
    }
    // Fallback to English if locale not found
    if (value.en) {
      return value.en;
    }
    // Fallback to Arabic if English not found
    if (value.ar) {
      return value.ar;
    }
    // If it's an array or other object, stringify it
    if (Array.isArray(value) || Object.keys(value).length > 0) {
      return JSON.stringify(value);
    }
  }

  return null;
};

const normalizeCenterEquipments = (
  equipments: any,
  locale: Locale = "en"
): any[] => {
  if (!Array.isArray(equipments)) return [];

  return equipments.map((equipment: any) => ({
    id: equipment.id,
    name: extractLocalizedValue(equipment.name, locale) || "",
    details: extractLocalizedValue(equipment.description, locale),
    description: extractLocalizedValue(equipment.description, locale),
    image: equipment.image ?? null,
    specifications: parseJsonValue(equipment.specifications, null as any),
  }));
};

const parseEquipmentItems = (
  input: any
): Array<{
  name: string;
  description: string | null;
  image: string | null;
  specifications: any;
}> => {
  const items = parseJsonValue(input, [] as any[]);
  if (!Array.isArray(items)) return [];

  return items
    .map((item: any) => {
      if (!item || typeof item !== "object") return null;
      const name = item.name ?? item.title ?? "";
      if (!name) return null;

      return {
        name,
        description: item.details ?? item.description ?? null,
        image: item.image ?? null,
        specifications:
          item.specifications !== undefined
            ? parseJsonValue(item.specifications, null as any)
            : null,
      };
    })
    .filter(
      (
        item
      ): item is {
        name: string;
        description: string | null;
        image: string | null;
        specifications: any;
      } => item !== null
    );
};

const syncServiceCenterEquipments = async (
  centerId: string,
  equipments: Array<{
    name: string;
    description: string | null;
    image: string | null;
    specifications: any;
  }>
) => {
  await (prisma as any).serviceEquipment.deleteMany({
    where: { service_center_id: centerId },
  });

  if (equipments.length === 0) {
    return;
  }

  await (prisma as any).serviceEquipment.createMany({
    data: equipments.map((equipment) => ({
      service_center_id: centerId,
      name: equipment.name,
      description: equipment.description,
      image: equipment.image,
      specifications: equipment.specifications,
    })),
  });
};

const transformServiceCenter = (center: any, locale: Locale = "en") => {
  const { equipments, products_list, staff, ...rest } = center;

  // Transform products from Product table relation
  let transformedProducts: any[] = [];

  try {
    if (Array.isArray(products_list) && products_list.length > 0) {
      transformedProducts = products_list
        .map((product: any) => {
          try {
            return {
              id: product.id,
              name: extractLocalizedValue(product.name, locale) || "",
              slug: product.slug,
              description:
                extractLocalizedValue(product.description, locale) ||
                extractLocalizedValue(product.short_description, locale) ||
                null,
              short_description: extractLocalizedValue(
                product.short_description,
                locale
              ),
              image: product.image || null,
              images: product.images
                ? typeof product.images === "string"
                  ? JSON.parse(product.images)
                  : product.images
                : [],
              price: product.price
                ? parseFloat(product.price.toString())
                : null,
              original_price: product.original_price
                ? parseFloat(product.original_price.toString())
                : null,
              category: product.category || null,
              tags: product.tags
                ? typeof product.tags === "string"
                  ? JSON.parse(product.tags)
                  : product.tags
                : [],
              specifications: product.specifications
                ? typeof product.specifications === "string"
                  ? JSON.parse(product.specifications)
                  : product.specifications
                : null,
              features: product.features
                ? typeof product.features === "string"
                  ? JSON.parse(product.features)
                  : product.features
                : [],
              sizes: product.sizes
                ? typeof product.sizes === "string"
                  ? JSON.parse(product.sizes)
                  : product.sizes
                : [],
              stock_quantity: product.stock_quantity,
              sku: product.sku || null,
              is_featured: product.is_featured || false,
              is_published: product.is_published !== false,
              is_available: product.is_available !== false,
              order_index: product.order_index || 0,
            };
          } catch (productError) {
            console.warn("Error transforming product:", productError);
            return null;
          }
        })
        .filter((p: any) => p !== null);
    } else {
      // Fallback to JSON field if no relation or empty
      transformedProducts = parseJsonValue(center.products, [] as any[]);
    }
  } catch (error) {
    console.warn("Error transforming products:", error);
    // Fallback to JSON field or empty array
    transformedProducts = parseJsonValue(center.products, [] as any[]);
  }

  // Transform staff data with localized values
  let transformedStaff: any[] = [];
  if (Array.isArray(staff) && staff.length > 0) {
    transformedStaff = staff
      .map((scs: any) => {
        const staffMember = scs.staff;
        if (!staffMember) return null;
        return {
          ...staffMember,
          name: extractLocalizedValue(staffMember.name, locale) || "",
          title: extractLocalizedValue(staffMember.title, locale) || "",
          academic_position: extractLocalizedValue(staffMember.academic_position, locale),
          current_admin_position: extractLocalizedValue(
            staffMember.current_admin_position,
            locale
          ),
          bio: extractLocalizedValue(staffMember.bio, locale),
          research_interests: extractLocalizedValue(
            staffMember.research_interests,
            locale
          ),
        };
      })
      .filter((s: any) => s !== null);
  }

  return {
    ...rest,
    name: extractLocalizedValue(center.name, locale) || "",
    headline: extractLocalizedValue(center.headline, locale),
    description: extractLocalizedValue(center.description, locale),
    location: extractLocalizedValue(center.location, locale),
    lab_methodology: extractLocalizedValue(center.lab_methodology, locale),
    future_prospective: extractLocalizedValue(
      center.future_prospective,
      locale
    ),
    equipments: normalizeCenterEquipments(equipments || [], locale),
    products: transformedProducts,
    staff: transformedStaff,
    work_volume: parseJsonValue(center.work_volume, null as any),
    company_activity: parseJsonValue(center.company_activity, null as any),
    services: parseJsonValue(center.services, [] as any[]),
    metrics: parseJsonValue(center.metrics, null as any),
  };
};

const parseBoolean = (value: any, fallback: boolean): boolean => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "") return fallback;
    if (normalized === "true" || normalized === "1" || normalized === "yes")
      return true;
    if (normalized === "false" || normalized === "0" || normalized === "no")
      return false;
  }
  return fallback;
};

const parseNumber = (value: any, fallback: number): number => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) return parsed;
  }
  return fallback;
};

// Middleware - CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://epri.developteam.site",
  "https://epri.developteam.site",
  "http://epri.developteam.site:3000",
  "https://epri.developteam.site:3000",
  "http://epri.developteam.site:5000",
  "https://epri.developteam.site:5000",
  "http://localhost:3000",
  "http://localhost:3002",
  "https://localhost:3000",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, or curl requests)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // For deployment, allow same domain with different protocol/port
        try {
          const originUrl = new URL(origin);
          const isSameDomain =
            originUrl.hostname === "epri.developteam.site" ||
            originUrl.hostname === "localhost" ||
            originUrl.hostname === "127.0.0.1";

          if (isSameDomain) {
            callback(null, true);
          } else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(new Error("Not allowed by CORS"));
          }
        } catch (error) {
          // Invalid URL format
          console.warn(`CORS blocked invalid origin: ${origin}`);
          callback(new Error("Not allowed by CORS"));
        }
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Length", "X-Foo", "X-Bar"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// i18n middleware - must be before other routes
app.use(i18nMiddleware);

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Get client IP (considering proxies/load balancers)
  const clientIP =
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    req.headers["x-real-ip"]?.toString() ||
    req.socket.remoteAddress ||
    "unknown";

  // Log request details
  console.log(`\n📥 [${timestamp}] ${req.method} ${req.originalUrl}`);
  console.log(`   IP: ${clientIP}`);
  console.log(`   Origin: ${req.headers.origin || "none"}`);
  console.log(`   User-Agent: ${req.headers["user-agent"] || "unknown"}`);

  // Log query parameters if present
  if (Object.keys(req.query).length > 0) {
    console.log(`   Query: ${JSON.stringify(req.query)}`);
  }

  // Log request body for POST/PUT/PATCH (sanitized to avoid logging sensitive data)
  if (
    ["POST", "PUT", "PATCH"].includes(req.method) &&
    req.body &&
    Object.keys(req.body).length > 0
  ) {
    // Create sanitized copy (remove password fields)
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = "[REDACTED]";
    if (sanitizedBody.password_hash) sanitizedBody.password_hash = "[REDACTED]";
    if (sanitizedBody.token) sanitizedBody.token = "[REDACTED]";

    console.log(
      `   Body: ${JSON.stringify(sanitizedBody).substring(0, 500)}${JSON.stringify(sanitizedBody).length > 500 ? "..." : ""}`
    );
  }

  // Log response when finished
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const statusColor =
      res.statusCode >= 400 ? "🔴" : res.statusCode >= 300 ? "🟡" : "🟢";
    console.log(
      `📤 [${new Date().toISOString()}] ${statusColor} ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`
    );
  });

  next();
});

// Import visitor stats routes
import visitorStatsRoutes from "./routes/visitor-stats";

// Health check endpoint
app.get("/api/health", (req, res) => {
  const t = getT(req);
  res.json({
    status: "OK",
    message: t("api.health_ok"),
    timestamp: new Date().toISOString(),
  });
});

// Add visitor stats routes
app.use("/api/visitor-stats", visitorStatsRoutes);

// Register new user
app.post("/api/auth/register", async (req, res) => {
  try {
    const t = getT(req);
    const {
      first_name,
      last_name,
      email,
      password,
      phone,
      role = "STUDENT",
    } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({
        message: t("common.badRequest"),
        error: t("auth.registrationFailed"),
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        message: t("auth.passwordTooShort"),
      });
    }

    // Prevent ADMIN role registration
    if (role === "ADMIN") {
      return res.status(400).json({
        message: t("common.forbidden"),
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: t("auth.emailExists") });
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user (always starts as unverified/pending)
    const user = await prisma.user.create({
      data: {
        first_name,
        last_name,
        email,
        password_hash,
        phone,
        role: role as any,
        is_verified: false, // Always start as pending
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        role: true,
        is_verified: true,
        created_at: true,
      },
    });

    return res.status(201).json({
      message: t("auth.registrationSuccess"),
      user,
    });
  } catch (error) {
    console.error("Registration error:", error);
    const t = getT(req);
    return res.status(500).json({ message: t("common.serverError") });
  }
});

// Login user
app.post("/api/auth/login", async (req, res) => {
  try {
    const t = getT(req);
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        message: t("auth.emailPasswordRequired"),
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: t("auth.invalidCredentials") });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(
      password,
      user.password_hash || ""
    );
    if (!isValidPassword) {
      return res.status(401).json({ message: t("auth.invalidCredentials") });
    }

    // Check if user is verified (return specific error code for pending accounts)
    if (!user.is_verified) {
      return res.status(403).json({
        message: t("auth.accountPending"),
        code: "ACCOUNT_PENDING",
      });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || "your-secret-key";
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: "7d" }
    );

    return res.json({
      message: t("auth.loginSuccess"),
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_verified: user.is_verified,
        department_id: user.department_id,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    const t = getT(req);
    return res.status(500).json({ message: t("common.serverError") });
  }
});

// Get current user profile (protected route)
app.get("/api/auth/profile", async (req, res) => {
  try {
    const t = getT(req);
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: t("auth.accessTokenRequired") });
    }

    const jwtSecret = process.env.JWT_SECRET || "your-secret-key";
    const decoded = jwt.verify(token, jwtSecret) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        role: true,
        is_verified: true,
        department_id: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      const t = getT(req);
      return res.status(404).json({ message: t("users.notFound") });
    }

    return res.json({ user });
  } catch (error) {
    console.error("Profile fetch error:", error);
    const t = getT(req);
    return res.status(403).json({ message: t("auth.tokenInvalid") });
  }
});

// Verify token
app.get("/api/auth/verify", async (req, res) => {
  try {
    const t = getT(req);
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: t("auth.accessTokenRequired") });
    }

    const jwtSecret = process.env.JWT_SECRET || "your-secret-key";
    const decoded = jwt.verify(token, jwtSecret) as any;

    return res.json({
      message: t("auth.tokenValid"),
      user: {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      },
    });
  } catch (error) {
    const t = getT(req);
    return res.status(403).json({ message: t("auth.tokenInvalid") });
  }
});

// Authentication middleware
const authenticateToken = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> => {
  try {
    const t = getT(req);
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ message: t("auth.access_token_required") });
      return;
    }

    const jwtSecret =
      process.env.JWT_SECRET || "your-secret-key-change-in-production";
    const decoded = jwt.verify(token, jwtSecret) as any;

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

    if (!user || !user.is_verified) {
      res.status(401).json({ message: t("auth.invalid_unverified_token") });
      return;
    }

    (req as any).user = {
      id: user.id,
      email: user.email,
      role: user.role,
      department_id: user.department_id,
    };

    next();
  } catch (error) {
    const t = getT(req);
    res.status(403).json({ message: t("auth.token_invalid") });
  }
};

// Admin-only middleware
const requireAdmin = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void => {
  const t = getT(req);
  const user = (req as any).user;
  if (!user || user.role !== "ADMIN") {
    res.status(403).json({ message: t("auth.admin_access_required") });
    return;
  }
  next();
};

// Admin or Department Manager middleware
const requireAdminOrDepartmentManager = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void => {
  const t = getT(req);
  const user = (req as any).user;
  if (!user) {
    res.status(401).json({ message: t("auth.authentication_required") });
    return;
  }
  if (user.role !== "ADMIN" && user.role !== "DEPARTMENT_MANAGER") {
    res.status(403).json({ message: t("auth.admin_access_required") });
    return;
  }
  if (user.role === "DEPARTMENT_MANAGER" && !user.department_id) {
    const t = getT(req);
    res
      .status(403)
      .json({ message: t("auth.department_manager_assignment_required") });
    return;
  }
  next();
};

// Basic events routes
app.get("/api/events", (req, res) => {
  const t = getT(req);
  res.json({
    events: [],
    message: t("events.endpoint_ready"),
    query: req.query,
  });
});

// ============================================================================
// COURSES API ENDPOINTS
// ============================================================================

// Get all courses (public)
app.get("/api/courses", async (req, res) => {
  try {
    const {
      category,
      level,
      delivery_type,
      is_featured,
      is_published = "true",
      page = "1",
      limit = "50",
    } = req.query;
    const locale = getLocale(req);

    console.log("Fetching courses with params:", {
      category,
      level,
      delivery_type,
      is_featured,
      is_published,
    });

    // Build where clause
    const where: any = {};

    if (is_published !== undefined) {
      where.is_published = is_published === "true";
    }

    if (category) {
      where.category = category;
    }

    if (level) {
      where.level = level;
    }

    if (delivery_type) {
      where.delivery_type = delivery_type;
    }

    if (is_featured !== undefined) {
      where.is_featured = is_featured === "true";
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        orderBy: [{ is_featured: "desc" }, { created_at: "desc" }],
        skip,
        take: limitNum,
        include: {
          lessons: {
            select: {
              id: true,
              title: true,
              duration: true,
              is_preview: true,
              order_index: true,
            },
            orderBy: {
              order_index: "asc",
            },
          },
        },
      }),
      prisma.course.count({ where }),
    ]);

    // Transform courses data to match frontend expectations and extract localized values
    const transformedCourses = courses.map((course: (typeof courses)[0]) => ({
      ...course,
      title: extractLocalizedValue(course.title, locale) || "",
      subtitle: extractLocalizedValue(course.subtitle, locale),
      description: extractLocalizedValue(course.description, locale),
      category: extractLocalizedValue(course.category, locale) || "",
      level: extractLocalizedValue(course.level, locale) || "",
      language: extractLocalizedValue(course.language, locale) || "",
      instructor_name: extractLocalizedValue(course.instructor_name, locale),
      meeting_location: extractLocalizedValue(course.meeting_location, locale),
      schedule_info: extractLocalizedValue(course.schedule_info, locale),
      lessons_count: course.lessons.length,
      total_duration: course.lessons.reduce(
        (sum: number, lesson: (typeof course.lessons)[0]) =>
          sum + lesson.duration,
        0
      ),
      preview_lessons: course.lessons.filter(
        (lesson: (typeof course.lessons)[0]) => lesson.is_preview
      ).length,
    }));

    console.log(`Found ${transformedCourses.length} courses`);

    return res.json({
      data: transformedCourses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error("Get courses error:", error);
    const t = getT(req);
    return res.status(500).json({
      message: t("common.server_error"),
      error:
        process.env.NODE_ENV === "development" ? error?.message : undefined,
    });
  }
});

// Get single course by ID (public)
app.get("/api/courses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const locale = getLocale(req);

    console.log("Fetching course:", id);

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        lessons: {
          orderBy: {
            order_index: "asc",
          },
        },
      },
    });

    if (!course) {
      const t = getT(req);
      return res.status(404).json({ message: t("courses.not_found") });
    }

    // Parse JSON fields and extract localized values
    const transformedCourse = {
      ...course,
      title: extractLocalizedValue(course.title, locale) || "",
      subtitle: extractLocalizedValue(course.subtitle, locale),
      description: extractLocalizedValue(course.description, locale),
      category: extractLocalizedValue(course.category, locale) || "",
      level: extractLocalizedValue(course.level, locale) || "",
      language: extractLocalizedValue(course.language, locale) || "",
      instructor_name: extractLocalizedValue(course.instructor_name, locale),
      meeting_location: extractLocalizedValue(course.meeting_location, locale),
      schedule_info: extractLocalizedValue(course.schedule_info, locale),
      objectives: course.objectives
        ? typeof course.objectives === "string"
          ? JSON.parse(course.objectives)
          : course.objectives
        : [],
      requirements: course.requirements
        ? typeof course.requirements === "string"
          ? JSON.parse(course.requirements)
          : course.requirements
        : [],
      lessons: course.lessons.map((lesson: any) => ({
        ...lesson,
        title: extractLocalizedValue(lesson.title, locale) || "",
        description: extractLocalizedValue(lesson.description, locale),
        content: lesson.content
          ? typeof lesson.content === "string"
            ? JSON.parse(lesson.content)
            : lesson.content
          : null,
        notes: extractLocalizedValue(lesson.notes, locale),
      })),
      lessons_count: course.lessons.length,
      total_duration: course.lessons.reduce(
        (sum: number, lesson: (typeof course.lessons)[0]) =>
          sum + lesson.duration,
        0
      ),
      preview_lessons: course.lessons
        .filter((lesson: (typeof course.lessons)[0]) => lesson.is_preview)
        .map((lesson: any) => ({
          ...lesson,
          title: extractLocalizedValue(lesson.title, locale) || "",
          description: extractLocalizedValue(lesson.description, locale),
        })),
    };

    return res.json({
      course: transformedCourse,
    });
  } catch (error: any) {
    console.error("Get course error:", error);
    const t = getT(req);
    return res.status(500).json({
      message: t("common.server_error"),
      error:
        process.env.NODE_ENV === "development" ? error?.message : undefined,
    });
  }
});

// Get course lessons (public)
app.get("/api/courses/:id/lessons", async (req, res) => {
  try {
    const { id } = req.params;
    const locale = getLocale(req);

    console.log("Fetching lessons for course:", id);

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!course) {
      const t = getT(req);
      return res.status(404).json({ message: t("courses.not_found") });
    }

    const lessons = await prisma.lesson.findMany({
      where: { course_id: id },
      orderBy: {
        order_index: "asc",
      },
    });

    // Transform lessons data with localized values
    const transformedLessons = lessons.map((lesson: (typeof lessons)[0]) => ({
      ...lesson,
      title: extractLocalizedValue(lesson.title, locale) || "",
      description: extractLocalizedValue(lesson.description, locale),
      content: lesson.content
        ? typeof lesson.content === "string"
          ? JSON.parse(lesson.content)
          : lesson.content
        : null,
      notes: extractLocalizedValue(lesson.notes, locale),
      attachments: lesson.attachments
        ? typeof lesson.attachments === "string"
          ? JSON.parse(lesson.attachments)
          : lesson.attachments
        : [],
      quiz_data: lesson.quiz_data
        ? typeof lesson.quiz_data === "string"
          ? JSON.parse(lesson.quiz_data)
          : lesson.quiz_data
        : null,
    }));

    return res.json({
      lessons: transformedLessons,
      course: {
        id: course.id,
        title: extractLocalizedValue(course.title, locale) || "",
      },
    });
  } catch (error: any) {
    console.error("Get course lessons error:", error);
    const t = getT(req);
    return res.status(500).json({
      message: t("common.server_error"),
      error:
        process.env.NODE_ENV === "development" ? error?.message : undefined,
    });
  }
});

// Get single lesson (public, but may require enrollment check)
app.get("/api/courses/:courseId/lessons/:lessonId", async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;

    console.log("Fetching lesson:", { courseId, lessonId });

    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        course_id: courseId,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            is_free: true,
          },
        },
      },
    });

    if (!lesson) {
      const t = getT(req);
      return res.status(404).json({ message: t("courses.lessonNotFound") });
    }

    // Transform lesson data
    const transformedLesson = {
      ...lesson,
      attachments: lesson.attachments
        ? JSON.parse(lesson.attachments as string)
        : [],
      quiz_data: lesson.quiz_data
        ? JSON.parse(lesson.quiz_data as string)
        : null,
    };

    return res.json({
      lesson: transformedLesson,
    });
  } catch (error: any) {
    console.error("Get lesson error:", error);
    const t = getT(req);
    return res.status(500).json({
      message: t("common.server_error"),
      error:
        process.env.NODE_ENV === "development" ? error?.message : undefined,
    });
  }
});

// Admin routes for managing events, users, and requests
app.get("/api/admin/events", async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        address: true,
        speakers: true,
        orders: {
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
        tickets: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return res.json({
      events,
      total: events.length,
    });
  } catch (error) {
    console.error("Admin events fetch error:", error);
    const t = getT(req);
    return res.status(500).json({ message: t("common.serverError") });
  }
});

// Get all users (admin only) - Updated to include plan and trial fields
app.get("/api/admin/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        role: true,
        is_verified: true,
        plan_type: true,
        plan_start_date: true,
        plan_end_date: true,
        is_trial_active: true,
        trial_start_date: true,
        trial_end_date: true,
        created_at: true,
        event_orders: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                start_date: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return res.json({
      users,
      total: users.length,
    });
  } catch (error) {
    console.error("Admin users fetch error:", error);
    const t = getT(req);
    return res.status(500).json({ message: t("common.serverError") });
  }
});

app.get("/api/admin/event-requests", async (req, res) => {
  try {
    const eventRequests = await prisma.eventOrder.findMany({
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            start_date: true,
            end_date: true,
            price: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return res.json({
      requests: eventRequests,
      total: eventRequests.length,
    });
  } catch (error) {
    console.error("Admin event requests fetch error:", error);
    const t = getT(req);
    return res.status(500).json({ message: t("common.serverError") });
  }
});

app.post("/api/admin/events", async (req, res) => {
  try {
    const t = getT(req);
    const {
      title,
      description,
      start_date,
      end_date,
      price,
      capacity,
      status,
      address_id,
      featured,
      registration_open,
      is_conference,
      cover_image,
      agenda,
      guidelines,
      category_ids,
      speaker_ids,
    } = req.body;

    const event = await prisma.event.create({
      data: {
        title,
        description,
        start_date: new Date(start_date),
        end_date: end_date ? new Date(end_date) : null,
        price: parseFloat(price) || 0,
        capacity: parseInt(capacity) || 100,
        status: status || "PUBLISHED",
        featured: featured || false,
        registration_open: registration_open !== false,
        is_conference: is_conference || false,
        cover_image: cover_image || null,
        agenda: agenda
          ? typeof agenda === "string"
            ? JSON.parse(agenda)
            : agenda
          : null,
        guidelines: guidelines || null,
        ...(address_id && { address_id }),
        categories: category_ids
          ? {
            create: category_ids.map((categoryId: string) => ({
              category_id: categoryId,
            })),
          }
          : undefined,
        speakers: speaker_ids
          ? {
            connect: speaker_ids.map((speakerId: string) => ({
              id: speakerId,
            })),
          }
          : undefined,
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        address: true,
        speakers: true,
      },
    });

    return res.status(201).json({
      message: t("events.created"),
      event,
    });
  } catch (error) {
    console.error("Create event error:", error);
    const t = getT(req);
    return res.status(500).json({ message: t("common.serverError") });
  }
});

app.put("/api/admin/events/:id", async (req, res) => {
  try {
    const t = getT(req);
    const { id } = req.params;
    const {
      title,
      description,
      start_date,
      end_date,
      price,
      capacity,
      status,
      address_id,
      featured,
      registration_open,
      is_conference,
      cover_image,
      agenda,
      guidelines,
    } = req.body;

    // If trying to set this event as a conference, make sure no other event is a conference
    if (is_conference) {
      // Find any other event that is currently a conference
      const existingConference = await prisma.event.findFirst({
        where: {
          is_conference: true,
          id: { not: id },
        },
      });

      if (existingConference) {
        // Unset the other conference
        await prisma.event.update({
          where: { id: existingConference.id },
          data: { is_conference: false },
        });
      }
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        title,
        description,
        start_date: start_date ? new Date(start_date) : undefined,
        end_date: end_date ? new Date(end_date) : undefined,
        price: price ? parseFloat(price) : undefined,
        capacity: capacity ? parseInt(capacity) : undefined,
        status,
        featured,
        registration_open,
        is_conference,
        cover_image,
        agenda:
          typeof agenda === "undefined"
            ? undefined
            : agenda
              ? typeof agenda === "string"
                ? JSON.parse(agenda)
                : agenda
              : null,
        guidelines,
        ...(address_id && { address_id }),
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        address: true,
        speakers: true,
      },
    });

    return res.json({
      message: t("events.updated"),
      event,
    });
  } catch (error) {
    console.error("Update event error:", error);
    const t = getT(req);
    return res.status(500).json({ message: t("common.serverError") });
  }
});

app.delete("/api/admin/events/:id", async (req, res) => {
  try {
    const t = getT(req);
    const { id } = req.params;

    await prisma.event.delete({
      where: { id },
    });

    return res.json({
      message: t("events.deleted"),
    });
  } catch (error) {
    console.error("Delete event error:", error);
    const t = getT(req);
    return res.status(500).json({ message: t("common.serverError") });
  }
});

app.put("/api/admin/users/:id/role", async (req, res) => {
  try {
    const t = getT(req);
    const { id } = req.params;
    const { role } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        is_verified: true,
      },
    });

    return res.json({
      message: t("auth.userRoleUpdated"),
      user,
    });
  } catch (error) {
    console.error("Update user role error:", error);
    const t = getT(req);
    return res.status(500).json({ message: t("common.serverError") });
  }
});

app.put("/api/admin/users/:id/verify", async (req, res) => {
  try {
    const t = getT(req);
    const { id } = req.params;
    const { is_verified } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { is_verified },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        is_verified: true,
      },
    });

    return res.json({
      message: t("auth.userVerificationUpdated"),
      user,
    });
  } catch (error) {
    console.error("Update user verification error:", error);
    const t = getT(req);
    return res.status(500).json({ message: t("common.serverError") });
  }
});

// Remove user from plan (admin only)
app.delete("/api/admin/users/:id/plan", async (req, res) => {
  try {
    const { id } = req.params;
    const t = getT(req);

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ message: t("auth.userNotFound") });
    }

    // Remove plan and reset plan dates
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        plan_type: null,
        plan_start_date: null,
        plan_end_date: null,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        is_verified: true,
        plan_type: true,
        plan_start_date: true,
        plan_end_date: true,
      },
    });

    return res.json({
      message: t("auth.userPlanRemoved"),
      user: updatedUser,
    });
  } catch (error) {
    console.error("Remove user plan error:", error);
    const t = getT(req);
    return res.status(500).json({ message: t("common.serverError") });
  }
});

// Stop free trial for user (admin only)
app.delete("/api/admin/users/:id/trial", async (req, res) => {
  try {
    const { id } = req.params;
    const t = getT(req);

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ message: t("auth.userNotFound") });
    }

    // Stop trial and reset trial dates
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        is_trial_active: false,
        trial_start_date: null,
        trial_end_date: null,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        is_verified: true,
        is_trial_active: true,
        trial_start_date: true,
        trial_end_date: true,
      },
    });

    return res.json({
      message: t("auth.userTrialStopped"),
      user: updatedUser,
    });
  } catch (error) {
    console.error("Stop user trial error:", error);
    const t = getT(req);
    return res.status(500).json({ message: t("common.serverError") });
  }
});

// Create new user (admin only)
app.post("/api/admin/users", async (req, res) => {
  try {
    const t = getT(req);
    const {
      first_name,
      last_name,
      email,
      password,
      phone,
      role = "STUDENT",
      is_verified = false,
    } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        message: t("auth.first_name_last_name_email_required"),
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: t("auth.user_with_email_exists") });
    }

    // Hash password if provided
    let password_hash = null;
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({
          message: t("auth.password_min_length"),
        });
      }
      const saltRounds = 12;
      password_hash = await bcrypt.hash(password, saltRounds);
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        first_name,
        last_name,
        email,
        password_hash,
        phone,
        role: role as any,
        is_verified,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        role: true,
        is_verified: true,
        created_at: true,
        updated_at: true,
      },
    });

    return res.status(201).json({
      message: t("auth.userCreated"),
      user,
    });
  } catch (error) {
    console.error("Create user error:", error);
    const t = getT(req);
    return res.status(500).json({ message: t("common.serverError") });
  }
});

// Update user (admin only)
app.put("/api/admin/users/:id", async (req, res) => {
  try {
    const t = getT(req);
    const { id } = req.params;
    const { first_name, last_name, email, password, phone, role, is_verified } =
      req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ message: t("users.not_found") });
    }

    // Prepare update data
    const updateData: any = {};

    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (is_verified !== undefined) updateData.is_verified = is_verified;

    // Handle email change (check for duplicates)
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });
      if (emailExists) {
        return res
          .status(400)
          .json({ message: t("auth.email_already_in_use") });
      }
      updateData.email = email;
    }

    // Handle password change
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({
          message: t("auth.password_min_length"),
        });
      }
      const saltRounds = 12;
      updateData.password_hash = await bcrypt.hash(password, saltRounds);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        role: true,
        is_verified: true,
        created_at: true,
        updated_at: true,
      },
    });

    return res.json({
      message: t("users.updated"),
      user,
    });
  } catch (error) {
    console.error("Update user error:", error);
    const t = getT(req);
    return res.status(500).json({ message: t("common.serverError") });
  }
});

// Get single user (admin only)
app.get("/api/admin/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        role: true,
        is_verified: true,
        created_at: true,
        updated_at: true,
        event_orders: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                start_date: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      const t = getT(req);
      return res.status(404).json({ message: t("users.notFound") });
    }

    return res.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    const t = getT(req);
    return res.status(500).json({ message: t("common.serverError") });
  }
});

// Delete user (admin only)
app.delete("/api/admin/users/:id", async (req, res) => {
  try {
    const t = getT(req);
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      const t = getT(req);
      return res.status(404).json({ message: t("users.notFound") });
    }

    await prisma.user.delete({
      where: { id },
    });

    return res.json({
      message: t("auth.user_deleted"),
    });
  } catch (error) {
    console.error("Delete user error:", error);
    const t = getT(req);
    return res.status(500).json({ message: t("common.serverError") });
  }
});

app.get("/api/admin/stats", async (req, res) => {
  try {
    const [
      totalUsers,
      totalEvents,
      totalEventRequests,
      pendingRequests,
      verifiedUsers,
      recentEvents,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.eventOrder.count(),
      prisma.eventOrder.count({
        where: {
          payment_status: "PENDING",
        },
      }),
      prisma.user.count({
        where: {
          is_verified: true,
        },
      }),
      prisma.event.count({
        where: {
          start_date: {
            gte: new Date(),
          },
        },
      }),
    ]);

    return res.json({
      stats: {
        totalUsers,
        totalEvents,
        totalEventRequests,
        pendingRequests,
        verifiedUsers,
        recentEvents,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    const t = getT(req);
    return res.status(500).json({ message: t("common.serverError") });
  }
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    const t = getT(req);
    res.status(500).json({
      message: t("common.something_went_wrong"),
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : t("common.server_error"),
    });
  }
);

// Department sections endpoint
app.get("/api/department-sections", async (req, res) => {
  try {
    const sections = await prisma.departmentSection.findMany({
      orderBy: { order_index: "asc" },
    });

    // Count departments per section
    const sectionsWithCount = await Promise.all(
      sections.map(async (section: (typeof sections)[0]) => {
        const count = await prisma.department.count({
          where: { section_id: section.id },
        });
        return {
          ...section,
          departments_count: count,
        };
      })
    );

    res.json({ sections: sectionsWithCount });
  } catch (err: any) {
    console.error("Error fetching department sections:", err);
    const t = getT(req);
    res
      .status(500)
      .json({ message: t("departments.failed_to_fetch_sections") });
  }
});

// Departments list (optionally filter by section)
app.get("/api/departments", async (req, res) => {
  try {
    const { sectionId } = req.query as { sectionId?: string };
    const departments = await prisma.department.findMany({
      ...(sectionId ? { where: { section_id: sectionId } } : {}),
      orderBy: { created_at: "desc" },
      include: {
        laboratories: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });
    res.json({ departments });
  } catch (err: any) {
    console.error("Error fetching departments", err);
    const t = getT(req);
    res.status(500).json({ message: t("departments.failed_to_fetch_list") });
  }
});

// Get single department by ID
app.get("/api/departments/:id", async (req, res) => {
  console.log("=== DEPARTMENT API CALLED ===", req.params.id);
  try {
    const { id } = req.params;

    // Get department with related data
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        section: true,
      },
    });

    if (!department) {
      const t = getT(req);
      return res.status(404).json({ message: t("departments.not_found") });
    }

    // Get department staff using Prisma query to ensure proper Json handling
    console.log("Fetching staff for department:", id);
    const departmentStaffRecords = await prisma.departmentStaff.findMany({
      where: { department_id: id },
      include: { staff: true },
    });
    const departmentStaff = departmentStaffRecords.map((ds: any) => ds.staff);
    console.log("Found staff members:", departmentStaff.length);

    // Get services related to this department
    const services = await prisma.service.findMany({
      where: {
        is_published: true,
      },
      include: {
        center_head: true,
      },
      take: 10, // Limit to 10 services
    });

    // Get laboratories related to this department
    console.log("Fetching laboratories for department:", id);
    const laboratories = await (prisma as any).laboratory.findMany({
      where: {
        department_id: id,
        is_active: true,
      },
      orderBy: [{ display_order: "asc" }, { name: "asc" }],
    });
    console.log("Found laboratories:", laboratories.length);

    // Transform staff data with localized values
    const locale = getLocale(req);
    const transformedStaff = (departmentStaff || []).map((staff: any) => ({
      ...staff,
      name: extractLocalizedValue(staff.name, locale) || "",
      title: extractLocalizedValue(staff.title, locale) || "",
      academic_position: extractLocalizedValue(staff.academic_position, locale),
      current_admin_position: extractLocalizedValue(
        staff.current_admin_position,
        locale
      ),
      bio: extractLocalizedValue(staff.bio, locale),
      research_interests: extractLocalizedValue(
        staff.research_interests,
        locale
      ),
    }));

    // Find manager (first staff member with admin position or first staff member)
    const manager =
      transformedStaff.length > 0
        ? transformedStaff.find((staff: any) => staff.current_admin_position) ||
        transformedStaff[0]
        : null;

    // Enhance department data with related information
    console.log(
      "Creating enhanced department with staff count:",
      transformedStaff.length
    );
    const enhancedDepartment = {
      ...department,
      staff: transformedStaff,
      manager: manager
        ? {
          ...manager,
          expertise: manager.research_interests
            ? typeof manager.research_interests === "string"
              ? manager.research_interests
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean)
              : []
            : [],
        }
        : null,
      analysisServices: services.map((service: (typeof services)[0]) => ({
        id: service.id,
        name: service.title,
        description: service.description,
        price: service.price ? parseFloat(service.price.toString()) : null,
        duration: service.duration,
        features: service.features,
      })),
      laboratories: laboratories || [],
      equipment: [], // TODO: Add equipment data when equipment table is implemented
      achievements: [], // TODO: Add achievements data when implemented
      researchAreas: [], // TODO: Add research areas when implemented
      about: department.description,
    };

    console.log(
      "Returning enhanced department:",
      JSON.stringify(enhancedDepartment, null, 2)
    );
    return res.json({ department: enhancedDepartment });
  } catch (err: any) {
    console.error("Error fetching department:", err);
    const t = getT(req);
    return res.status(500).json({ message: t("departments.failed_to_fetch") });
  }
});

// Get single staff member by ID
app.get("/api/staff/:id", async (req, res) => {
  console.log("=== STAFF API CALLED ===", req.params.id);
  try {
    const { id } = req.params;
    const locale = getLocale(req);
    const t = getT(req);

    // Get staff member
    const staff = await prisma.staff.findUnique({
      where: { id },
    });

    if (!staff) {
      return res.status(404).json({ message: t("staff.not_found") });
    }

    // Get departments this staff member is associated with
    const staffDepartments = await prisma.$queryRaw`
      SELECT d.*, s.name as section_name FROM department d
      INNER JOIN department_staff ds ON d.id = ds.department_id
      INNER JOIN department_section s ON d.section_id = s.id
      WHERE ds.staff_id = ${id}
    `;

    console.log("Found departments for staff:", staffDepartments);

    // Parse research interests (now Json)
    let researchInterests: string[] = [];
    if (staff.research_interests) {
      if (typeof staff.research_interests === "string") {
        // Legacy format - comma-separated string
        researchInterests = staff.research_interests
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
      } else if (typeof staff.research_interests === "object") {
        // New Json format - extract localized value
        const interestsStr = extractLocalizedValue(
          staff.research_interests,
          locale
        );
        if (interestsStr) {
          researchInterests = interestsStr
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean);
        }
      }
    }

    // Enhance staff data with localized values
    const enhancedStaff = {
      ...staff,
      name: extractLocalizedValue(staff.name, locale) || "",
      title: extractLocalizedValue(staff.title, locale) || "",
      academic_position: extractLocalizedValue(staff.academic_position, locale),
      current_admin_position: extractLocalizedValue(
        staff.current_admin_position,
        locale
      ),
      ex_admin_position: extractLocalizedValue(staff.ex_admin_position, locale),
      scientific_name: extractLocalizedValue(staff.scientific_name, locale),
      bio: extractLocalizedValue(staff.bio, locale),
      research_interests: extractLocalizedValue(
        staff.research_interests,
        locale
      ),
      news: extractLocalizedValue(staff.news, locale),
      faculty: extractLocalizedValue(staff.faculty, locale),
      department: extractLocalizedValue(staff.department, locale),
      office_location: extractLocalizedValue(staff.office_location, locale),
      office_hours: extractLocalizedValue(staff.office_hours, locale),
      departments: staffDepartments || [],
      expertise: researchInterests,
      socialLinks: {
        email: staff.email,
        alternativeEmail: staff.alternative_email,
        phone: staff.phone,
        mobile: staff.mobile,
        website: staff.website,
        googleScholar: staff.google_scholar,
        researchGate: staff.research_gate,
        academiaEdu: staff.academia_edu,
        linkedin: staff.linkedin,
        facebook: staff.facebook,
        twitter: staff.twitter,
        youtube: staff.youtube,
        instagram: staff.instagram,
        orcid: staff.orcid,
        scopus: staff.scopus,
      },
    };

    console.log(
      "Returning enhanced staff:",
      JSON.stringify(enhancedStaff, null, 2)
    );
    return res.json({ staff: enhancedStaff });
  } catch (err: any) {
    console.error("Error fetching staff:", err);
    const t = getT(req);
    return res.status(500).json({ message: t("staff.failed_to_fetch") });
  }
});

// Admin Departments routes
app.get(
  "/api/admin/departments",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const departments = await prisma.department.findMany({
        include: {
          section: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      });

      // Get staff count for each department
      const departmentsWithStaff = await Promise.all(
        departments.map(async (department: (typeof departments)[0]) => {
          const staffCount = await prisma.departmentStaff.count({
            where: { department_id: department.id },
          });
          return {
            ...department,
            staff_count: staffCount,
          };
        })
      );

      return res.json({
        departments: departmentsWithStaff,
        total: departments.length,
      });
    } catch (error) {
      console.error("Admin departments fetch error:", error);
      const t = getT(req);
      return res.status(500).json({ message: t("common.serverError") });
    }
  }
);

app.get(
  "/api/admin/departments/:id",
  authenticateToken,
  requireAdminOrDepartmentManager,
  async (req, res) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      if (!id) {
        return res.status(400).json({ message: "Department ID is required" });
      }

      // If user is department manager, verify they can only access their own department
      if (user.role === "DEPARTMENT_MANAGER" && user.department_id !== id) {
        return res
          .status(403)
          .json({ message: "You do not have access to this department" });
      }

      const department = await prisma.department.findUnique({
        where: { id },
        include: {
          section: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }

      return res.json({ department });
    } catch (error) {
      console.error("Admin department fetch error:", error);
      const t = getT(req);
      return res.status(500).json({ message: t("common.serverError") });
    }
  }
);

app.post(
  "/api/admin/departments",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { name, description, image, icon, section_id, manager_id } =
        req.body;

      if (!name) {
        return res.status(400).json({ message: "Department name is required" });
      }

      const department = await prisma.department.create({
        data: {
          name,
          description: description || null,
          image: image || null,
          icon: icon || null,
          section_id: section_id || null,
          manager_id: manager_id || null,
        },
        include: {
          section: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      const t = getT(req);
      return res.json({
        message: t("departments.created"),
        department,
      });
    } catch (error: any) {
      console.error("Admin department create error:", error);
      const t = getT(req);
      return res.status(500).json({
        message: t("common.server_error"),
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

app.put(
  "/api/admin/departments/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Department ID is required" });
      }
      const { name, description, image, icon, section_id, manager_id } =
        req.body;

      const existingDepartment = await prisma.department.findUnique({
        where: { id },
      });

      if (!existingDepartment) {
        return res.status(404).json({ message: "Department not found" });
      }

      const department = await prisma.department.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && {
            description: description || null,
          }),
          ...(image !== undefined && { image: image || null }),
          ...(icon !== undefined && { icon: icon || null }),
          ...(section_id !== undefined && { section_id: section_id || null }),
          ...(manager_id !== undefined && { manager_id: manager_id || null }),
        },
        include: {
          section: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      return res.json({
        message: "Department updated successfully",
        department,
      });
    } catch (error: any) {
      console.error("Admin department update error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

app.delete(
  "/api/admin/departments/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Department ID is required" });
      }

      const existingDepartment = await prisma.department.findUnique({
        where: { id },
      });

      if (!existingDepartment) {
        return res.status(404).json({ message: "Department not found" });
      }

      await prisma.department.delete({
        where: { id },
      });

      return res.json({
        message: "Department deleted successfully",
      });
    } catch (error: any) {
      console.error("Admin department delete error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Admin Department Sections routes
app.get(
  "/api/admin/department-sections",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const sections = await prisma.departmentSection.findMany({
        orderBy: {
          order_index: "asc",
        },
      });

      // Count departments per section
      const sectionsWithCount = await Promise.all(
        sections.map(async (section: (typeof sections)[0]) => {
          const count = await prisma.department.count({
            where: { section_id: section.id },
          });
          return {
            ...section,
            departments_count: count,
          };
        })
      );

      return res.json({
        sections: sectionsWithCount,
        total: sections.length,
      });
    } catch (error) {
      console.error("Admin department sections fetch error:", error);
      const t = getT(req);
      return res.status(500).json({ message: t("common.serverError") });
    }
  }
);

app.get(
  "/api/admin/department-sections/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Section ID is required" });
      }

      const section = await prisma.departmentSection.findUnique({
        where: { id },
        include: {
          departments: {
            orderBy: { created_at: "desc" },
          },
        },
      });

      if (!section) {
        return res
          .status(404)
          .json({ message: "Department section not found" });
      }

      return res.json({ section });
    } catch (error) {
      console.error("Admin department section fetch error:", error);
      const t = getT(req);
      return res.status(500).json({ message: t("common.serverError") });
    }
  }
);

app.post(
  "/api/admin/department-sections",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { name, slug, order_index } = req.body;

      if (!name || !slug) {
        return res.status(400).json({ message: "Name and slug are required" });
      }

      // Check for existing slug
      const existingSection = await prisma.departmentSection.findUnique({
        where: { slug },
      });

      if (existingSection) {
        return res
          .status(400)
          .json({ message: "Section with this slug already exists" });
      }

      const section = await prisma.departmentSection.create({
        data: {
          name,
          slug,
          order_index: order_index || 0,
        },
      });

      return res.json({
        message: "Department section created successfully",
        section,
      });
    } catch (error: any) {
      console.error("Admin department section create error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

app.put(
  "/api/admin/department-sections/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Section ID is required" });
      }

      const { name, slug, order_index } = req.body;

      const existingSection = await prisma.departmentSection.findUnique({
        where: { id },
      });

      if (!existingSection) {
        return res
          .status(404)
          .json({ message: "Department section not found" });
      }

      // Check for slug conflicts if slug is being updated
      if (slug && slug !== existingSection.slug) {
        const slugConflict = await prisma.departmentSection.findUnique({
          where: { slug },
        });

        if (slugConflict) {
          return res
            .status(400)
            .json({ message: "Section with this slug already exists" });
        }
      }

      const section = await prisma.departmentSection.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(slug && { slug }),
          ...(order_index !== undefined && { order_index }),
        },
      });

      return res.json({
        message: "Department section updated successfully",
        section,
      });
    } catch (error: any) {
      console.error("Admin department section update error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

app.delete(
  "/api/admin/department-sections/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Section ID is required" });
      }

      const existingSection = await prisma.departmentSection.findUnique({
        where: { id },
      });

      if (!existingSection) {
        return res
          .status(404)
          .json({ message: "Department section not found" });
      }

      // Check if section has departments
      const departmentCount = await prisma.department.count({
        where: { section_id: id },
      });

      if (departmentCount > 0) {
        return res.status(400).json({
          message: `Cannot delete section with ${departmentCount} departments. Move or delete departments first.`,
        });
      }

      await prisma.departmentSection.delete({
        where: { id },
      });

      return res.json({
        message: "Department section deleted successfully",
      });
    } catch (error: any) {
      console.error("Admin department section delete error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Admin Staff routes
app.get(
  "/api/admin/staff",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const staff = await prisma.staff.findMany({
        orderBy: {
          name: "asc",
        },
      });

      return res.json({
        staff,
        total: staff.length,
      });
    } catch (error) {
      console.error("Admin staff fetch error:", error);
      const t = getT(req);
      return res.status(500).json({ message: t("common.serverError") });
    }
  }
);

app.post(
  "/api/admin/staff",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        name,
        title,
        academic_position,
        current_admin_position,
        ex_admin_position,
        scientific_name,
        picture,
        gallery,
        bio,
        research_interests,
        news,
        email,
        alternative_email,
        phone,
        mobile,
        website,
        google_scholar,
        research_gate,
        academia_edu,
        linkedin,
        facebook,
        twitter,
        google_plus,
        youtube,
        wordpress,
        instagram,
        mendeley,
        zotero,
        evernote,
        orcid,
        scopus,
        publications_count,
        papers_count,
        abstracts_count,
        courses_files_count,
        inlinks_count,
        external_links_count,
        faculty,
        department,
        office_location,
        office_hours,
      } = req.body;

      if (!name || !title) {
        return res.status(400).json({ message: "Name and title are required" });
      }

      const staffMember = await prisma.staff.create({
        data: {
          name,
          title,
          academic_position: academic_position || null,
          current_admin_position: current_admin_position || null,
          ex_admin_position: ex_admin_position || null,
          scientific_name: scientific_name || null,
          picture: picture || null,
          gallery: gallery || null,
          bio: bio || null,
          research_interests: research_interests || null,
          news: news || null,
          email: email || null,
          alternative_email: alternative_email || null,
          phone: phone || null,
          mobile: mobile || null,
          website: website || null,
          google_scholar: google_scholar || null,
          research_gate: research_gate || null,
          academia_edu: academia_edu || null,
          linkedin: linkedin || null,
          facebook: facebook || null,
          twitter: twitter || null,
          google_plus: google_plus || null,
          youtube: youtube || null,
          wordpress: wordpress || null,
          instagram: instagram || null,
          mendeley: mendeley || null,
          zotero: zotero || null,
          evernote: evernote || null,
          orcid: orcid || null,
          scopus: scopus || null,
          publications_count: publications_count || 0,
          papers_count: papers_count || 0,
          abstracts_count: abstracts_count || 0,
          courses_files_count: courses_files_count || 0,
          inlinks_count: inlinks_count || 0,
          external_links_count: external_links_count || 0,
          faculty: faculty || null,
          department: department || null,
          office_location: office_location || null,
          office_hours: office_hours || null,
        },
      });

      const t = getT(req);
      return res.json({
        message: t("staff.created"),
        staff: staffMember,
      });
    } catch (error: any) {
      console.error("Admin staff create error:", error);
      const t = getT(req);
      return res.status(500).json({
        message: t("common.server_error"),
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Get single staff member (admin)
app.get(
  "/api/admin/staff/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Staff ID is required" });
      }

      const staff = await prisma.staff.findUnique({
        where: { id },
      });

      if (!staff) {
        return res.status(404).json({ message: "Staff member not found" });
      }

      return res.json({
        staff,
      });
    } catch (error: any) {
      console.error("Admin staff fetch error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

app.put(
  "/api/admin/staff/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        return res.status(400).json({ message: "Staff ID is required" });
      }

      // Check if staff member exists
      const existingStaff = await prisma.staff.findUnique({
        where: { id },
      });

      if (!existingStaff) {
        return res.status(404).json({ message: "Staff member not found" });
      }

      // Update staff member
      const updatedStaff = await prisma.staff.update({
        where: { id },
        data: {
          name: updateData.name || existingStaff.name,
          title: updateData.title || existingStaff.title,
          academic_position:
            updateData.academic_position !== undefined
              ? updateData.academic_position
              : existingStaff.academic_position,
          current_admin_position:
            updateData.current_admin_position !== undefined
              ? updateData.current_admin_position
              : existingStaff.current_admin_position,
          ex_admin_position:
            updateData.ex_admin_position !== undefined
              ? updateData.ex_admin_position
              : existingStaff.ex_admin_position,
          scientific_name:
            updateData.scientific_name !== undefined
              ? updateData.scientific_name
              : existingStaff.scientific_name,
          picture:
            updateData.picture !== undefined
              ? updateData.picture
              : existingStaff.picture,
          bio:
            updateData.bio !== undefined ? updateData.bio : existingStaff.bio,
          research_interests:
            updateData.research_interests !== undefined
              ? updateData.research_interests
              : existingStaff.research_interests,
          news:
            updateData.news !== undefined
              ? updateData.news
              : existingStaff.news,
          email:
            updateData.email !== undefined
              ? updateData.email
              : existingStaff.email,
          alternative_email:
            updateData.alternative_email !== undefined
              ? updateData.alternative_email
              : existingStaff.alternative_email,
          phone:
            updateData.phone !== undefined
              ? updateData.phone
              : existingStaff.phone,
          mobile:
            updateData.mobile !== undefined
              ? updateData.mobile
              : existingStaff.mobile,
          website:
            updateData.website !== undefined
              ? updateData.website
              : existingStaff.website,
          office_location:
            updateData.office_location !== undefined
              ? updateData.office_location
              : existingStaff.office_location,
          office_hours:
            updateData.office_hours !== undefined
              ? updateData.office_hours
              : existingStaff.office_hours,
          faculty:
            updateData.faculty !== undefined
              ? updateData.faculty
              : existingStaff.faculty,
          department:
            updateData.department !== undefined
              ? updateData.department
              : existingStaff.department,
          // Social media and academic links
          google_scholar:
            updateData.google_scholar !== undefined
              ? updateData.google_scholar
              : existingStaff.google_scholar,
          research_gate:
            updateData.research_gate !== undefined
              ? updateData.research_gate
              : existingStaff.research_gate,
          academia_edu:
            updateData.academia_edu !== undefined
              ? updateData.academia_edu
              : existingStaff.academia_edu,
          linkedin:
            updateData.linkedin !== undefined
              ? updateData.linkedin
              : existingStaff.linkedin,
          facebook:
            updateData.facebook !== undefined
              ? updateData.facebook
              : existingStaff.facebook,
          twitter:
            updateData.twitter !== undefined
              ? updateData.twitter
              : existingStaff.twitter,
          google_plus:
            updateData.google_plus !== undefined
              ? updateData.google_plus
              : existingStaff.google_plus,
          youtube:
            updateData.youtube !== undefined
              ? updateData.youtube
              : existingStaff.youtube,
          wordpress:
            updateData.wordpress !== undefined
              ? updateData.wordpress
              : existingStaff.wordpress,
          instagram:
            updateData.instagram !== undefined
              ? updateData.instagram
              : existingStaff.instagram,
          mendeley:
            updateData.mendeley !== undefined
              ? updateData.mendeley
              : existingStaff.mendeley,
          zotero:
            updateData.zotero !== undefined
              ? updateData.zotero
              : existingStaff.zotero,
          evernote:
            updateData.evernote !== undefined
              ? updateData.evernote
              : existingStaff.evernote,
          orcid:
            updateData.orcid !== undefined
              ? updateData.orcid
              : existingStaff.orcid,
          scopus:
            updateData.scopus !== undefined
              ? updateData.scopus
              : existingStaff.scopus,
          // Publication stats
          publications_count:
            updateData.publications_count !== undefined
              ? updateData.publications_count
              : existingStaff.publications_count,
          papers_count:
            updateData.papers_count !== undefined
              ? updateData.papers_count
              : existingStaff.papers_count,
          abstracts_count:
            updateData.abstracts_count !== undefined
              ? updateData.abstracts_count
              : existingStaff.abstracts_count,
          courses_files_count:
            updateData.courses_files_count !== undefined
              ? updateData.courses_files_count
              : existingStaff.courses_files_count,
          inlinks_count:
            updateData.inlinks_count !== undefined
              ? updateData.inlinks_count
              : existingStaff.inlinks_count,
          external_links_count:
            updateData.external_links_count !== undefined
              ? updateData.external_links_count
              : existingStaff.external_links_count,
        },
      });

      return res.json({
        message: "Staff member updated successfully",
        staff: updatedStaff,
      });
    } catch (error: any) {
      console.error("Admin staff update error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

app.delete(
  "/api/admin/staff/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Staff ID is required" });
      }

      // Check if staff member exists
      const existingStaff = await prisma.staff.findUnique({
        where: { id },
      });

      if (!existingStaff) {
        return res.status(404).json({ message: "Staff member not found" });
      }

      // Delete associated department assignments first
      await prisma.departmentStaff.deleteMany({
        where: { staff_id: id },
      });

      // Delete staff member
      await prisma.staff.delete({
        where: { id },
      });

      return res.json({
        message: "Staff member deleted successfully",
      });
    } catch (error: any) {
      console.error("Admin staff delete error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Department Staff Assignment routes
app.get(
  "/api/admin/departments/:id/staff",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Department ID is required" });
      }

      // Get staff assignments for the department
      const departmentStaff = await prisma.departmentStaff.findMany({
        where: { department_id: id },
        orderBy: {
          created_at: "desc",
        },
      });

      // Get staff details for each assignment
      const staffIds = departmentStaff.map(
        (ds: (typeof departmentStaff)[0]) => ds.staff_id
      );
      const staff = await prisma.staff.findMany({
        where: {
          id: { in: staffIds },
        },
        orderBy: {
          name: "asc",
        },
      });

      return res.json({
        staff,
        total: staff.length,
      });
    } catch (error) {
      console.error("Department staff fetch error:", error);
      const t = getT(req);
      return res.status(500).json({ message: t("common.serverError") });
    }
  }
);

app.post(
  "/api/admin/departments/:id/staff",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { staffIds } = req.body;

      if (!id) {
        return res.status(400).json({ message: "Department ID is required" });
      }

      if (!staffIds || !Array.isArray(staffIds)) {
        return res.status(400).json({ message: "Staff IDs array is required" });
      }

      // Check if department exists
      const department = await prisma.department.findUnique({
        where: { id },
      });

      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }

      // Remove existing assignments
      await prisma.departmentStaff.deleteMany({
        where: { department_id: id },
      });

      // Add new assignments
      if (staffIds.length > 0) {
        const assignments = staffIds.map((staffId) => ({
          department_id: id,
          staff_id: staffId,
        }));

        await prisma.departmentStaff.createMany({
          data: assignments,
        });
      }

      return res.json({
        message: "Department staff assignments updated successfully",
      });
    } catch (error: any) {
      console.error("Department staff assignment error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

app.delete(
  "/api/admin/departments/:departmentId/staff/:staffId",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { departmentId, staffId } = req.params;

      if (!departmentId || !staffId) {
        return res
          .status(400)
          .json({ message: "Department ID and Staff ID are required" });
      }

      const assignment = await prisma.departmentStaff.findFirst({
        where: {
          department_id: departmentId,
          staff_id: staffId,
        },
      });

      if (!assignment) {
        return res.status(404).json({ message: "Staff assignment not found" });
      }

      await prisma.departmentStaff.delete({
        where: {
          id: assignment.id,
        },
      });

      return res.json({
        message: "Staff member removed from department successfully",
      });
    } catch (error: any) {
      console.error("Department staff removal error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// ============================================================================
// LABORATORY MANAGEMENT API
// ============================================================================

// Get all laboratories (public)
app.get("/api/laboratories", async (req, res) => {
  try {
    const { departmentId, sectionId } = req.query;

    console.log("Fetching laboratories with params:", {
      departmentId,
      sectionId,
    });

    // Use raw query to bypass Prisma model issues
    let whereClause = "WHERE is_active = 1";
    const params: any[] = [];

    if (departmentId) {
      whereClause += " AND department_id = ?";
      params.push(departmentId);
    }

    if (sectionId) {
      whereClause += " AND section_id = ?";
      params.push(sectionId);
    }

    const laboratories = (await prisma.$queryRawUnsafe(
      `
      SELECT 
        l.*,
        d.name as department_name,
        ds.name as section_name
      FROM laboratory l
      LEFT JOIN department d ON l.department_id = d.id
      LEFT JOIN department_section ds ON l.section_id = ds.id
      ${whereClause}
      ORDER BY l.display_order ASC, l.name ASC
    `,
      ...params
    )) as any[];

    console.log("Found laboratories:", laboratories.length);

    return res.json({ laboratories });
  } catch (error: any) {
    console.error("Get laboratories error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development" ? error?.message : undefined,
    });
  }
});

// Get single laboratory (public)
app.get("/api/laboratories/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const laboratory = (await prisma.$queryRawUnsafe(
      `
      SELECT 
        l.*,
        d.name as department_name,
        d.description as department_description,
        ds.name as section_name
      FROM laboratory l
      LEFT JOIN department d ON l.department_id = d.id
      LEFT JOIN department_section ds ON l.section_id = ds.id
      WHERE l.id = ?
    `,
      id
    )) as any[];

    if (!laboratory || laboratory.length === 0) {
      return res.status(404).json({ message: "Laboratory not found" });
    }

    const lab = laboratory[0];

    // Transform the data to match expected structure
    const transformedLab = {
      ...lab,
      department: lab.department_name
        ? {
          id: lab.department_id,
          name: lab.department_name,
          description: lab.department_description,
        }
        : null,
      section: lab.section_name
        ? {
          id: lab.section_id,
          name: lab.section_name,
        }
        : null,
    };

    return res.json({ laboratory: transformedLab });
  } catch (error: any) {
    console.error("Get laboratory error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development" ? error?.message : undefined,
    });
  }
});

// Admin Laboratory Management
// Get all laboratories (admin)
app.get(
  "/api/admin/laboratories",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { departmentId, sectionId, search } = req.query;

      console.log("Admin fetching laboratories with params:", {
        departmentId,
        sectionId,
        search,
      });

      // Build WHERE clause
      let whereClause = "WHERE 1=1";
      const params: any[] = [];

      if (departmentId) {
        whereClause += " AND l.department_id = ?";
        params.push(departmentId);
      }

      if (sectionId) {
        whereClause += " AND l.section_id = ?";
        params.push(sectionId);
      }

      if (search) {
        whereClause +=
          " AND (l.name LIKE ? OR l.description LIKE ? OR l.head_name LIKE ?)";
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      const laboratories = (await prisma.$queryRawUnsafe(
        `
      SELECT 
        l.*,
        d.name as department_name,
        ds.name as section_name
      FROM laboratory l
      LEFT JOIN department d ON l.department_id = d.id
      LEFT JOIN department_section ds ON l.section_id = ds.id
      ${whereClause}
      ORDER BY l.display_order ASC, l.name ASC
    `,
        ...params
      )) as any[];

      // Transform the data to match the expected structure
      const transformedLabs = laboratories.map((lab) => ({
        ...lab,
        department: lab.department_name
          ? {
            id: lab.department_id,
            name: lab.department_name,
          }
          : null,
        section: lab.section_name
          ? {
            id: lab.section_id,
            name: lab.section_name,
          }
          : null,
      }));

      console.log("Found laboratories:", transformedLabs.length);

      return res.json({ laboratories: transformedLabs });
    } catch (error: any) {
      console.error("Admin get laboratories error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Create laboratory (admin)
app.post(
  "/api/admin/laboratories",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        name,
        description,
        image,
        // Head information
        head_name,
        head_title,
        head_academic_title,
        head_picture,
        head_cv_url,
        head_email,
        head_bio,
        // Contact information
        address,
        phone,
        alternative_phone,
        fax,
        email,
        website,
        // Laboratory details
        established_year,
        facilities,
        equipment_list,
        research_areas,
        services_offered,
        staff_count,
        students_count,
        // Organizational info
        department_id,
        section_id,
        building,
        floor,
        room_numbers,
        // Status
        is_active,
        is_featured,
        display_order,
      } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({ message: "Laboratory name is required" });
      }

      const laboratory = await (prisma as any).laboratory.create({
        data: {
          id: crypto.randomUUID(),
          name,
          description,
          image,
          head_name,
          head_title,
          head_academic_title,
          head_picture,
          head_cv_url,
          head_email,
          head_bio,
          address,
          phone,
          alternative_phone,
          fax,
          email,
          website,
          established_year: established_year
            ? parseInt(established_year)
            : null,
          facilities,
          equipment_list,
          research_areas,
          services_offered,
          staff_count: staff_count ? parseInt(staff_count) : 0,
          students_count: students_count ? parseInt(students_count) : 0,
          department_id,
          section_id,
          building,
          floor,
          room_numbers,
          is_active: is_active !== undefined ? Boolean(is_active) : true,
          is_featured: is_featured !== undefined ? Boolean(is_featured) : false,
          display_order: display_order ? parseInt(display_order) : 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
        include: {
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          section: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return res.status(201).json({
        message: "Laboratory created successfully",
        laboratory,
      });
    } catch (error: any) {
      console.error("Create laboratory error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Update laboratory (admin)
app.put(
  "/api/admin/laboratories/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        image,
        head_name,
        head_title,
        head_academic_title,
        head_picture,
        head_cv_url,
        head_email,
        head_bio,
        address,
        phone,
        alternative_phone,
        fax,
        email,
        website,
        established_year,
        facilities,
        equipment_list,
        research_areas,
        services_offered,
        staff_count,
        students_count,
        department_id,
        section_id,
        building,
        floor,
        room_numbers,
        is_active,
        is_featured,
        display_order,
      } = req.body;

      // Check if laboratory exists
      const existingLab = await (prisma as any).laboratory.findUnique({
        where: { id },
      });

      if (!existingLab) {
        return res.status(404).json({ message: "Laboratory not found" });
      }

      const laboratory = await (prisma as any).laboratory.update({
        where: { id },
        data: {
          name: name || existingLab.name,
          description,
          image,
          head_name,
          head_title,
          head_academic_title,
          head_picture,
          head_cv_url,
          head_email,
          head_bio,
          address,
          phone,
          alternative_phone,
          fax,
          email,
          website,
          established_year: established_year
            ? parseInt(established_year)
            : existingLab.established_year,
          facilities,
          equipment_list,
          research_areas,
          services_offered,
          staff_count: staff_count
            ? parseInt(staff_count)
            : existingLab.staff_count,
          students_count: students_count
            ? parseInt(students_count)
            : existingLab.students_count,
          department_id,
          section_id,
          building,
          floor,
          room_numbers,
          is_active:
            is_active !== undefined
              ? Boolean(is_active)
              : existingLab.is_active,
          is_featured:
            is_featured !== undefined
              ? Boolean(is_featured)
              : existingLab.is_featured,
          display_order: display_order
            ? parseInt(display_order)
            : existingLab.display_order,
          updated_at: new Date(),
        },
        include: {
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          section: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return res.json({
        message: "Laboratory updated successfully",
        laboratory,
      });
    } catch (error: any) {
      console.error("Update laboratory error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Delete laboratory (admin)
app.delete(
  "/api/admin/laboratories/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if laboratory exists
      const laboratory = await (prisma as any).laboratory.findUnique({
        where: { id },
      });

      if (!laboratory) {
        return res.status(404).json({ message: "Laboratory not found" });
      }

      await (prisma as any).laboratory.delete({
        where: { id },
      });

      return res.json({
        message: "Laboratory deleted successfully",
      });
    } catch (error: any) {
      console.error("Delete laboratory error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Public Services API
app.get("/api/services", async (req, res) => {
  try {
    const services = await (prisma as any).service.findMany({
      include: {
        center_head: {
          select: {
            id: true,
            name: true,
            title: true,
            picture: true,
          },
        },
        equipment: {
          select: {
            id: true,
            name: true,
            description: true,
            image: true,
            specifications: true,
          },
        },
        tabs: {
          orderBy: { order_index: "asc" },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // Parse JSON fields
    const servicesWithParsedData = services.map((service: any) => ({
      ...service,
      features:
        typeof service.features === "string"
          ? JSON.parse(service.features)
          : service.features,
      equipment: service.equipment.map((eq: any) => ({
        ...eq,
        specifications:
          typeof eq.specifications === "string"
            ? JSON.parse(eq.specifications)
            : eq.specifications,
      })),
    }));

    res.json({ services: servicesWithParsedData, total: services.length });
  } catch (err: any) {
    console.error("Error fetching services:", err);
    const t = getT(req);
    res.status(500).json({ message: t("services.failed_to_fetch") });
  }
});

// Get single service by ID
app.get("/api/services/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const service = await (prisma as any).service.findUnique({
      where: { id },
      include: {
        center_head: true,
        equipment: true,
        tabs: {
          orderBy: { order_index: "asc" },
        },
      },
    });

    if (!service) {
      const t = getT(req);
      return res.status(404).json({ message: t("services.not_found") });
    }

    // Parse JSON fields
    const serviceWithParsedData = {
      ...service,
      features:
        typeof service.features === "string"
          ? JSON.parse(service.features)
          : service.features,
      equipment: service.equipment.map((eq: any) => ({
        ...eq,
        specifications:
          typeof eq.specifications === "string"
            ? JSON.parse(eq.specifications)
            : eq.specifications,
      })),
      centerHead: service.center_head
        ? {
          ...service.center_head,
          expertise:
            typeof service.center_head.expertise === "string"
              ? JSON.parse(service.center_head.expertise)
              : service.center_head.expertise,
        }
        : null,
    };

    return res.json({ service: serviceWithParsedData });
  } catch (err: any) {
    console.error("Error fetching service:", err);
    return res.status(500).json({ message: "Failed to fetch service" });
  }
});

// Service Center Heads API
app.get("/api/service-center-heads", async (req, res) => {
  try {
    const centerHeads = await prisma.serviceCenterHead.findMany({
      orderBy: { name: "asc" },
    });

    // Parse JSON fields
    const centerHeadsWithParsedData = centerHeads.map(
      (head: (typeof centerHeads)[0]) => ({
        ...head,
        expertise:
          typeof head.expertise === "string"
            ? JSON.parse(head.expertise)
            : head.expertise,
      })
    );

    res.json({
      centerHeads: centerHeadsWithParsedData,
      total: centerHeads.length,
    });
  } catch (err: any) {
    console.error("Error fetching service center heads:", err);
    const t = getT(req);
    res.status(500).json({ message: t("service_center.not_found") });
  }
});

// ==================== PRODUCTS ROUTES ====================

// Get all products (public)
app.get("/api/products", async (req, res) => {
  try {
    const {
      service_center_id,
      category,
      featured,
      published,
      search,
      limit,
      offset,
    } = req.query;

    const locale = getLocale(req);

    const where: any = {};

    if (service_center_id) {
      where.service_center_id = service_center_id as string;
    }

    if (category) {
      where.category = category as string;
    }

    if (featured !== undefined) {
      where.is_featured = featured === "true";
    }

    if (published !== undefined) {
      where.is_published = published === "true";
    } else {
      // Default to only published products for public endpoint
      where.is_published = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
        {
          short_description: {
            contains: search as string,
            mode: "insensitive",
          },
        },
      ];
    }

    const take = limit ? parseInt(limit as string, 10) : undefined;
    const skip = offset ? parseInt(offset as string, 10) : undefined;

    const [products, total] = await Promise.all([
      (prisma as any).product.findMany({
        where,
        include: {
          service_center: {
            select: {
              id: true,
              name: true,
              slug: true,
              type: true,
              image: true,
            },
          },
        },
        orderBy: [{ order_index: "asc" }, { created_at: "desc" }],
        take,
        skip,
      }),
      (prisma as any).product.count({ where }),
    ]);

    // Parse JSON fields and extract localized values
    const productsWithParsedFields = products.map((product: any) => ({
      ...product,
      name: extractLocalizedValue(product.name, locale) || "",
      description: extractLocalizedValue(product.description, locale),
      short_description: extractLocalizedValue(
        product.short_description,
        locale
      ),
      images: product.images
        ? typeof product.images === "string"
          ? JSON.parse(product.images)
          : product.images
        : [],
      tags: product.tags
        ? typeof product.tags === "string"
          ? JSON.parse(product.tags)
          : product.tags
        : [],
      specifications: product.specifications
        ? typeof product.specifications === "string"
          ? JSON.parse(product.specifications)
          : product.specifications
        : null,
      features: product.features
        ? typeof product.features === "string"
          ? JSON.parse(product.features)
          : product.features
        : [],
      sizes: product.sizes
        ? typeof product.sizes === "string"
          ? JSON.parse(product.sizes)
          : product.sizes
        : [],
    }));

    return res.json({
      products: productsWithParsedFields,
      total,
      limit: take,
      offset: skip,
    });
  } catch (error: any) {
    console.error("Products fetch error:", error);
    const t = getT(req);
    return res.status(500).json({ message: t("common.serverError") });
  }
});

// Get single product (public)
app.get("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const locale = getLocale(req);

    const product = await (prisma as any).product.findUnique({
      where: { id },
      include: {
        service_center: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            image: true,
            banner_image: true,
            location: true,
            contact_phone: true,
            contact_email: true,
          },
        },
      },
    });

    if (!product) {
      const t = getT(req);
      return res.status(404).json({ message: t("products.not_found") });
    }

    // Parse JSON fields and extract localized values
    const productWithParsedFields = {
      ...product,
      name: extractLocalizedValue(product.name, locale) || "",
      description: extractLocalizedValue(product.description, locale),
      short_description: extractLocalizedValue(
        product.short_description,
        locale
      ),
      images: product.images
        ? typeof product.images === "string"
          ? JSON.parse(product.images)
          : product.images
        : [],
      tags: product.tags
        ? typeof product.tags === "string"
          ? JSON.parse(product.tags)
          : product.tags
        : [],
      specifications: product.specifications
        ? typeof product.specifications === "string"
          ? JSON.parse(product.specifications)
          : product.specifications
        : null,
      features: product.features
        ? typeof product.features === "string"
          ? JSON.parse(product.features)
          : product.features
        : [],
      sizes: product.sizes
        ? typeof product.sizes === "string"
          ? JSON.parse(product.sizes)
          : product.sizes
        : [],
    };

    return res.json({ product: productWithParsedFields });
  } catch (error: any) {
    console.error("Product fetch error:", error);
    const t = getT(req);
    return res.status(500).json({ message: t("common.serverError") });
  }
});

// Get product by slug (public)
app.get("/api/products/slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const locale = getLocale(req);

    const product = await (prisma as any).product.findUnique({
      where: { slug },
      include: {
        service_center: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            image: true,
            banner_image: true,
            location: true,
            contact_phone: true,
            contact_email: true,
          },
        },
      },
    });

    if (!product) {
      const t = getT(req);
      return res.status(404).json({ message: t("products.not_found") });
    }

    // Parse JSON fields and extract localized values
    const productWithParsedFields = {
      ...product,
      name: extractLocalizedValue(product.name, locale) || "",
      description: extractLocalizedValue(product.description, locale),
      short_description: extractLocalizedValue(
        product.short_description,
        locale
      ),
      images: product.images
        ? typeof product.images === "string"
          ? JSON.parse(product.images)
          : product.images
        : [],
      tags: product.tags
        ? typeof product.tags === "string"
          ? JSON.parse(product.tags)
          : product.tags
        : [],
      specifications: product.specifications
        ? typeof product.specifications === "string"
          ? JSON.parse(product.specifications)
          : product.specifications
        : null,
      features: product.features
        ? typeof product.features === "string"
          ? JSON.parse(product.features)
          : product.features
        : [],
      sizes: product.sizes
        ? typeof product.sizes === "string"
          ? JSON.parse(product.sizes)
          : product.sizes
        : [],
    };

    return res.json({ product: productWithParsedFields });
  } catch (error: any) {
    console.error("Product fetch error:", error);
    const t = getT(req);
    return res.status(500).json({ message: t("common.serverError") });
  }
});

// Public Service Centers API
app.get("/api/service-centers", async (req, res) => {
  try {
    const { featured } = req.query as { featured?: string };
    const centers = await (prisma as any).serviceCenter.findMany({
      where: {
        is_published: true,
        ...(featured !== undefined ? { is_featured: featured === "true" } : {}),
      },
      include: {
        equipments: true,
        products_list: {
          where: {
            is_published: true,
          },
          orderBy: [{ order_index: "asc" }, { created_at: "desc" }],
        },
      },
      orderBy: [{ order_index: "asc" }, { created_at: "desc" }],
    });

    const locale = getLocale(req);
    return res.json({
      centers: centers.map((center: any) =>
        transformServiceCenter(center, locale)
      ),
      total: centers.length,
    });
  } catch (error: any) {
    console.error("Service centers fetch error:", error);
    const t = getT(req);
    return res.status(500).json({ message: t("common.serverError") });
  }
});

// Public ISO Certificates API
app.get("/api/iso-certificates", async (req, res) => {
  try {
    const certificates = await (prisma as any).iSOCertificate.findMany({
      where: {
        is_active: true,
      },
      orderBy: [{ order_index: "asc" }, { created_at: "desc" }],
    });

    return res.json({
      certificates,
      total: certificates.length,
    });
  } catch (error: any) {
    console.error("ISO certificates fetch error:", error);
    const t = getT(req);
    return res.status(500).json({ message: t("common.serverError") });
  }
});

app.get("/api/service-centers/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const { preview } = req.query as { preview?: string };

    if (!slug) {
      return res
        .status(400)
        .json({ message: "Service center slug is required" });
    }

    const center = await (prisma as any).serviceCenter.findUnique({
      where: { slug },
      include: {
        equipments: true,
        products_list: {
          where: {
            is_published: true,
          },
          orderBy: [{ order_index: "asc" }, { created_at: "desc" }],
        },
        staff: {
          include: {
            staff: true,
          },
        },
      },
    });

    if (!center) {
      return res.status(404).json({ message: "Service center not found" });
    }

    // Check if preview mode is enabled (for admin preview)
    if (!center.is_published && preview !== "true") {
      return res.status(404).json({ message: "Service center not found" });
    }

    const locale = getLocale(req);
    return res.json({
      center: transformServiceCenter(center, locale),
    });
  } catch (error: any) {
    console.error("Service center fetch error:", error);
    const t = getT(req);
    return res.status(500).json({ message: t("common.serverError") });
  }
});

// Admin Services API
app.get(
  "/api/admin/services",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const services = await (prisma as any).service.findMany({
        include: {
          center_head: {
            select: {
              id: true,
              name: true,
              title: true,
            },
          },
          tabs: {
            orderBy: { order_index: "asc" },
          },
        },
        orderBy: { created_at: "desc" },
      });

      // Parse JSON fields for admin view
      const servicesWithParsedData = services.map((service: any) => ({
        ...service,
        features:
          typeof service.features === "string"
            ? JSON.parse(service.features)
            : service.features,
        centerHead: service.center_head,
      }));

      res.json({ services: servicesWithParsedData, total: services.length });
    } catch (err: any) {
      console.error("Error fetching admin services:", err);
      const t = getT(req);
      res.status(500).json({ message: t("services.failed_to_fetch") });
    }
  }
);

// ==================== ADMIN PRODUCTS ROUTES ====================

// Get all products (admin - includes unpublished)
app.get(
  "/api/admin/products",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        service_center_id,
        category,
        featured,
        published,
        search,
        limit,
        offset,
      } = req.query;

      const where: any = {};

      if (service_center_id) {
        where.service_center_id = service_center_id as string;
      }

      if (category) {
        where.category = category as string;
      }

      if (featured !== undefined) {
        where.is_featured = featured === "true";
      }

      if (published !== undefined) {
        where.is_published = published === "true";
      }

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: "insensitive" } },
          { description: { contains: search as string, mode: "insensitive" } },
          {
            short_description: {
              contains: search as string,
              mode: "insensitive",
            },
          },
          { sku: { contains: search as string, mode: "insensitive" } },
        ];
      }

      const take = limit ? parseInt(limit as string, 10) : undefined;
      const skip = offset ? parseInt(offset as string, 10) : undefined;

      const [products, total] = await Promise.all([
        (prisma as any).product.findMany({
          where,
          include: {
            service_center: {
              select: {
                id: true,
                name: true,
                slug: true,
                type: true,
                image: true,
              },
            },
          },
          orderBy: [{ order_index: "asc" }, { created_at: "desc" }],
          take,
          skip,
        }),
        (prisma as any).product.count({ where }),
      ]);

      // Parse JSON fields
      const productsWithParsedFields = products.map((product: any) => ({
        ...product,
        images: product.images
          ? typeof product.images === "string"
            ? JSON.parse(product.images)
            : product.images
          : [],
        tags: product.tags
          ? typeof product.tags === "string"
            ? JSON.parse(product.tags)
            : product.tags
          : [],
        specifications: product.specifications
          ? typeof product.specifications === "string"
            ? JSON.parse(product.specifications)
            : product.specifications
          : null,
        features: product.features
          ? typeof product.features === "string"
            ? JSON.parse(product.features)
            : product.features
          : [],
        sizes: product.sizes
          ? typeof product.sizes === "string"
            ? JSON.parse(product.sizes)
            : product.sizes
          : [],
      }));

      return res.json({
        products: productsWithParsedFields,
        total,
        limit: take,
        offset: skip,
      });
    } catch (error: any) {
      console.error("Admin products fetch error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Get single product (admin)
app.get(
  "/api/admin/products/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      const product = await (prisma as any).product.findUnique({
        where: { id },
        include: {
          service_center: {
            select: {
              id: true,
              name: true,
              slug: true,
              type: true,
              image: true,
              banner_image: true,
            },
          },
        },
      });

      if (!product) {
        const t = getT(req);
        return res.status(404).json({ message: t("products.not_found") });
      }

      // Parse JSON fields
      const productWithParsedFields = {
        ...product,
        images: product.images
          ? typeof product.images === "string"
            ? JSON.parse(product.images)
            : product.images
          : [],
        tags: product.tags
          ? typeof product.tags === "string"
            ? JSON.parse(product.tags)
            : product.tags
          : [],
        specifications: product.specifications
          ? typeof product.specifications === "string"
            ? JSON.parse(product.specifications)
            : product.specifications
          : null,
        features: product.features
          ? typeof product.features === "string"
            ? JSON.parse(product.features)
            : product.features
          : [],
        sizes: product.sizes
          ? typeof product.sizes === "string"
            ? JSON.parse(product.sizes)
            : product.sizes
          : [],
      };

      return res.json({ product: productWithParsedFields });
    } catch (error: any) {
      console.error("Admin product fetch error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Create product (admin)
app.post(
  "/api/admin/products",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        name,
        description,
        short_description,
        image,
        images,
        price,
        original_price,
        category,
        tags,
        specifications,
        features,
        sizes,
        stock_quantity,
        sku,
        is_featured,
        is_published,
        is_available,
        order_index,
        service_center_id,
      } = req.body;

      const t = getT(req);
      if (!name) {
        return res.status(400).json({ message: t("products.name_required") });
      }

      // Generate slug from name
      const slug = slugify(name);

      // Check if slug already exists
      const existingProduct = await (prisma as any).product.findUnique({
        where: { slug },
      });

      if (existingProduct) {
        return res
          .status(400)
          .json({ message: t("products.name_already_exists") });
      }

      // Validate service center if provided
      if (service_center_id) {
        const serviceCenter = await (prisma as any).serviceCenter.findUnique({
          where: { id: service_center_id },
        });
        if (!serviceCenter) {
          const t = getT(req);
          return res
            .status(400)
            .json({ message: t("service_center.not_found") });
        }
      }

      const product = await (prisma as any).product.create({
        data: {
          name,
          slug,
          description: description || null,
          short_description: short_description || null,
          image: image || null,
          images: images ? JSON.stringify(images) : null,
          price: price ? parseFloat(price) : null,
          original_price: original_price ? parseFloat(original_price) : null,
          category: category || null,
          tags: tags ? JSON.stringify(tags) : null,
          specifications: specifications
            ? JSON.stringify(specifications)
            : null,
          features: features ? JSON.stringify(features) : null,
          sizes: sizes ? JSON.stringify(sizes) : null,
          stock_quantity:
            stock_quantity !== undefined ? parseInt(stock_quantity, 10) : null,
          sku: sku || null,
          is_featured: is_featured === true || is_featured === "true",
          is_published: is_published !== false && is_published !== "false",
          is_available: is_available !== false && is_available !== "false",
          order_index: order_index ? parseInt(order_index, 10) : 0,
          service_center_id: service_center_id || null,
        },
        include: {
          service_center: {
            select: {
              id: true,
              name: true,
              slug: true,
              type: true,
            },
          },
        },
      });

      // Parse JSON fields for response
      const productWithParsedFields = {
        ...product,
        images: product.images ? JSON.parse(product.images) : [],
        tags: product.tags ? JSON.parse(product.tags) : [],
        specifications: product.specifications
          ? JSON.parse(product.specifications)
          : null,
        features: product.features ? JSON.parse(product.features) : [],
        sizes: product.sizes ? JSON.parse(product.sizes) : [],
      };

      return res.status(201).json({
        message: t("products.created"),
        product: productWithParsedFields,
      });
    } catch (error: any) {
      console.error("Admin product create error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Update product (admin)
app.put(
  "/api/admin/products/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        short_description,
        image,
        images,
        price,
        original_price,
        category,
        tags,
        specifications,
        features,
        sizes,
        stock_quantity,
        sku,
        is_featured,
        is_published,
        is_available,
        order_index,
        service_center_id,
      } = req.body;

      // Check if product exists
      const existingProduct = await (prisma as any).product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        const t = getT(req);
        return res.status(404).json({ message: t("products.not_found") });
      }

      // Generate slug from name if name is being updated
      let slug = existingProduct.slug;
      if (name && name !== existingProduct.name) {
        slug = slugify(name);

        // Check if new slug already exists (excluding current product)
        const slugExists = await (prisma as any).product.findFirst({
          where: {
            slug,
            id: { not: id },
          },
        });

        if (slugExists) {
          const t = getT(req);
          return res
            .status(400)
            .json({ message: t("products.name_already_exists") });
        }
      }

      // Validate service center if provided
      if (service_center_id) {
        const serviceCenter = await (prisma as any).serviceCenter.findUnique({
          where: { id: service_center_id },
        });
        if (!serviceCenter) {
          const t = getT(req);
          return res
            .status(400)
            .json({ message: t("service_center.not_found") });
        }
      }

      const updateData: any = {};

      if (name !== undefined) updateData.name = name;
      if (slug !== existingProduct.slug) updateData.slug = slug;
      if (description !== undefined)
        updateData.description = description || null;
      if (short_description !== undefined)
        updateData.short_description = short_description || null;
      if (image !== undefined) updateData.image = image || null;
      if (images !== undefined)
        updateData.images = images ? JSON.stringify(images) : null;
      if (price !== undefined)
        updateData.price = price ? parseFloat(price) : null;
      if (original_price !== undefined)
        updateData.original_price = original_price
          ? parseFloat(original_price)
          : null;
      if (category !== undefined) updateData.category = category || null;
      if (tags !== undefined)
        updateData.tags = tags ? JSON.stringify(tags) : null;
      if (specifications !== undefined)
        updateData.specifications = specifications
          ? JSON.stringify(specifications)
          : null;
      if (features !== undefined)
        updateData.features = features ? JSON.stringify(features) : null;
      if (sizes !== undefined)
        updateData.sizes = sizes ? JSON.stringify(sizes) : null;
      if (stock_quantity !== undefined)
        updateData.stock_quantity =
          stock_quantity !== null ? parseInt(stock_quantity, 10) : null;
      if (sku !== undefined) updateData.sku = sku || null;
      if (is_featured !== undefined)
        updateData.is_featured = is_featured === true || is_featured === "true";
      if (is_published !== undefined)
        updateData.is_published =
          is_published !== false && is_published !== "false";
      if (is_available !== undefined)
        updateData.is_available =
          is_available !== false && is_available !== "false";
      if (order_index !== undefined)
        updateData.order_index = order_index ? parseInt(order_index, 10) : 0;
      if (service_center_id !== undefined)
        updateData.service_center_id = service_center_id || null;

      const product = await (prisma as any).product.update({
        where: { id },
        data: updateData,
        include: {
          service_center: {
            select: {
              id: true,
              name: true,
              slug: true,
              type: true,
            },
          },
        },
      });

      // Parse JSON fields for response
      const productWithParsedFields = {
        ...product,
        images: product.images ? JSON.parse(product.images) : [],
        tags: product.tags ? JSON.parse(product.tags) : [],
        specifications: product.specifications
          ? JSON.parse(product.specifications)
          : null,
        features: product.features ? JSON.parse(product.features) : [],
        sizes: product.sizes ? JSON.parse(product.sizes) : [],
      };

      const t = getT(req);
      return res.json({
        message: t("products.updated"),
        product: productWithParsedFields,
      });
    } catch (error: any) {
      console.error("Admin product update error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Delete product (admin)
app.delete(
  "/api/admin/products/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if product exists
      const existingProduct = await (prisma as any).product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        const t = getT(req);
        return res.status(404).json({ message: t("products.not_found") });
      }

      await (prisma as any).product.delete({
        where: { id },
      });

      const t = getT(req);
      return res.json({
        message: t("products.deleted"),
      });
    } catch (error: any) {
      console.error("Admin product delete error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Get single service for admin
app.get("/api/admin/services/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const service = await (prisma as any).service.findUnique({
      where: { id },
      include: {
        center_head: true,
        equipment: true,
        tabs: {
          orderBy: { order_index: "asc" },
        },
      },
    });

    if (!service) {
      const t = getT(req);
      return res.status(404).json({ message: t("services.not_found") });
    }

    // Parse JSON fields
    const serviceWithParsedData = {
      ...service,
      features:
        typeof service.features === "string"
          ? JSON.parse(service.features)
          : service.features,
      centerHead: service.center_head,
    };

    return res.json({ service: serviceWithParsedData });
  } catch (err: any) {
    console.error("Error fetching service:", err);
    const t = getT(req);
    return res.status(500).json({ message: t("services.failed_to_fetch") });
  }
});

// Create new service (Admin only)
app.post("/api/admin/services", async (req, res) => {
  try {
    const {
      title,
      subtitle,
      description,
      image,
      category,
      icon,
      features,
      center_head_id,
      duration,
      price,
      is_free,
      is_featured,
      is_published,
      group_name,
      group_order,
      tabs,
    } = req.body;

    const t = getT(req);
    if (!title || !description) {
      return res
        .status(400)
        .json({ message: t("services.title_description_required") });
    }

    const service = await (prisma as any).service.create({
      data: {
        title,
        subtitle: subtitle || null,
        description,
        image: image || null,
        category: category || "General",
        icon: icon || null,
        features: features || "[]",
        center_head_id: center_head_id || null,
        duration: duration || null,
        price: price || 0,
        is_free: is_free || false,
        is_featured: is_featured || false,
        is_published: is_published !== undefined ? is_published : true,
        group_name: group_name || null,
        group_order: group_order || 0,
      },
      include: {
        center_head: {
          select: {
            id: true,
            name: true,
            title: true,
          },
        },
      },
    });

    // Create tabs if provided
    if (tabs && Array.isArray(tabs) && tabs.length > 0) {
      await (prisma as any).serviceTab.createMany({
        data: tabs.map((tab: any) => ({
          serviceId: service.id,
          title: tab.title,
          content: tab.content,
          order_index: tab.order_index || 0,
        })),
      });
    }

    // Fetch service with tabs
    const serviceWithTabs = await (prisma as any).service.findUnique({
      where: { id: service.id },
      include: {
        center_head: {
          select: {
            id: true,
            name: true,
            title: true,
          },
        },
        tabs: {
          orderBy: { order_index: "asc" },
        },
      },
    });

    return res.status(201).json({
      service: {
        ...serviceWithTabs,
        features:
          typeof serviceWithTabs?.features === "string"
            ? JSON.parse(serviceWithTabs.features)
            : serviceWithTabs?.features,
        centerHead: serviceWithTabs?.center_head,
      },
      message: t("services.created"),
    });
  } catch (err: any) {
    console.error("Error creating service:", err);
    const t = getT(req);
    return res.status(500).json({ message: t("services.failed_to_create") });
  }
});

// Update service (Admin only)
app.put("/api/admin/services/:id", async (req, res) => {
  try {
    const t = getT(req);
    const { id } = req.params;
    const {
      title,
      subtitle,
      description,
      image,
      category,
      icon,
      features,
      center_head_id,
      duration,
      price,
      is_free,
      is_featured,
      is_published,
      group_name,
      group_order,
      tabs,
    } = req.body;

    // Update the service
    const service = await (prisma as any).service.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(subtitle !== undefined && { subtitle: subtitle || null }),
        ...(description && { description }),
        ...(image !== undefined && { image: image || null }),
        ...(category && { category }),
        ...(icon !== undefined && { icon: icon || null }),
        ...(features !== undefined && { features }),
        ...(center_head_id !== undefined && {
          center_head_id: center_head_id || null,
        }),
        ...(duration !== undefined && { duration: duration || null }),
        ...(price !== undefined && { price }),
        ...(is_free !== undefined && { is_free }),
        ...(is_featured !== undefined && { is_featured }),
        ...(is_published !== undefined && { is_published }),
        ...(group_name !== undefined && { group_name: group_name || null }),
        ...(group_order !== undefined && { group_order }),
      },
    });

    // Handle tabs update - delete existing tabs and create new ones
    if (tabs !== undefined) {
      // Delete existing tabs
      await (prisma as any).serviceTab.deleteMany({
        where: { serviceId: id },
      });

      // Create new tabs if provided
      if (Array.isArray(tabs) && tabs.length > 0) {
        await (prisma as any).serviceTab.createMany({
          data: tabs.map((tab: any) => ({
            serviceId: id,
            title: tab.title,
            content: tab.content,
            order_index: tab.order_index || 0,
          })),
        });
      }
    }

    // Fetch updated service with all relations
    const updatedService = await (prisma as any).service.findUnique({
      where: { id },
      include: {
        center_head: {
          select: {
            id: true,
            name: true,
            title: true,
          },
        },
        tabs: {
          orderBy: { order_index: "asc" },
        },
      },
    });

    return res.json({
      service: {
        ...updatedService,
        features:
          typeof updatedService?.features === "string"
            ? JSON.parse(updatedService.features)
            : updatedService?.features,
        centerHead: updatedService?.center_head,
      },
      message: t("services.updated"),
    });
  } catch (err: any) {
    console.error("Error updating service:", err);
    const t = getT(req);
    if (err.code === "P2025") {
      return res.status(404).json({ message: t("services.not_found") });
    }
    return res.status(500).json({ message: t("services.failed_to_update") });
  }
});

// Delete service (Admin only)
app.delete("/api/admin/services/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // First delete related equipment
    await prisma.serviceEquipment.deleteMany({
      where: { serviceId: id },
    });

    // Then delete the service
    await prisma.service.delete({
      where: { id },
    });

    const t = getT(req);
    return res.json({ message: t("services.deleted") });
  } catch (err: any) {
    console.error("Error deleting service:", err);
    const t = getT(req);
    if (err.code === "P2025") {
      return res.status(404).json({ message: t("services.not_found") });
    }
    return res.status(500).json({ message: t("services.failed_to_delete") });
  }
});

// ============================================================================
// ADMIN COURSES API ENDPOINTS
// ============================================================================

// Get all courses (admin)
app.get(
  "/api/admin/courses",
  authenticateToken,
  requireAdminOrDepartmentManager,
  async (req, res) => {
    try {
      const { search, category, level, delivery_type } = req.query;
      const locale = getLocale(req);
      const user = (req as any).user;

      console.log("Admin fetching courses with params:", {
        search,
        category,
        level,
        delivery_type,
      });

      // Build where clause
      const where: any = {};

      // If user is department manager, filter by their department
      if (user.role === "DEPARTMENT_MANAGER" && user.department_id) {
        where.department_id = user.department_id;
      }

      if (search) {
        where.OR = [
          { title: { contains: search as string } },
          { description: { contains: search as string } },
          { instructor_name: { contains: search as string } },
        ];
      }

      if (category) {
        where.category = category;
      }

      if (level) {
        where.level = level;
      }

      if (delivery_type) {
        where.delivery_type = delivery_type;
      }

      const courses = await prisma.course.findMany({
        where,
        orderBy: [{ is_featured: "desc" }, { created_at: "desc" }],
        include: {
          lessons: {
            select: {
              id: true,
              title: true,
              duration: true,
              order_index: true,
            },
            orderBy: {
              order_index: "asc",
            },
          },
        },
      });

      // Transform courses data and extract localized values
      const transformedCourses = courses.map((course: (typeof courses)[0]) => ({
        ...course,
        title: extractLocalizedValue(course.title, locale) || "",
        subtitle: extractLocalizedValue(course.subtitle, locale),
        description: extractLocalizedValue(course.description, locale),
        lessons_count: course.lessons.length,
        total_duration: course.lessons.reduce(
          (sum: number, lesson: (typeof course.lessons)[0]) =>
            sum + lesson.duration,
          0
        ),
      }));

      console.log(`Found ${transformedCourses.length} courses`);

      return res.json({
        courses: transformedCourses,
        total: transformedCourses.length,
      });
    } catch (error: any) {
      console.error("Admin get courses error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Get single course (admin)
app.get(
  "/api/admin/courses/:id",
  authenticateToken,
  requireAdminOrDepartmentManager,
  async (req, res) => {
    try {
      const { id } = req.params;
      const locale = getLocale(req);
      const user = (req as any).user;

      if (!id) {
        return res.status(400).json({ message: "Course ID is required" });
      }

      const course = await prisma.course.findUnique({
        where: { id },
        include: {
          lessons: {
            orderBy: {
              order_index: "asc",
            },
          },
        },
      });

      if (!course) {
        const t = getT(req);
        return res.status(404).json({ message: t("courses.not_found") });
      }

      // Parse JSON fields and extract localized values
      const transformedCourse = {
        ...course,
        title: extractLocalizedValue(course.title, locale) || "",
        subtitle: extractLocalizedValue(course.subtitle, locale),
        description: extractLocalizedValue(course.description, locale),
        objectives: course.objectives
          ? typeof course.objectives === "string"
            ? JSON.parse(course.objectives)
            : course.objectives
          : [],
        requirements: course.requirements
          ? typeof course.requirements === "string"
            ? JSON.parse(course.requirements)
            : course.requirements
          : [],
      };

      return res.json({ course: transformedCourse });
    } catch (error: any) {
      console.error("Admin get course error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Create course (admin)
app.post(
  "/api/admin/courses",
  authenticateToken,
  requireAdminOrDepartmentManager,
  async (req, res) => {
    try {
      const {
        title,
        subtitle,
        description,
        image,
        instructor_name,
        category,
        price,
        is_free,
        duration_hours,
        duration_weeks,
        level,
        language,
        max_students,
        is_published,
        is_featured,
        delivery_type,
        meeting_location,
        room_number,
        building,
        address,
        zoom_link,
        meeting_id,
        meeting_passcode,
        platform,
        start_date,
        end_date,
        schedule_info,
        time_zone,
        objectives,
        requirements,
      } = req.body;
      const user = (req as any).user;

      if (!title || !category || !level || !delivery_type) {
        return res.status(400).json({
          message: "Title, category, level, and delivery type are required",
        });
      }

      // Prepare course data with proper typing
      const courseData: any = {
        title,
        subtitle: subtitle || null,
        description: description || null,
        image: image || null,
        instructor_name: instructor_name || null,
        instructor_id: user.id, // Set instructor to current user
        category,
        price: parseFloat(price) || 0,
        is_free: is_free || false,
        duration_hours: parseInt(duration_hours) || 0,
        duration_weeks: parseInt(duration_weeks) || 0,
        level,
        language: language || "English",
        max_students: parseInt(max_students) || 50,
        is_published: is_published || false,
        is_featured: is_featured || false,
        delivery_type,
        meeting_location: meeting_location || null,
        room_number: room_number || null,
        building: building || null,
        address: address || null,
        zoom_link: zoom_link || null,
        meeting_id: meeting_id || null,
        meeting_passcode: meeting_passcode || null,
        platform: platform || null,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        schedule_info: schedule_info || null,
        time_zone: time_zone || "UTC",
        rating_average: 0,
        rating_count: 0,
        enrollment_count: 0,
      };

      // If user is department manager, set department_id
      if (user.role === "DEPARTMENT_MANAGER" && user.department_id) {
        courseData.department_id = user.department_id;
      }

      // Add JSON fields only if they have values
      if (objectives && objectives.length > 0) {
        courseData.objectives = JSON.stringify(objectives);
      }
      if (requirements && requirements.length > 0) {
        courseData.requirements = JSON.stringify(requirements);
      }

      const course = await prisma.course.create({
        data: courseData,
        include: {
          lessons: {
            orderBy: {
              order_index: "asc",
            },
          },
        },
      });

      return res.status(201).json({
        message: "Course created successfully",
        course,
      });
    } catch (error: any) {
      console.error("Admin create course error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Update course (admin)
app.put(
  "/api/admin/courses/:id",
  authenticateToken,
  requireAdminOrDepartmentManager,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const user = (req as any).user;

      if (!id) {
        return res.status(400).json({ message: "Course ID is required" });
      }

      // Check if course exists
      const existingCourse = await prisma.course.findUnique({
        where: { id },
      });

      if (!existingCourse) {
        const t = getT(req);
        return res.status(404).json({ message: t("courses.not_found") });
      }

      // If user is department manager, verify they own this course
      if (
        user.role === "DEPARTMENT_MANAGER" &&
        existingCourse.department_id !== user.department_id
      ) {
        return res
          .status(403)
          .json({ message: "You do not have access to this course" });
      }

      // Prepare update data
      const courseUpdateData: any = {};

      // Only update fields that are provided
      if (updateData.title !== undefined)
        courseUpdateData.title = updateData.title;
      if (updateData.subtitle !== undefined)
        courseUpdateData.subtitle = updateData.subtitle || null;
      if (updateData.description !== undefined)
        courseUpdateData.description = updateData.description || null;
      if (updateData.image !== undefined)
        courseUpdateData.image = updateData.image || null;
      if (updateData.instructor_name !== undefined)
        courseUpdateData.instructor_name = updateData.instructor_name || null;
      if (updateData.category !== undefined)
        courseUpdateData.category = updateData.category;
      if (updateData.price !== undefined)
        courseUpdateData.price = parseFloat(updateData.price) || 0;
      if (updateData.is_free !== undefined)
        courseUpdateData.is_free = updateData.is_free;
      if (updateData.duration_hours !== undefined)
        courseUpdateData.duration_hours =
          parseInt(updateData.duration_hours) || 0;
      if (updateData.duration_weeks !== undefined)
        courseUpdateData.duration_weeks =
          parseInt(updateData.duration_weeks) || 0;
      if (updateData.level !== undefined)
        courseUpdateData.level = updateData.level;
      if (updateData.language !== undefined)
        courseUpdateData.language = updateData.language || "English";
      if (updateData.max_students !== undefined)
        courseUpdateData.max_students = parseInt(updateData.max_students) || 50;
      if (updateData.is_published !== undefined)
        courseUpdateData.is_published = updateData.is_published;
      if (updateData.is_featured !== undefined)
        courseUpdateData.is_featured = updateData.is_featured;
      if (updateData.delivery_type !== undefined)
        courseUpdateData.delivery_type = updateData.delivery_type;
      if (updateData.meeting_location !== undefined)
        courseUpdateData.meeting_location = updateData.meeting_location || null;
      if (updateData.room_number !== undefined)
        courseUpdateData.room_number = updateData.room_number || null;
      if (updateData.building !== undefined)
        courseUpdateData.building = updateData.building || null;
      if (updateData.address !== undefined)
        courseUpdateData.address = updateData.address || null;
      if (updateData.zoom_link !== undefined)
        courseUpdateData.zoom_link = updateData.zoom_link || null;
      if (updateData.meeting_id !== undefined)
        courseUpdateData.meeting_id = updateData.meeting_id || null;
      if (updateData.meeting_passcode !== undefined)
        courseUpdateData.meeting_passcode = updateData.meeting_passcode || null;
      if (updateData.platform !== undefined)
        courseUpdateData.platform = updateData.platform || null;
      if (updateData.start_date !== undefined)
        courseUpdateData.start_date = updateData.start_date
          ? new Date(updateData.start_date)
          : null;
      if (updateData.end_date !== undefined)
        courseUpdateData.end_date = updateData.end_date
          ? new Date(updateData.end_date)
          : null;
      if (updateData.schedule_info !== undefined)
        courseUpdateData.schedule_info = updateData.schedule_info || null;
      if (updateData.time_zone !== undefined)
        courseUpdateData.time_zone = updateData.time_zone || "UTC";
      // Handle JSON fields properly
      if (updateData.objectives !== undefined) {
        if (updateData.objectives && updateData.objectives.length > 0) {
          courseUpdateData.objectives = JSON.stringify(updateData.objectives);
        } else {
          courseUpdateData.objectives = null;
        }
      }
      if (updateData.requirements !== undefined) {
        if (updateData.requirements && updateData.requirements.length > 0) {
          courseUpdateData.requirements = JSON.stringify(
            updateData.requirements
          );
        } else {
          courseUpdateData.requirements = null;
        }
      }

      const course = await prisma.course.update({
        where: { id },
        data: courseUpdateData,
        include: {
          lessons: {
            orderBy: {
              order_index: "asc",
            },
          },
        },
      });

      return res.json({
        message: "Course updated successfully",
        course,
      });
    } catch (error: any) {
      console.error("Admin update course error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Delete course (admin)
app.delete(
  "/api/admin/courses/:id",
  authenticateToken,
  requireAdminOrDepartmentManager,
  async (req, res) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      if (!id) {
        return res.status(400).json({ message: "Course ID is required" });
      }

      // Check if course exists and verify ownership
      const existingCourse = await prisma.course.findUnique({
        where: { id },
      });

      if (!existingCourse) {
        const t = getT(req);
        return res.status(404).json({ message: t("courses.not_found") });
      }

      // If user is department manager, verify they own this course
      if (
        user.role === "DEPARTMENT_MANAGER" &&
        existingCourse.department_id !== user.department_id
      ) {
        return res
          .status(403)
          .json({ message: "You do not have access to this course" });
      }

      // Delete course (lessons will be deleted cascade)
      await prisma.course.delete({
        where: { id },
      });

      return res.json({
        message: "Course deleted successfully",
      });
    } catch (error: any) {
      console.error("Admin delete course error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// ============================================================================
// ADMIN COURSE ORDERS API ENDPOINTS
// ============================================================================

// Get course orders for department (admin or department manager)
app.get(
  "/api/admin/course-orders",
  authenticateToken,
  requireAdminOrDepartmentManager,
  async (req, res) => {
    try {
      const { payment_status, course_id, start_date, end_date } = req.query;
      const user = (req as any).user;

      // Build where clause
      const where: any = {};

      // If user is department manager, filter by their department's courses
      if (user.role === "DEPARTMENT_MANAGER" && user.department_id) {
        // First, get all course IDs for this department
        const departmentCourses = await prisma.course.findMany({
          where: { department_id: user.department_id },
          select: { id: true },
        });
        const courseIds = departmentCourses.map((c: { id: string }) => c.id);
        // Filter orders that have items with these course IDs
        where.items = {
          some: {
            course_id: { in: courseIds }
          }
        };
      }

      if (payment_status) {
        where.payment_status = payment_status;
      }

      if (course_id) {
        // Filter orders that have items with this course ID
        where.items = {
          some: {
            course_id: course_id
          }
        };
      }

      if (start_date || end_date) {
        where.created_at = {};
        if (start_date) {
          where.created_at.gte = new Date(start_date as string);
        }
        if (end_date) {
          where.created_at.lte = new Date(end_date as string);
        }
      }

      const orders = await prisma.courseOrder.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              phone: true,
            },
          },
          items: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  price: true,
                  is_free: true,
                  department_id: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      });

      // Transform orders data to include all courses
      const transformedOrders = orders.map((order: any) => ({
        id: order.id,
        user: order.user,
        courses: order.items.map((item: any) => ({
          id: item.course.id,
          title: item.course.title,
          price: item.price,
          currency: item.currency,
          is_free: item.course.is_free,
        })),
        payment_status: order.payment_status,
        total_amount: order.total_amount,
        currency: order.currency,
        country: order.country,
        payment_method: order.payment_method,
        transaction_id: order.transaction_id,
        receipt_url: order.receipt_url,
        verified_at: order.verified_at,
        notes: order.notes,
        created_at: order.created_at,
        updated_at: order.updated_at,
      }));

      return res.json({
        orders: transformedOrders,
        total: transformedOrders.length,
      });
    } catch (error: any) {
      console.error("Admin get course orders error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Update course order payment status (admin or department manager)
app.put(
  "/api/admin/course-orders/:id",
  authenticateToken,
  requireAdminOrDepartmentManager,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { payment_status, verified_at, notes } = req.body;
      const user = (req as any).user;

      if (!id) {
        return res.status(400).json({ message: "Order ID is required" });
      }

      // Check if order exists
      const existingOrder = await prisma.courseOrder.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              course: {
                select: {
                  department_id: true,
                },
              },
            },
          },
        },
      });

      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // If user is department manager, verify they own at least one course in this order
      if (user.role === "DEPARTMENT_MANAGER" && user.department_id) {
        const hasAccess = existingOrder.items.some(
          (item: any) => item.course.department_id === user.department_id
        );
        if (!hasAccess) {
          return res
            .status(403)
            .json({ message: "You do not have access to this order" });
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (payment_status !== undefined) {
        updateData.payment_status = payment_status;
      }
      if (verified_at !== undefined) {
        updateData.verified_at = verified_at ? new Date(verified_at) : null;
      }
      if (notes !== undefined) {
        updateData.notes = notes;
      }

      const order = await prisma.courseOrder.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              phone: true,
            },
          },
          items: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  price: true,
                  is_free: true,
                },
              },
            },
          },
        },
      });

      return res.json({
        message: "Order updated successfully",
        order,
      });
    } catch (error: any) {
      console.error("Admin update course order error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// ============================================================================
// PUBLIC COURSE ORDERS API ENDPOINTS (Multi-course support)
// ============================================================================

// Create multi-course order (authenticated users)
app.post(
  "/api/course-orders",
  authenticateToken,
  async (req, res) => {
    try {
      const user = (req as any).user;
      const { courses, total_amount, currency, country, payment_method } = req.body;

      if (!courses || !Array.isArray(courses) || courses.length === 0) {
        return res.status(400).json({ message: "At least one course is required" });
      }

      if (!total_amount || total_amount < 0) {
        return res.status(400).json({ message: "Invalid total amount" });
      }

      // Validate currency
      const validCurrency = currency === 'EGP' || currency === 'USD' ? currency : 'USD';

      // Create the order
      const order = await (prisma as any).courseOrder.create({
        data: {
          id: crypto.randomUUID(),
          user_id: user.userId,
          payment_status: payment_method === 'cash_on_attendance' ? 'PENDING' : 'PENDING',
          total_amount: parseFloat(total_amount),
          currency: validCurrency,
          country: country || null,
          payment_method: payment_method || 'online',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // Create order items for each course
      const orderItems = await Promise.all(
        courses.map(async (courseItem: { course_id: string; price: number | string; currency?: string }) => {
          // Verify course exists
          const course = await (prisma as any).course.findUnique({
            where: { id: courseItem.course_id },
          });

          if (!course) {
            throw new Error(`Course ${courseItem.course_id} not found`);
          }

          // Ensure price is a number
          const itemPrice = typeof courseItem.price === 'string'
            ? parseFloat(courseItem.price)
            : courseItem.price;

          return (prisma as any).courseOrderItem.create({
            data: {
              id: crypto.randomUUID(),
              order_id: order.id,
              course_id: courseItem.course_id,
              price: itemPrice,
              currency: courseItem.currency || validCurrency,
              created_at: new Date(),
              updated_at: new Date(),
            },
          });
        })
      );

      // Return order with items
      const orderWithItems = await (prisma as any).courseOrder.findUnique({
        where: { id: order.id },
        include: {
          items: {
            include: {
              course: true,
            },
          },
        },
      });

      return res.status(201).json({
        message: "Order created successfully",
        order: orderWithItems,
      });
    } catch (error: any) {
      console.error("Create course order error:", error);
      const t = getT(req);
      return res.status(500).json({
        message: t("common.serverError"),
        error: process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// ============================================================================
// ADMIN LESSONS API ENDPOINTS
// ============================================================================

// Get lessons for a course (admin)
app.get(
  "/api/admin/courses/:courseId/lessons",
  authenticateToken,
  requireAdminOrDepartmentManager,
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const user = (req as any).user;

      if (!courseId) {
        return res.status(400).json({ message: "Course ID is required" });
      }

      // Check if course exists
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, title: true, department_id: true },
      });

      if (!course) {
        const t = getT(req);
        return res.status(404).json({ message: t("courses.not_found") });
      }

      // If user is department manager, verify they own this course
      if (
        user.role === "DEPARTMENT_MANAGER" &&
        course.department_id !== user.department_id
      ) {
        return res
          .status(403)
          .json({ message: "You do not have access to this course" });
      }

      const lessons = await prisma.lesson.findMany({
        where: { course_id: courseId },
        orderBy: {
          order_index: "asc",
        },
      });

      // Transform lessons data
      const transformedLessons = lessons.map((lesson: (typeof lessons)[0]) => ({
        ...lesson,
        attachments: lesson.attachments
          ? JSON.parse(lesson.attachments as string)
          : [],
        quiz_data: lesson.quiz_data
          ? JSON.parse(lesson.quiz_data as string)
          : null,
      }));

      return res.json({
        lessons: transformedLessons,
        course: {
          id: course.id,
          title: course.title,
        },
      });
    } catch (error: any) {
      console.error("Admin get course lessons error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Create lesson (admin)
app.post(
  "/api/admin/courses/:courseId/lessons",
  authenticateToken,
  requireAdminOrDepartmentManager,
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const user = (req as any).user;

      if (!courseId) {
        return res.status(400).json({ message: "Course ID is required" });
      }
      const {
        title,
        description,
        content,
        video_url,
        video_type,
        video_id,
        duration,
        order_index,
        is_free,
        is_preview,
        attachments,
        quiz_data,
        notes,
      } = req.body;

      // Check if course exists
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        const t = getT(req);
        return res.status(404).json({ message: t("courses.not_found") });
      }

      // If user is department manager, verify they own this course
      if (
        user.role === "DEPARTMENT_MANAGER" &&
        course.department_id !== user.department_id
      ) {
        return res
          .status(403)
          .json({ message: "You do not have access to this course" });
      }

      if (!title) {
        return res.status(400).json({ message: "Lesson title is required" });
      }

      // Prepare lesson data with proper typing
      const lessonData: any = {
        course_id: courseId,
        title,
        description: description || null,
        content: content || null,
        video_url: video_url || null,
        video_type: video_type || "youtube",
        video_id: video_id || null,
        duration: parseInt(duration) || 0,
        order_index: parseInt(order_index) || 0,
        is_free: is_free || false,
        is_preview: is_preview || false,
        notes: notes || null,
      };

      // Add JSON fields only if they have values
      if (attachments && attachments.length > 0) {
        lessonData.attachments = JSON.stringify(attachments);
      }
      if (quiz_data && quiz_data.questions && quiz_data.questions.length > 0) {
        lessonData.quiz_data = JSON.stringify(quiz_data);
      }

      const lesson = await prisma.lesson.create({
        data: lessonData,
      });

      return res.status(201).json({
        message: "Lesson created successfully",
        lesson,
      });
    } catch (error: any) {
      console.error("Admin create lesson error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Update lesson (admin)
app.put(
  "/api/admin/lessons/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        return res.status(400).json({ message: "Lesson ID is required" });
      }

      // Check if lesson exists
      const existingLesson = await prisma.lesson.findUnique({
        where: { id },
      });

      if (!existingLesson) {
        const t = getT(req);
        return res.status(404).json({ message: t("courses.lessonNotFound") });
      }

      // Prepare update data
      const lessonUpdateData: any = {};

      if (updateData.title !== undefined)
        lessonUpdateData.title = updateData.title;
      if (updateData.description !== undefined)
        lessonUpdateData.description = updateData.description || null;
      if (updateData.content !== undefined)
        lessonUpdateData.content = updateData.content || null;
      if (updateData.video_url !== undefined)
        lessonUpdateData.video_url = updateData.video_url || null;
      if (updateData.video_type !== undefined)
        lessonUpdateData.video_type = updateData.video_type || "youtube";
      if (updateData.video_id !== undefined)
        lessonUpdateData.video_id = updateData.video_id || null;
      if (updateData.duration !== undefined)
        lessonUpdateData.duration = parseInt(updateData.duration) || 0;
      if (updateData.order_index !== undefined)
        lessonUpdateData.order_index = parseInt(updateData.order_index) || 0;
      if (updateData.is_free !== undefined)
        lessonUpdateData.is_free = updateData.is_free;
      if (updateData.is_preview !== undefined)
        lessonUpdateData.is_preview = updateData.is_preview;
      // Handle JSON fields properly
      if (updateData.attachments !== undefined) {
        if (updateData.attachments && updateData.attachments.length > 0) {
          lessonUpdateData.attachments = JSON.stringify(updateData.attachments);
        } else {
          lessonUpdateData.attachments = null;
        }
      }
      if (updateData.quiz_data !== undefined) {
        if (
          updateData.quiz_data &&
          updateData.quiz_data.questions &&
          updateData.quiz_data.questions.length > 0
        ) {
          lessonUpdateData.quiz_data = JSON.stringify(updateData.quiz_data);
        } else {
          lessonUpdateData.quiz_data = null;
        }
      }
      if (updateData.notes !== undefined)
        lessonUpdateData.notes = updateData.notes || null;

      const lesson = await prisma.lesson.update({
        where: { id },
        data: lessonUpdateData,
      });

      return res.json({
        message: "Lesson updated successfully",
        lesson,
      });
    } catch (error: any) {
      console.error("Admin update lesson error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Delete lesson (admin)
app.delete(
  "/api/admin/lessons/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Lesson ID is required" });
      }

      // Check if lesson exists
      const existingLesson = await prisma.lesson.findUnique({
        where: { id },
      });

      if (!existingLesson) {
        const t = getT(req);
        return res.status(404).json({ message: t("courses.lessonNotFound") });
      }

      await prisma.lesson.delete({
        where: { id },
      });

      return res.json({
        message: "Lesson deleted successfully",
      });
    } catch (error: any) {
      console.error("Admin delete lesson error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Admin Service Centers routes
app.get(
  "/api/admin/service-centers",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { includeHidden, featured } = req.query as {
        includeHidden?: string;
        featured?: string;
      };

      const centers = await (prisma as any).serviceCenter.findMany({
        where: {
          ...(includeHidden === "true" ? {} : { is_published: true }),
          ...(featured !== undefined
            ? { is_featured: featured === "true" }
            : {}),
        },
        include: {
          equipments: true,
          products_list: {
            orderBy: [{ order_index: "asc" }, { created_at: "desc" }],
          },
        },
        orderBy: [{ order_index: "asc" }, { created_at: "desc" }],
      });

      const locale = getLocale(req);
      return res.json({
        centers: centers.map((center: any) =>
          transformServiceCenter(center, locale)
        ),
        total: centers.length,
      });
    } catch (error: any) {
      console.error("Admin service centers fetch error:", error);
      const t = getT(req);
      return res.status(500).json({ message: t("common.serverError") });
    }
  }
);

app.get(
  "/api/admin/service-centers/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res
          .status(400)
          .json({ message: "Service center ID or slug is required" });
      }

      let center = await (prisma as any).serviceCenter.findUnique({
        where: { id },
        include: {
          equipments: true,
          products_list: {
            orderBy: [{ order_index: "asc" }, { created_at: "desc" }],
          },
          staff: {
            include: {
              staff: true,
            },
          },
        },
      });

      if (!center) {
        center = await (prisma as any).serviceCenter.findUnique({
          where: { slug: id },
          include: {
            equipments: true,
            products_list: {
              orderBy: [{ order_index: "asc" }, { created_at: "desc" }],
            },
            staff: {
              include: {
                staff: true,
              },
            },
          },
        });
      }

      if (!center) {
        return res.status(404).json({ message: "Service center not found" });
      }

      const locale = getLocale(req);
      return res.json({ center: transformServiceCenter(center, locale) });
    } catch (error: any) {
      console.error("Admin service center fetch error:", error);
      const t = getT(req);
      return res.status(500).json({ message: t("common.serverError") });
    }
  }
);

app.post(
  "/api/admin/service-centers",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        name,
        slug: slugInput,
        type,
        headline,
        description,
        image,
        banner_image,
        bannerImage,
        location,
        contact_phone,
        contactPhone,
        contact_email,
        contactEmail,
        lab_methodology,
        labMethodology,
        future_prospective,
        futureProspective,
        is_featured,
        isFeatured,
        is_published,
        isPublished,
        order_index,
        orderIndex,
        equipments,
        products,
        work_volume,
        company_activity,
        services,
        metrics,
      } = req.body;

      if (!name) {
        return res
          .status(400)
          .json({ message: "Service center name is required" });
      }

      const finalSlug = slugify(slugInput || name);

      if (!finalSlug) {
        return res.status(400).json({
          message: "Unable to generate a valid slug for the service center",
        });
      }

      const existingCenter = await (prisma as any).serviceCenter.findUnique({
        where: { slug: finalSlug },
      });

      if (existingCenter) {
        return res
          .status(400)
          .json({ message: "A service center with this slug already exists" });
      }

      const equipmentItems = parseEquipmentItems(equipments);

      const center = await (prisma as any).serviceCenter.create({
        data: {
          name: name
            ? typeof name === "string"
              ? JSON.parse(name)
              : name
            : null,
          slug: finalSlug,
          type: type || "center",
          headline: headline
            ? typeof headline === "string"
              ? JSON.parse(headline)
              : headline
            : null,
          description: description
            ? typeof description === "string"
              ? JSON.parse(description)
              : description
            : null,
          image: image ?? null,
          banner_image: (banner_image ?? bannerImage) || null,
          location: location
            ? typeof location === "string"
              ? JSON.parse(location)
              : location
            : null,
          contact_phone: (contact_phone ?? contactPhone) || null,
          contact_email: (contact_email ?? contactEmail) || null,
          lab_methodology:
            (lab_methodology ?? labMethodology)
              ? typeof (lab_methodology ?? labMethodology) === "string"
                ? JSON.parse(lab_methodology ?? labMethodology)
                : (lab_methodology ?? labMethodology)
              : null,
          future_prospective:
            (future_prospective ?? futureProspective)
              ? typeof (future_prospective ?? futureProspective) === "string"
                ? JSON.parse(future_prospective ?? futureProspective)
                : (future_prospective ?? futureProspective)
              : null,
          products: parseJsonValue(products, [] as any[]),
          work_volume: parseJsonValue(work_volume, null as any),
          company_activity: parseJsonValue(company_activity, null as any),
          services: parseJsonValue(services, [] as any[]),
          metrics: parseJsonValue(metrics, null as any),
          is_featured: parseBoolean(is_featured ?? isFeatured, false),
          is_published: parseBoolean(is_published ?? isPublished, true),
          order_index: parseNumber(order_index ?? orderIndex, 0),
        },
      });

      await syncServiceCenterEquipments(center.id, equipmentItems);

      const centerWithRelations = await (
        prisma as any
      ).serviceCenter.findUnique({
        where: { id: center.id },
        include: {
          equipments: true,
        },
      });

      return res.json({
        message: "Service center created successfully",
        center: centerWithRelations
          ? transformServiceCenter(centerWithRelations, getLocale(req))
          : transformServiceCenter(center, getLocale(req)),
      });
    } catch (error: any) {
      console.error("Admin service center create error:", error);
      if (error?.code === "P2002") {
        return res
          .status(400)
          .json({ message: "A service center with this slug already exists" });
      }
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

app.put(
  "/api/admin/service-centers/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res
          .status(400)
          .json({ message: "Service center ID is required" });
      }

      const existingCenter = await (prisma as any).serviceCenter.findUnique({
        where: { id },
      });

      if (!existingCenter) {
        return res.status(404).json({ message: "Service center not found" });
      }

      const {
        name,
        slug: slugInput,
        type,
        headline,
        description,
        image,
        banner_image,
        bannerImage,
        location,
        contact_phone,
        contactPhone,
        contact_email,
        contactEmail,
        lab_methodology,
        labMethodology,
        future_prospective,
        futureProspective,
        is_featured,
        isFeatured,
        is_published,
        isPublished,
        order_index,
        orderIndex,
        equipments,
        products,
        work_volume,
        company_activity,
        services,
        metrics,
      } = req.body;

      const updateData: Record<string, any> = {};

      if (name !== undefined)
        updateData.name = name
          ? typeof name === "string"
            ? JSON.parse(name)
            : name
          : null;
      if (type !== undefined) updateData.type = type;

      if (slugInput !== undefined) {
        const finalSlug = slugify(slugInput);
        if (!finalSlug) {
          return res.status(400).json({ message: "Invalid slug provided" });
        }

        if (finalSlug !== existingCenter.slug) {
          const slugConflict = await (prisma as any).serviceCenter.findUnique({
            where: { slug: finalSlug },
          });

          if (slugConflict && slugConflict.id !== id) {
            return res.status(400).json({
              message: "Another service center with this slug already exists",
            });
          }
        }

        updateData.slug = finalSlug;
      }

      if (headline !== undefined)
        updateData.headline = headline
          ? typeof headline === "string"
            ? JSON.parse(headline)
            : headline
          : null;
      if (description !== undefined)
        updateData.description = description
          ? typeof description === "string"
            ? JSON.parse(description)
            : description
          : null;
      if (image !== undefined) updateData.image = image ?? null;
      const bannerValue = banner_image ?? bannerImage;
      if (bannerValue !== undefined)
        updateData.banner_image = bannerValue || null;
      if (location !== undefined)
        updateData.location = location
          ? typeof location === "string"
            ? JSON.parse(location)
            : location
          : null;
      const phoneValue = contact_phone ?? contactPhone;
      if (phoneValue !== undefined)
        updateData.contact_phone = phoneValue || null;
      const emailValue = contact_email ?? contactEmail;
      if (emailValue !== undefined)
        updateData.contact_email = emailValue || null;
      const labMethodValue = lab_methodology ?? labMethodology;
      if (labMethodValue !== undefined)
        updateData.lab_methodology = labMethodValue
          ? typeof labMethodValue === "string"
            ? JSON.parse(labMethodValue)
            : labMethodValue
          : null;
      const futureValue = future_prospective ?? futureProspective;
      if (futureValue !== undefined)
        updateData.future_prospective = futureValue
          ? typeof futureValue === "string"
            ? JSON.parse(futureValue)
            : futureValue
          : null;

      const equipmentItems =
        equipments !== undefined ? parseEquipmentItems(equipments) : null;

      if (products !== undefined) {
        updateData.products = parseJsonValue(products, [] as any[]);
      }

      if (work_volume !== undefined) {
        updateData.work_volume = parseJsonValue(work_volume, null as any);
      }

      if (company_activity !== undefined) {
        updateData.company_activity = parseJsonValue(
          company_activity,
          null as any
        );
      }

      if (services !== undefined) {
        updateData.services = parseJsonValue(services, [] as any[]);
      }

      if (metrics !== undefined) {
        updateData.metrics = parseJsonValue(metrics, null as any);
      }

      if (is_featured !== undefined || isFeatured !== undefined) {
        updateData.is_featured = parseBoolean(
          is_featured ?? isFeatured,
          existingCenter.is_featured
        );
      }

      if (is_published !== undefined || isPublished !== undefined) {
        updateData.is_published = parseBoolean(
          is_published ?? isPublished,
          existingCenter.is_published
        );
      }

      if (order_index !== undefined || orderIndex !== undefined) {
        updateData.order_index = parseNumber(
          order_index ?? orderIndex,
          existingCenter.order_index
        );
      }

      const center = await (prisma as any).serviceCenter.update({
        where: { id },
        data: updateData,
      });

      if (equipmentItems !== null) {
        await syncServiceCenterEquipments(center.id, equipmentItems);
      }

      const centerWithRelations = await (
        prisma as any
      ).serviceCenter.findUnique({
        where: { id },
        include: {
          equipments: true,
        },
      });

      return res.json({
        message: "Service center updated successfully",
        center: centerWithRelations
          ? transformServiceCenter(centerWithRelations, getLocale(req))
          : transformServiceCenter(center, getLocale(req)),
      });
    } catch (error: any) {
      console.error("Admin service center update error:", error);
      if (error?.code === "P2002") {
        return res
          .status(400)
          .json({ message: "A service center with this slug already exists" });
      }
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

app.delete(
  "/api/admin/service-centers/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res
          .status(400)
          .json({ message: "Service center ID is required" });
      }

      const existingCenter = await (prisma as any).serviceCenter.findUnique({
        where: { id },
      });

      if (!existingCenter) {
        return res.status(404).json({ message: "Service center not found" });
      }

      await (prisma as any).serviceCenter.delete({
        where: { id },
      });

      return res.json({ message: "Service center deleted successfully" });
    } catch (error: any) {
      console.error("Admin service center delete error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// ==================== Home Page Content Endpoints ====================

// Get all home page content (public)
app.get("/api/home-content", async (req, res) => {
  try {
    const locale = getLocale(req);
    const contents = await prisma.homePageContent.findMany({
      where: { is_active: true },
      orderBy: { order_index: "asc" },
    });

    const transformedContents = contents.map((content: any) => ({
      ...content,
      title: extractLocalizedValue(content.title, locale),
      subtitle: extractLocalizedValue(content.subtitle, locale),
      description: extractLocalizedValue(content.description, locale),
      button_text: extractLocalizedValue(content.button_text, locale),
      content: content.content
        ? typeof content.content === "string"
          ? JSON.parse(content.content)
          : content.content
        : null,
      images: content.images
        ? typeof content.images === "string"
          ? JSON.parse(content.images)
          : content.images
        : [],
      metadata: content.metadata
        ? typeof content.metadata === "string"
          ? JSON.parse(content.metadata)
          : content.metadata
        : null,
    }));

    return res.json({ contents: transformedContents });
  } catch (error: any) {
    console.error("Get home content error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development" ? error?.message : undefined,
    });
  }
});

// Get home page content by section key (public)
app.get("/api/home-content/:sectionKey", async (req, res) => {
  try {
    const { sectionKey } = req.params;
    const locale = getLocale(req);

    const content = await prisma.homePageContent.findUnique({
      where: { section_key: sectionKey },
    });

    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    const transformedContent = {
      ...content,
      title: extractLocalizedValue(content.title, locale),
      subtitle: extractLocalizedValue(content.subtitle, locale),
      description: extractLocalizedValue(content.description, locale),
      button_text: extractLocalizedValue(content.button_text, locale),
      content: content.content
        ? typeof content.content === "string"
          ? JSON.parse(content.content)
          : content.content
        : null,
      images: content.images
        ? typeof content.images === "string"
          ? JSON.parse(content.images)
          : content.images
        : [],
      metadata: content.metadata
        ? typeof content.metadata === "string"
          ? JSON.parse(content.metadata)
          : content.metadata
        : null,
    };

    return res.json({ content: transformedContent });
  } catch (error: any) {
    console.error("Get home content error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development" ? error?.message : undefined,
    });
  }
});

// Get all home page content (admin)
app.get(
  "/api/admin/home-content",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const contents = await prisma.homePageContent.findMany({
        orderBy: { order_index: "asc" },
      });

      return res.json({ contents });
    } catch (error: any) {
      console.error("Admin get home content error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Get single home page content (admin)
app.get(
  "/api/admin/home-content/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Content ID is required" });
      }

      const content = await prisma.homePageContent.findUnique({
        where: { id: id as string },
      });

      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }

      return res.json({ content });
    } catch (error: any) {
      console.error("Admin get home content error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Create or update home page content (admin)
app.post(
  "/api/admin/home-content",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        section_key,
        title,
        subtitle,
        description,
        content,
        images,
        button_text,
        button_link,
        is_active,
        order_index,
        metadata,
      } = req.body;

      if (!section_key) {
        return res.status(400).json({ message: "Section key is required" });
      }

      // Prepare data
      const data: any = {
        section_key,
        title: title
          ? typeof title === "string"
            ? JSON.parse(title)
            : title
          : null,
        subtitle: subtitle
          ? typeof subtitle === "string"
            ? JSON.parse(subtitle)
            : subtitle
          : null,
        description: description
          ? typeof description === "string"
            ? JSON.parse(description)
            : description
          : null,
        content: content
          ? typeof content === "string"
            ? JSON.parse(content)
            : content
          : null,
        images: images
          ? typeof images === "string"
            ? JSON.parse(images)
            : images
          : null,
        button_text: button_text
          ? typeof button_text === "string"
            ? JSON.parse(button_text)
            : button_text
          : null,
        button_link: button_link || null,
        is_active: is_active !== undefined ? is_active : true,
        order_index: order_index || 0,
        metadata: metadata
          ? typeof metadata === "string"
            ? JSON.parse(metadata)
            : metadata
          : null,
      };

      const homeContent = await prisma.homePageContent.upsert({
        where: { section_key },
        update: data,
        create: data,
      });

      return res.json({
        message: "Home page content saved successfully",
        content: homeContent,
      });
    } catch (error: any) {
      console.error("Admin save home content error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Update home page content (admin)
app.put(
  "/api/admin/home-content/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Content ID is required" });
      }

      const updateData: any = {};

      const {
        title,
        subtitle,
        description,
        content,
        images,
        button_text,
        button_link,
        is_active,
        order_index,
        metadata,
      } = req.body;

      if (title !== undefined)
        updateData.title = title
          ? typeof title === "string"
            ? JSON.parse(title)
            : title
          : null;
      if (subtitle !== undefined)
        updateData.subtitle = subtitle
          ? typeof subtitle === "string"
            ? JSON.parse(subtitle)
            : subtitle
          : null;
      if (description !== undefined)
        updateData.description = description
          ? typeof description === "string"
            ? JSON.parse(description)
            : description
          : null;
      if (content !== undefined)
        updateData.content = content
          ? typeof content === "string"
            ? JSON.parse(content)
            : content
          : null;
      if (images !== undefined)
        updateData.images = images
          ? typeof images === "string"
            ? JSON.parse(images)
            : images
          : null;
      if (button_text !== undefined)
        updateData.button_text = button_text
          ? typeof button_text === "string"
            ? JSON.parse(button_text)
            : button_text
          : null;
      if (button_link !== undefined)
        updateData.button_link = button_link || null;
      if (is_active !== undefined) updateData.is_active = is_active;
      if (order_index !== undefined) updateData.order_index = order_index;
      if (metadata !== undefined)
        updateData.metadata = metadata
          ? typeof metadata === "string"
            ? JSON.parse(metadata)
            : metadata
          : null;

      const homeContent = await prisma.homePageContent.update({
        where: { id: id as string },
        data: updateData,
      });

      return res.json({
        message: "Home page content updated successfully",
        content: homeContent,
      });
    } catch (error: any) {
      console.error("Admin update home content error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Delete home page content (admin)
app.delete(
  "/api/admin/home-content/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Content ID is required" });
      }

      await prisma.homePageContent.delete({
        where: { id: id as string },
      });

      return res.json({ message: "Home page content deleted successfully" });
    } catch (error: any) {
      console.error("Admin delete home content error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// ==================== Hero Slider Endpoints ====================

// Get all hero sliders (public)
app.get("/api/hero-sliders", async (req, res) => {
  try {
    const locale = getLocale(req);
    const sliders = await (prisma as any).heroSlider.findMany({
      where: { is_active: true },
      orderBy: { order_index: "asc" },
    });

    const transformedSliders = sliders.map((slider: any) => ({
      ...slider,
      title: extractLocalizedValue(slider.title, locale),
      subtitle: extractLocalizedValue(slider.subtitle, locale),
      description: extractLocalizedValue(slider.description, locale),
      cta: extractLocalizedValue(slider.cta, locale),
      badge: extractLocalizedValue(slider.badge, locale),
      stats: slider.stats
        ? typeof slider.stats === "string"
          ? JSON.parse(slider.stats)
          : slider.stats
        : [],
    }));

    return res.json({ sliders: transformedSliders });
  } catch (error: any) {
    console.error("Get hero sliders error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development" ? error?.message : undefined,
    });
  }
});

// Get all hero sliders (admin)
app.get(
  "/api/admin/hero-sliders",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const sliders = await (prisma as any).heroSlider.findMany({
        orderBy: { order_index: "asc" },
      });

      return res.json({ sliders });
    } catch (error: any) {
      console.error("Admin get hero sliders error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Get single hero slider (admin)
app.get(
  "/api/admin/hero-sliders/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Slider ID is required" });
      }

      const slider = await (prisma as any).heroSlider.findUnique({
        where: { id: id as string },
      });

      if (!slider) {
        return res.status(404).json({ message: "Slider not found" });
      }

      return res.json({ slider });
    } catch (error: any) {
      console.error("Admin get hero slider error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Create hero slider (admin)
app.post(
  "/api/admin/hero-sliders",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        media_type,
        image,
        video,
        title,
        subtitle,
        description,
        cta,
        cta_link,
        badge,
        icon,
        stats,
        is_active,
        order_index,
      } = req.body;

      if (!title || !subtitle || !description || !cta || !cta_link || !badge) {
        return res.status(400).json({ message: "Required fields are missing" });
      }

      const data: any = {
        media_type: media_type || "image",
        image: image || null,
        video: video || null,
        title: typeof title === "string" ? JSON.parse(title) : title,
        subtitle:
          typeof subtitle === "string" ? JSON.parse(subtitle) : subtitle,
        description:
          typeof description === "string"
            ? JSON.parse(description)
            : description,
        cta: typeof cta === "string" ? JSON.parse(cta) : cta,
        cta_link,
        badge: typeof badge === "string" ? JSON.parse(badge) : badge,
        icon: icon || null,
        stats: stats
          ? typeof stats === "string"
            ? JSON.parse(stats)
            : stats
          : null,
        is_active: is_active !== undefined ? is_active : true,
        order_index: order_index || 0,
      };

      const slider = await (prisma as any).heroSlider.create({
        data,
      });

      return res.json({
        message: "Hero slider created successfully",
        slider,
      });
    } catch (error: any) {
      console.error("Admin create hero slider error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Update hero slider (admin)
app.put(
  "/api/admin/hero-sliders/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Slider ID is required" });
      }

      const updateData: any = {};

      const {
        media_type,
        image,
        video,
        title,
        subtitle,
        description,
        cta,
        cta_link,
        badge,
        icon,
        stats,
        is_active,
        order_index,
      } = req.body;

      if (media_type !== undefined) updateData.media_type = media_type;
      if (image !== undefined) updateData.image = image || null;
      if (video !== undefined) updateData.video = video || null;
      if (title !== undefined)
        updateData.title =
          typeof title === "string" ? JSON.parse(title) : title;
      if (subtitle !== undefined)
        updateData.subtitle =
          typeof subtitle === "string" ? JSON.parse(subtitle) : subtitle;
      if (description !== undefined)
        updateData.description =
          typeof description === "string"
            ? JSON.parse(description)
            : description;
      if (cta !== undefined)
        updateData.cta = typeof cta === "string" ? JSON.parse(cta) : cta;
      if (cta_link !== undefined) updateData.cta_link = cta_link;
      if (badge !== undefined)
        updateData.badge =
          typeof badge === "string" ? JSON.parse(badge) : badge;
      if (icon !== undefined) updateData.icon = icon || null;
      if (stats !== undefined)
        updateData.stats = stats
          ? typeof stats === "string"
            ? JSON.parse(stats)
            : stats
          : null;
      if (is_active !== undefined) updateData.is_active = is_active;
      if (order_index !== undefined) updateData.order_index = order_index;

      const slider = await (prisma as any).heroSlider.update({
        where: { id: id as string },
        data: updateData,
      });

      return res.json({
        message: "Hero slider updated successfully",
        slider,
      });
    } catch (error: any) {
      console.error("Admin update hero slider error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Delete hero slider (admin)
app.delete(
  "/api/admin/hero-sliders/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Slider ID is required" });
      }

      await (prisma as any).heroSlider.delete({
        where: { id: id as string },
      });

      return res.json({ message: "Hero slider deleted successfully" });
    } catch (error: any) {
      console.error("Admin delete hero slider error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start server
if (isHttpsEnabled()) {
  // Start HTTPS server
  const httpsServer = createHttpsServer(app, port);

  if (httpsServer) {
    console.log(
      `🚀 Server running on HTTPS port ${process.env.HTTPS_PORT || port}`
    );
    console.log(
      `🌐 Frontend URL: ${process.env.FRONTEND_URL || "https://localhost:3000"}`
    );
  } else {
    // Fallback to HTTP if HTTPS setup fails
    app.listen(port, () => {
      console.log(
        `🚀 Server running on HTTP port ${port} (HTTPS setup failed)`
      );
      console.log(
        `🌐 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`
      );
    });
  }
} else {
  // Start HTTP server (default)

  app.listen(port, () => {
    console.log(`🚀 Server running on HTTP port ${port}`);
    console.log(
      `🌐 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`
    );
  });
}

const networkInterfaces = os.networkInterfaces();

let ip = "localhost"; // fallback

for (const iface of Object.values(networkInterfaces)) {
  if (iface && Array.isArray(iface)) {
    for (const config of iface) {
      if (config.family === "IPv4" && !config.internal) {
        ip = config.address;
      }
    }
  }
}
console.log(
  `🚀 Server running on HTTP port ${port} mahmoud on http://${ip}:${port}`
);
console.log(`🔐 Auth endpoints ready: /api/auth/*`);
console.log(
  `🏢 Department endpoints ready: /api/departments, /api/department-sections`
);
console.log(
  `🔧 Services endpoints ready: /api/services, /api/admin/services, /api/service-center-heads`
);
console.log(
  `🏛️ Service Centers endpoints ready: /api/service-centers, /api/admin/service-centers`
);
console.log(`📦 Products endpoints ready: /api/products, /api/admin/products`);
console.log(
  `🏠 Home Page Content endpoints ready: /api/home-content, /api/admin/home-content`
);

// ==================== Page Content Endpoints (Generic) ====================

// Get page content (public)
app.get("/api/page-content/:pageKey", async (req, res) => {
  try {
    const { pageKey } = req.params;
    const { sectionKey } = req.query;
    const locale = getLocale(req);

    const where: any = { page_key: pageKey, is_active: true };
    if (sectionKey) {
      where.section_key = sectionKey;
    }

    const contents = await (prisma as any).pageContent.findMany({
      where,
      orderBy: { order_index: "asc" },
    });

    const transformedContents = contents.map((content: any) => ({
      ...content,
      title: extractLocalizedValue(content.title, locale),
      subtitle: extractLocalizedValue(content.subtitle, locale),
      description: extractLocalizedValue(content.description, locale),
      button_text: extractLocalizedValue(content.button_text, locale),
      images: content.images
        ? typeof content.images === "string"
          ? JSON.parse(content.images)
          : content.images
        : [],
      content: content.content
        ? typeof content.content === "string"
          ? JSON.parse(content.content)
          : content.content
        : null,
      metadata: content.metadata
        ? typeof content.metadata === "string"
          ? JSON.parse(content.metadata)
          : content.metadata
        : null,
    }));

    return res.json({ contents: transformedContents });
  } catch (error: any) {
    console.error("Get page content error:", error);
    const t = getT(req);
    return res.status(500).json({
      message: t("common.server_error"),
      error:
        process.env.NODE_ENV === "development" ? error?.message : undefined,
    });
  }
});

// Get all page content for a page (admin)
app.get(
  "/api/admin/page-content/:pageKey",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { pageKey } = req.params;
      const contents = await (prisma as any).pageContent.findMany({
        where: { page_key: pageKey },
        orderBy: { order_index: "asc" },
      });

      return res.json({ contents });
    } catch (error: any) {
      console.error("Admin get page content error:", error);
      const t = getT(req);
      return res.status(500).json({
        message: t("common.server_error"),
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Create or update page content (admin)
app.post(
  "/api/admin/page-content",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        page_key,
        section_key = "",
        title,
        subtitle,
        description,
        content,
        images,
        button_text,
        button_link,
        is_active,
        order_index,
        metadata,
      } = req.body;

      if (!page_key) {
        const t = getT(req);
        return res
          .status(400)
          .json({ message: t("validation.page_key_required") });
      }

      // Prepare data
      const data: any = {
        page_key,
        section_key: section_key || "",
        title: title
          ? typeof title === "string"
            ? JSON.parse(title)
            : title
          : null,
        subtitle: subtitle
          ? typeof subtitle === "string"
            ? JSON.parse(subtitle)
            : subtitle
          : null,
        description: description
          ? typeof description === "string"
            ? JSON.parse(description)
            : description
          : null,
        content: content
          ? typeof content === "string"
            ? JSON.parse(content)
            : content
          : null,
        images: images
          ? typeof images === "string"
            ? JSON.parse(images)
            : images
          : null,
        button_text: button_text
          ? typeof button_text === "string"
            ? JSON.parse(button_text)
            : button_text
          : null,
        button_link: button_link || null,
        is_active: is_active !== undefined ? is_active : true,
        order_index: order_index || 0,
        metadata: metadata
          ? typeof metadata === "string"
            ? JSON.parse(metadata)
            : metadata
          : null,
      };

      const pageContent = await (prisma as any).pageContent.upsert({
        where: {
          page_key_section_key: {
            page_key,
            section_key: section_key || "",
          },
        },
        update: data,
        create: data,
      });

      const t = getT(req);
      return res.json({
        message: t("page_content.saved"),
        content: pageContent,
      });
    } catch (error: any) {
      console.error("Admin save page content error:", error);
      const t = getT(req);
      return res.status(500).json({
        message: t("common.server_error"),
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Update page content (admin)
app.put(
  "/api/admin/page-content/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        const t = getT(req);
        return res.status(400).json({ message: t("validation.id_required") });
      }

      const updateData: any = {};

      const {
        title,
        subtitle,
        description,
        content,
        images,
        button_text,
        button_link,
        is_active,
        order_index,
        metadata,
      } = req.body;

      if (title !== undefined)
        updateData.title = title
          ? typeof title === "string"
            ? JSON.parse(title)
            : title
          : null;
      if (subtitle !== undefined)
        updateData.subtitle = subtitle
          ? typeof subtitle === "string"
            ? JSON.parse(subtitle)
            : subtitle
          : null;
      if (description !== undefined)
        updateData.description = description
          ? typeof description === "string"
            ? JSON.parse(description)
            : description
          : null;
      if (content !== undefined)
        updateData.content = content
          ? typeof content === "string"
            ? JSON.parse(content)
            : content
          : null;
      if (images !== undefined)
        updateData.images = images
          ? typeof images === "string"
            ? JSON.parse(images)
            : images
          : null;
      if (button_text !== undefined)
        updateData.button_text = button_text
          ? typeof button_text === "string"
            ? JSON.parse(button_text)
            : button_text
          : null;
      if (button_link !== undefined)
        updateData.button_link = button_link || null;
      if (is_active !== undefined) updateData.is_active = is_active;
      if (order_index !== undefined) updateData.order_index = order_index;
      if (metadata !== undefined)
        updateData.metadata = metadata
          ? typeof metadata === "string"
            ? JSON.parse(metadata)
            : metadata
          : null;

      const pageContent = await (prisma as any).pageContent.update({
        where: { id: id as string },
        data: updateData,
      });

      const t = getT(req);
      return res.json({
        message: t("page_content.updated"),
        content: pageContent,
      });
    } catch (error: any) {
      console.error("Admin update page content error:", error);
      const t = getT(req);
      return res.status(500).json({
        message: t("common.server_error"),
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

// Delete page content (admin)
app.delete(
  "/api/admin/page-content/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        const t = getT(req);
        return res.status(400).json({ message: t("validation.id_required") });
      }

      await (prisma as any).pageContent.delete({
        where: { id: id as string },
      });

      const t = getT(req);
      return res.json({ message: t("page_content.deleted") });
    } catch (error: any) {
      console.error("Admin delete page content error:", error);
      const t = getT(req);
      return res.status(500).json({
        message: t("common.server_error"),
        error:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }
  }
);

console.log(
  `📄 Page Content endpoints ready: /api/page-content/:pageKey, /api/admin/page-content/:pageKey`
);
console.log(
  `🎠 Hero Slider endpoints ready: /api/hero-sliders, /api/admin/hero-sliders`
);

// ============================================
// STAFF ENDPOINTS
// ============================================

// Get department staff (aggregates direct department staff + all laboratory staff)
app.get("/api/departments/:id/staff", async (req, res) => {
  try {
    const { id } = req.params;

    // Get direct department staff
    const departmentStaff = await prisma.departmentStaff.findMany({
      where: { department_id: id },
      include: {
        staff: true,
      },
    });

    // Get all laboratories for this department
    const laboratories = await prisma.laboratory.findMany({
      where: { department_id: id },
      include: {
        laboratoryStaffs: {
          include: {
            staff: true,
          },
        },
      },
    });

    // Create a map to track unique staff and their affiliations
    const staffMap = new Map();

    // Add direct department staff
    departmentStaff.forEach((ds: any) => {
      const staffId = ds.staff.id;
      if (!staffMap.has(staffId)) {
        staffMap.set(staffId, {
          ...ds.staff,
          laboratories: [],
          isDepartmentStaff: true,
        });
      }
    });

    // Add laboratory staff
    laboratories.forEach((lab: any) => {
      lab.laboratoryStaffs.forEach((labStaff: any) => {
        const staffId = labStaff.staff.id;

        if (!staffMap.has(staffId)) {
          staffMap.set(staffId, {
            ...labStaff.staff,
            laboratories: [],
            isDepartmentStaff: false,
          });
        }

        // Add laboratory affiliation
        staffMap.get(staffId).laboratories.push({
          id: lab.id,
          name: lab.name,
          position: labStaff.position,
        });
      });
    });

    const staff = Array.from(staffMap.values());

    res.json({ staff });
  } catch (error: any) {
    console.error("Error fetching department staff:", error);
    res.status(500).json({ message: "Failed to fetch department staff" });
  }
});

// Get laboratory staff
app.get("/api/laboratories/:id/staff", async (req, res) => {
  try {
    const { id } = req.params;

    const laboratoryStaff = await prisma.laboratoryStaff.findMany({
      where: { laboratory_id: id },
      include: {
        staff: true,
      },
    });

    const staff = laboratoryStaff.map((ls: any) => ({
      ...ls.staff,
      labPosition: ls.position,
    }));

    res.json({ staff });
  } catch (error: any) {
    console.error("Error fetching laboratory staff:", error);
    res.status(500).json({ message: "Failed to fetch laboratory staff" });
  }
});

console.log(
  `👥 Staff endpoints ready: /api/departments/:id/staff, /api/laboratories/:id/staff`
);

// Get single laboratory by ID
app.get("/api/laboratories/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const laboratory = await prisma.laboratory.findUnique({
      where: { id },
    });

    if (!laboratory) {
      return res.status(404).json({ message: "Laboratory not found" });
    }

    return res.json({ laboratory });
  } catch (error: any) {
    console.error("Error fetching laboratory:", error);
    return res.status(500).json({ message: "Failed to fetch laboratory" });
  }
});

console.log(`🔬 Laboratory endpoints ready: /api/laboratories/:id`);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down server...");
  await prisma.$disconnect();
  process.exit(0);
});
