import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHttpsServer, isHttpsEnabled } from './https-server';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3002;
const prisma = new PrismaClient();

// Type for Prisma JSON values
type JsonValue = string | number | boolean | null | object | any[];

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const parseJsonValue = <T>(value: JsonValue | null | string | undefined, fallback: T): T => {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === 'string') {
    if (value.trim() === '') {
      return fallback;
    }

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.warn('Failed to parse JSON string field. Returning fallback.', { value, error });
      return fallback;
    }
  }

  return value as T;
};

const normalizeCenterEquipments = (equipments: any): any[] => {
  if (!Array.isArray(equipments)) return [];

  return equipments.map((equipment: any) => ({
    id: equipment.id,
    name: equipment.name,
    details: equipment.description ?? null,
    description: equipment.description ?? null,
    image: equipment.image ?? null,
    specifications: parseJsonValue(equipment.specifications, null as any)
  }));
};

const parseEquipmentItems = (input: any): Array<{
  name: string;
  description: string | null;
  image: string | null;
  specifications: JsonValue | null;
}> => {
  const items = parseJsonValue(input, [] as any[]);
  if (!Array.isArray(items)) return [];

  return items
    .map((item: any) => {
      if (!item || typeof item !== 'object') return null;
      const name = item.name ?? item.title ?? '';
      if (!name) return null;

      return {
        name,
        description: item.details ?? item.description ?? null,
        image: item.image ?? null,
        specifications:
          item.specifications !== undefined
            ? parseJsonValue(item.specifications, null as any)
            : null
      };
    })
    .filter((item): item is {
      name: string;
      description: string | null;
      image: string | null;
      specifications: JsonValue | null;
    } => item !== null);
};

const syncServiceCenterEquipments = async (
  centerId: string,
  equipments: Array<{
    name: string;
    description: string | null;
    image: string | null;
    specifications: JsonValue | null;
  }>
) => {
  await prisma.serviceEquipment.deleteMany({
    where: { service_center_id: centerId } as any
  });

  if (equipments.length === 0) {
    return;
  }

  await prisma.serviceEquipment.createMany({
    data: equipments.map((equipment) => ({
      service_center_id: centerId,
      name: equipment.name,
      description: equipment.description,
      image: equipment.image,
      specifications: equipment.specifications
    })) as any
  });
};

const transformServiceCenter = (center: any) => {
  const { equipments, ...rest } = center;

  return {
    ...rest,
    equipments: normalizeCenterEquipments(equipments),
    products: parseJsonValue(center.products, [] as any[]),
    work_volume: parseJsonValue(center.work_volume, null as any),
    company_activity: parseJsonValue(center.company_activity, null as any),
    services: parseJsonValue(center.services, [] as any[]),
    metrics: parseJsonValue(center.metrics, null as any)
  };
};

const parseBoolean = (value: any, fallback: boolean): boolean => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === '') return fallback;
    return ['true', '1', 'yes', 'y', 'on'].includes(normalized);
  }
  return fallback;
};

const parseNumber = (value: any, fallback: number): number => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// Middleware - CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://134.209.251.89:3000',
  'https://134.209.251.89:3000',
  'http://epri.developteam.site',
  'https://epri.developteam.site',
  'http://epri.developteam.site:3000',
  'https://epri.developteam.site:3000',
  'http://epri.developteam.site:5000',
  'https://epri.developteam.site:5000',
  'http://localhost:3000',
  'http://localhost:3002',
  'https://localhost:3000'
].filter(Boolean) as string[];

app.use(cors({
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
        const isSameDomain = originUrl.hostname === 'epri.developteam.site' || 
                            originUrl.hostname === 'localhost' ||
                            originUrl.hostname === '127.0.0.1';
        
        if (isSameDomain) {
          callback(null, true);
        } else {
          console.warn(`CORS blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      } catch (error) {
        // Invalid URL format
        console.warn(`CORS blocked invalid origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // Get client IP (considering proxies/load balancers)
  const clientIP = req.headers['x-forwarded-for']?.toString().split(',')[0] || 
                   req.headers['x-real-ip']?.toString() || 
                   req.socket.remoteAddress || 
                   'unknown';
  
  // Log request details
  console.log(`\n📥 [${timestamp}] ${req.method} ${req.originalUrl}`);
  console.log(`   IP: ${clientIP}`);
  console.log(`   Origin: ${req.headers.origin || 'none'}`);
  console.log(`   User-Agent: ${req.headers['user-agent'] || 'unknown'}`);
  
  // Log query parameters if present
  if (Object.keys(req.query).length > 0) {
    console.log(`   Query: ${JSON.stringify(req.query)}`);
  }
  
  // Log request body for POST/PUT/PATCH (sanitized to avoid logging sensitive data)
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
    // Create sanitized copy (remove password fields)
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
    if (sanitizedBody.password_hash) sanitizedBody.password_hash = '[REDACTED]';
    if (sanitizedBody.token) sanitizedBody.token = '[REDACTED]';
    
    console.log(`   Body: ${JSON.stringify(sanitizedBody).substring(0, 500)}${JSON.stringify(sanitizedBody).length > 500 ? '...' : ''}`);
  }
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusColor = res.statusCode >= 400 ? '🔴' : res.statusCode >= 300 ? '🟡' : '🟢';
    console.log(`📤 [${new Date().toISOString()}] ${statusColor} ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});

// Basic auth routes
app.post('/api/auth/register', (req, res) => {
  res.json({ message: 'Registration endpoint - not implemented yet' });
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    // Find user
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
      });
    } catch (dbError) {
      console.error('Database error during login:', dbError);
      return res.status(500).json({ message: 'Database connection error' });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password - ensure user has a password_hash
    if (!user.password_hash || user.password_hash.trim() === '') {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    let isValidPassword = false;
    try {
      isValidPassword = await bcrypt.compare(password, user.password_hash);
    } catch (bcryptError) {
      console.error('Bcrypt comparison error:', bcryptError);
      return res.status(500).json({ message: 'Error validating password' });
    }

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is verified (return specific error code for pending accounts)
    if (!user.is_verified) {
      return res.status(403).json({ 
        message: 'Account pending verification. Please wait for administrator approval.',
        code: 'ACCOUNT_PENDING'
      });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    let token;
    try {
      token = jwt.sign(
        { 
          userId: user.id,
          email: user.email,
          role: user.role
        },
        jwtSecret,
        { expiresIn: '7d' }
      );
    } catch (jwtError) {
      console.error('JWT signing error:', jwtError);
      return res.status(500).json({ message: 'Error generating authentication token' });
    }

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_verified: user.is_verified
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);
    console.error('Error stack:', error?.stack);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
});

// Basic events routes
app.get('/api/events', (req, res) => {
  res.json({ 
    events: [],
    message: 'Events endpoint - not implemented yet' 
  });
});

// Department Sections
app.get('/api/department-sections', async (req, res) => {
  try {
    const sections = await prisma.departmentSection.findMany({
      orderBy: { order_index: 'asc' }
    });

    // Count departments per section
    const sectionsWithCounts = await Promise.all(sections.map(async (s: (typeof sections)[0]) => {
      const count = await prisma.department.count({ where: { section_id: s.id } });
      return {
        id: s.id,
        name: s.name,
        slug: s.slug,
        order_index: s.order_index,
        created_at: s.created_at,
        updated_at: s.updated_at,
        departments_count: count
      };
    }));

    res.json({ sections: sectionsWithCounts });
  } catch (err: any) {
    console.error('Error fetching department sections', err);
    console.error('Error stack:', err?.stack);
    res.status(500).json({ 
      message: 'Failed to fetch department sections',
      error: process.env.NODE_ENV === 'development' ? err?.message : undefined
    });
  }
});

// Departments list (optionally filter by section)
app.get('/api/departments', async (req, res) => {
  try {
    const { sectionId } = req.query as { sectionId?: string };
    const departments = await prisma.department.findMany({
      ...(sectionId ? { where: { section_id: sectionId } } : {}),
      orderBy: { created_at: 'desc' }
    });
    res.json({ departments });
  } catch (err: any) {
    console.error('Error fetching departments', err);
    res.status(500).json({ message: 'Failed to fetch departments' });
  }
});

// Get single department by ID
app.get('/api/departments/:id', async (req, res) => {
  console.log('=== DEPARTMENT API CALLED ===', req.params.id);
  try {
    const { id } = req.params;
    
    // Get department with related data
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        section: true
      }
    });
    
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    // Get department staff using raw SQL query
    console.log('Fetching staff for department:', id);
    const departmentStaff = await prisma.$queryRaw`
      SELECT s.* FROM staff s
      INNER JOIN department_staff ds ON s.id = ds.staff_id
      WHERE ds.department_id = ${id}
    `;
    console.log('Found staff members:', departmentStaff);
    
    // Get services related to this department (you might want to adjust this logic)
    const services = await prisma.service.findMany({
      where: {
        // For now, we'll get all published services
        // You can adjust this logic based on your requirements
        is_published: true
      },
      include: {
        center_head: true
      },
      take: 10 // Limit to 10 services
    });
    
    // Find manager (first staff member with admin position or first staff member)
    const manager = Array.isArray(departmentStaff) && departmentStaff.length > 0 
      ? departmentStaff.find((staff: any) => staff.current_admin_position) || departmentStaff[0]
      : null;
    
    // Enhance department data with related information
    console.log('Creating enhanced department with staff count:', Array.isArray(departmentStaff) ? departmentStaff.length : 'not array');
    const enhancedDepartment = {
      ...department,
      staff: departmentStaff || [],
      manager: manager ? {
        ...manager,
        expertise: manager.research_interests ? 
          manager.research_interests.split(',').map((s: string) => s.trim()).filter(Boolean) : []
      } : null,
      analysisServices: services.map((service: (typeof services)[0]) => ({
        id: service.id,
        name: service.title,
        description: service.description,
        price: service.price ? parseFloat(service.price.toString()) : null,
        duration: service.duration,
        features: service.features
      })),
      equipment: [], // TODO: Add equipment data when equipment table is implemented
      achievements: [], // TODO: Add achievements data when implemented
      researchAreas: [], // TODO: Add research areas when implemented
      about: department.description
    };
    
    console.log('Returning enhanced department:', JSON.stringify(enhancedDepartment, null, 2));
    return res.json({ department: enhancedDepartment });
  } catch (err: any) {
    console.error('Error fetching department:', err);
    console.error('Error stack:', err?.stack);
    // Return basic department data if enhancement fails
    const basicDepartment = await prisma.department.findUnique({
      where: { id: req.params.id },
      include: {
        section: true
      }
    });
    if (basicDepartment) {
      console.log('Returning basic department due to error');
      return res.json({ department: basicDepartment });
    }
    return res.status(500).json({ message: 'Failed to fetch department' });
  }
});

// Get single staff member by ID (public)
app.get('/api/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get staff member
    const staff = await prisma.staff.findUnique({
      where: { id }
    });
    
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    
    // Get departments this staff member is associated with
    const staffDepartments = await prisma.$queryRaw`
      SELECT d.*, s.name as section_name FROM department d
      INNER JOIN department_staff ds ON d.id = ds.department_id
      LEFT JOIN department_section s ON d.section_id = s.id
      WHERE ds.staff_id = ${id}
    `;
    
    // Get research interests as array (if stored as comma-separated string)
    const researchInterests = staff.research_interests ? 
      (typeof staff.research_interests === 'string' 
        ? staff.research_interests.split(',').map((s: string) => s.trim()).filter(Boolean)
        : Array.isArray(staff.research_interests) 
          ? staff.research_interests 
          : []) : [];
    
    // Enhance staff data
    const enhancedStaff = {
      ...staff,
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
        scopus: staff.scopus
      }
    };
    
    return res.json({ staff: enhancedStaff });
  } catch (err: any) {
    console.error('Error fetching staff:', err);
    return res.status(500).json({ message: 'Failed to fetch staff' });
  }
});

// Staff list (public)
app.get('/api/staff', async (req, res) => {
  try {
    const staff = await prisma.staff.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return res.json({
      staff,
      total: staff.length
    });
  } catch (error) {
    console.error('Staff fetch error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Service Centers endpoints
app.get('/api/service-centers', async (req, res) => {
  try {
    const { featured } = req.query as { featured?: string };
    const centers = await (prisma as any).serviceCenter.findMany({
      where: {
        is_published: true,
        ...(featured !== undefined ? { is_featured: featured === 'true' } : {})
      },
      include: {
        equipments: true
      },
      orderBy: [
        { order_index: 'asc' },
        { created_at: 'desc' }
      ]
    });

    return res.json({
      centers: centers.map(transformServiceCenter),
      total: centers.length
    });
  } catch (error: any) {
    console.error('Service centers fetch error:', error);
    console.error('Error stack:', error?.stack);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/service-centers/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { preview } = req.query as { preview?: string };

    if (!slug) {
      return res.status(400).json({ message: 'Service center slug is required' });
    }

    const center = await (prisma as any).serviceCenter.findUnique({
      where: { slug },
      include: {
        equipments: true
      }
    });

    if (!center || (!center.is_published && preview !== 'true')) {
      return res.status(404).json({ message: 'Service center not found' });
    }

    return res.json({
      center: transformServiceCenter(center)
    });
  } catch (error: any) {
    console.error('Service center fetch error:', error);
    console.error('Error stack:', error?.stack);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Services endpoints
app.get('/api/services', async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: {
        is_published: true
      },
      include: {
        center_head: true,
        equipment: true,
        tabs: {
          orderBy: {
            order_index: 'asc'
          }
        }
      },
      orderBy: [
        { group_name: 'asc' },
        { group_order: 'asc' },
        { created_at: 'desc' }
      ]
    });

    // Parse features JSON
    const servicesWithParsedFeatures = services.map((service: (typeof services)[0]) => ({
      ...service,
      features: service.features ? JSON.parse(service.features as string) : [],
      centerHead: service.center_head,
      center_head: service.center_head
    }));

    return res.json({
      services: servicesWithParsedFeatures,
      total: services.length
    });
  } catch (error) {
    console.error('Services fetch error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        center_head: true,
        equipment: true,
        tabs: {
          orderBy: {
            order_index: 'asc'
          }
        }
      }
    });

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Parse features JSON and add centerHead for compatibility
    const serviceWithParsedFeatures = {
      ...service,
      features: service.features ? JSON.parse(service.features as string) : [],
      centerHead: service.center_head,
      center_head: service.center_head
    };

    return res.json({ service: serviceWithParsedFeatures });
  } catch (error) {
    console.error('Service fetch error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Service Center Heads endpoint
app.get('/api/service-center-heads', async (req, res) => {
  try {
    const centerHeads = await prisma.serviceCenterHead.findMany({
      orderBy: {
        created_at: 'desc'
      }
    });

    // Parse expertise JSON
    const centerHeadsWithParsedExpertise = centerHeads.map((head: (typeof centerHeads)[0]) => ({
      ...head,
      expertise: head.expertise ? JSON.parse(head.expertise as string) : []
    }));

    return res.json({
      centerHeads: centerHeadsWithParsedExpertise,
      total: centerHeads.length
    });
  } catch (error) {
    console.error('Service center heads fetch error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Test endpoint to verify code updates
app.get('/api/test-department/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('TEST ENDPOINT CALLED:', id);
    
    // Get department staff using raw SQL query
    const departmentStaff = await prisma.$queryRaw`
      SELECT s.* FROM staff s
      INNER JOIN department_staff ds ON s.id = ds.staff_id
      WHERE ds.department_id = ${id}
    `;
    
    console.log('Staff found:', departmentStaff);
    
    return res.json({ 
      message: 'Test endpoint working',
      departmentId: id,
      staffCount: Array.isArray(departmentStaff) ? departmentStaff.length : 0,
      staff: departmentStaff
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return res.status(500).json({ error: 'Test failed' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'EPRI Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// Authentication middleware
const authenticateToken = async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ message: 'Access token required' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, is_verified: true }
    });

    if (!user || !user.is_verified) {
      res.status(401).json({ message: 'Invalid or unverified token' });
      return;
    }

    (req as any).user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Admin-only middleware
const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const user = (req as any).user;
  if (!user || user.role !== 'ADMIN') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }
  next();
};

// Admin routes
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalEvents,
      totalEventRequests,
      pendingRequests,
      verifiedUsers,
      recentEvents
    ] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.eventOrder.count(),
      prisma.eventOrder.count({
        where: {
          payment_status: 'PENDING'
        }
      }),
      prisma.user.count({
        where: {
          is_verified: true
        }
      }),
      prisma.event.count({
        where: {
          start_date: {
            gte: new Date()
          }
        }
      })
    ]);

    return res.json({
      stats: {
        totalUsers,
        totalEvents,
        totalEventRequests,
        pendingRequests,
        verifiedUsers,
        recentEvents
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/admin/events', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        categories: {
          include: {
            category: true
          }
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
                email: true
              }
            }
          }
        },
        tickets: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return res.json({
      events,
      total: events.length
    });
  } catch (error) {
    console.error('Admin events fetch error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
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
        created_at: true,
        event_orders: {
          select: {
            id: true,
            event_id: true,
            event: {
              select: {
                id: true,
                title: true,
                start_date: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return res.json({
      users,
      total: users.length
    });
  } catch (error: any) {
    console.error('Admin users fetch error:', error);
    console.error('Error stack:', error?.stack);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
});

app.get('/api/admin/event-requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const eventRequests = await prisma.eventOrder.findMany({
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            start_date: true,
            end_date: true,
            price: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return res.json({
      requests: eventRequests,
      total: eventRequests.length
    });
  } catch (error) {
    console.error('Admin event requests fetch error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin Departments routes
app.get('/api/admin/departments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        section: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return res.json({
      departments,
      total: departments.length
    });
  } catch (error) {
    console.error('Admin departments fetch error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/admin/departments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Department ID is required' });
    }
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        section: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    return res.json({ department });
  } catch (error) {
    console.error('Admin department fetch error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/admin/departments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, image, icon, section_id, manager_id } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Department name is required' });
    }

    const department = await prisma.department.create({
      data: {
        name,
        description: description || null,
        image: image || null,
        icon: icon || null,
        section_id: section_id || null,
        manager_id: manager_id || null
      },
      include: {
        section: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    return res.json({
      message: 'Department created successfully',
      department
    });
  } catch (error: any) {
    console.error('Admin department create error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
});

app.put('/api/admin/departments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Department ID is required' });
    }
    const { name, description, image, icon, section_id, manager_id } = req.body;

    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { id }
    });

    if (!existingDepartment) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(image !== undefined && { image: image || null }),
        ...(icon !== undefined && { icon: icon || null }),
        ...(section_id !== undefined && { section_id: section_id || null }),
        ...(manager_id !== undefined && { manager_id: manager_id || null })
      },
      include: {
        section: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    return res.json({
      message: 'Department updated successfully',
      department
    });
  } catch (error: any) {
    console.error('Admin department update error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
});

app.delete('/api/admin/departments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Department ID is required' });
    }

    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { id }
    });

    if (!existingDepartment) {
      return res.status(404).json({ message: 'Department not found' });
    }

    await prisma.department.delete({
      where: { id }
    });

    return res.json({
      message: 'Department deleted successfully'
    });
  } catch (error: any) {
    console.error('Admin department delete error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
});

// Admin Staff routes
app.get('/api/admin/staff', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const staff = await prisma.staff.findMany({
      orderBy: {
        created_at: 'desc'
      }
    });

    return res.json({
      staff,
      total: staff.length
    });
  } catch (error) {
    console.error('Admin staff fetch error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/admin/staff', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const staffData = req.body;

    if (!staffData.name || !staffData.title) {
      return res.status(400).json({ message: 'Name and title are required' });
    }

    const staff = await prisma.staff.create({
      data: {
        name: staffData.name,
        title: staffData.title,
        academic_position: staffData.academic_position || null,
        current_admin_position: staffData.current_admin_position || null,
        ex_admin_position: staffData.ex_admin_position || null,
        scientific_name: staffData.scientific_name || null,
        picture: staffData.picture || null,
        gallery: staffData.gallery || null,
        bio: staffData.bio || null,
        research_interests: staffData.research_interests || null,
        news: staffData.news || null,
        email: staffData.email || null,
        alternative_email: staffData.alternative_email || null,
        phone: staffData.phone || null,
        mobile: staffData.mobile || null,
        website: staffData.website || null,
        google_scholar: staffData.google_scholar || null,
        research_gate: staffData.research_gate || null,
        academia_edu: staffData.academia_edu || null,
        linkedin: staffData.linkedin || null,
        facebook: staffData.facebook || null,
        twitter: staffData.twitter || null,
        google_plus: staffData.google_plus || null,
        youtube: staffData.youtube || null,
        wordpress: staffData.wordpress || null,
        instagram: staffData.instagram || null,
        mendeley: staffData.mendeley || null,
        zotero: staffData.zotero || null,
        evernote: staffData.evernote || null,
        orcid: staffData.orcid || null,
        scopus: staffData.scopus || null,
        publications_count: staffData.publications_count || 0,
        papers_count: staffData.papers_count || 0,
        abstracts_count: staffData.abstracts_count || 0,
        courses_files_count: staffData.courses_files_count || 0,
        inlinks_count: staffData.inlinks_count || 0,
        external_links_count: staffData.external_links_count || 0,
        faculty: staffData.faculty || null,
        department: staffData.department || null,
        office_location: staffData.office_location || null,
        office_hours: staffData.office_hours || null
      }
    });

    return res.json({
      message: 'Staff member created successfully',
      staff
    });
  } catch (error: any) {
    console.error('Admin staff create error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
});

// Get single staff member (admin)
app.get('/api/admin/staff/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'Staff ID is required' });
    }

    const staff = await prisma.staff.findUnique({
      where: { id }
    });

    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    return res.json({
      staff
    });
  } catch (error: any) {
    console.error('Admin staff fetch error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
});

// Update staff member (admin)
app.put('/api/admin/staff/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Staff ID is required' });
    }

    // Check if staff member exists
    const existingStaff = await prisma.staff.findUnique({
      where: { id }
    });

    if (!existingStaff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Update staff member
    const updatedStaff = await prisma.staff.update({
      where: { id },
      data: {
        name: updateData.name !== undefined ? updateData.name : existingStaff.name,
        title: updateData.title !== undefined ? updateData.title : existingStaff.title,
        academic_position: updateData.academic_position !== undefined ? updateData.academic_position : existingStaff.academic_position,
        current_admin_position: updateData.current_admin_position !== undefined ? updateData.current_admin_position : existingStaff.current_admin_position,
        ex_admin_position: updateData.ex_admin_position !== undefined ? updateData.ex_admin_position : existingStaff.ex_admin_position,
        scientific_name: updateData.scientific_name !== undefined ? updateData.scientific_name : existingStaff.scientific_name,
        picture: updateData.picture !== undefined ? updateData.picture : existingStaff.picture,
        gallery: updateData.gallery !== undefined ? updateData.gallery : existingStaff.gallery,
        bio: updateData.bio !== undefined ? updateData.bio : existingStaff.bio,
        research_interests: updateData.research_interests !== undefined ? updateData.research_interests : existingStaff.research_interests,
        news: updateData.news !== undefined ? updateData.news : existingStaff.news,
        email: updateData.email !== undefined ? updateData.email : existingStaff.email,
        alternative_email: updateData.alternative_email !== undefined ? updateData.alternative_email : existingStaff.alternative_email,
        phone: updateData.phone !== undefined ? updateData.phone : existingStaff.phone,
        mobile: updateData.mobile !== undefined ? updateData.mobile : existingStaff.mobile,
        website: updateData.website !== undefined ? updateData.website : existingStaff.website,
        google_scholar: updateData.google_scholar !== undefined ? updateData.google_scholar : existingStaff.google_scholar,
        research_gate: updateData.research_gate !== undefined ? updateData.research_gate : existingStaff.research_gate,
        academia_edu: updateData.academia_edu !== undefined ? updateData.academia_edu : existingStaff.academia_edu,
        linkedin: updateData.linkedin !== undefined ? updateData.linkedin : existingStaff.linkedin,
        facebook: updateData.facebook !== undefined ? updateData.facebook : existingStaff.facebook,
        twitter: updateData.twitter !== undefined ? updateData.twitter : existingStaff.twitter,
        google_plus: updateData.google_plus !== undefined ? updateData.google_plus : existingStaff.google_plus,
        youtube: updateData.youtube !== undefined ? updateData.youtube : existingStaff.youtube,
        wordpress: updateData.wordpress !== undefined ? updateData.wordpress : existingStaff.wordpress,
        instagram: updateData.instagram !== undefined ? updateData.instagram : existingStaff.instagram,
        mendeley: updateData.mendeley !== undefined ? updateData.mendeley : existingStaff.mendeley,
        zotero: updateData.zotero !== undefined ? updateData.zotero : existingStaff.zotero,
        evernote: updateData.evernote !== undefined ? updateData.evernote : existingStaff.evernote,
        orcid: updateData.orcid !== undefined ? updateData.orcid : existingStaff.orcid,
        scopus: updateData.scopus !== undefined ? updateData.scopus : existingStaff.scopus,
        publications_count: updateData.publications_count !== undefined ? updateData.publications_count : existingStaff.publications_count,
        papers_count: updateData.papers_count !== undefined ? updateData.papers_count : existingStaff.papers_count,
        abstracts_count: updateData.abstracts_count !== undefined ? updateData.abstracts_count : existingStaff.abstracts_count,
        courses_files_count: updateData.courses_files_count !== undefined ? updateData.courses_files_count : existingStaff.courses_files_count,
        inlinks_count: updateData.inlinks_count !== undefined ? updateData.inlinks_count : existingStaff.inlinks_count,
        external_links_count: updateData.external_links_count !== undefined ? updateData.external_links_count : existingStaff.external_links_count,
        faculty: updateData.faculty !== undefined ? updateData.faculty : existingStaff.faculty,
        department: updateData.department !== undefined ? updateData.department : existingStaff.department,
        office_location: updateData.office_location !== undefined ? updateData.office_location : existingStaff.office_location,
        office_hours: updateData.office_hours !== undefined ? updateData.office_hours : existingStaff.office_hours
      }
    });

    return res.json({
      message: 'Staff member updated successfully',
      staff: updatedStaff
    });
  } catch (error: any) {
    console.error('Admin staff update error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
});

// Delete staff member (admin)
app.delete('/api/admin/staff/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Staff ID is required' });
    }

    // Check if staff member exists
    const existingStaff = await prisma.staff.findUnique({
      where: { id }
    });

    if (!existingStaff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Delete staff member
    await prisma.staff.delete({
      where: { id }
    });

    return res.json({
      message: 'Staff member deleted successfully'
    });
  } catch (error: any) {
    console.error('Admin staff delete error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
});

// Department Staff Assignment routes
app.get('/api/admin/departments/:id/staff', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const departmentStaff = await prisma.$queryRaw`
      SELECT s.* FROM staff s
      INNER JOIN department_staff ds ON s.id = ds.staff_id
      WHERE ds.department_id = ${id}
    `;

    return res.json({
      staff: departmentStaff || [],
      total: Array.isArray(departmentStaff) ? departmentStaff.length : 0
    });
  } catch (error) {
    console.error('Department staff fetch error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/admin/departments/:id/staff', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { staffIds } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Department ID is required' });
    }

    if (!Array.isArray(staffIds) || staffIds.length === 0) {
      return res.status(400).json({ message: 'Staff IDs array is required' });
    }

    // Remove existing assignments
    await prisma.departmentStaff.deleteMany({
      where: { department_id: id }
    });

    // Add new assignments
    const assignments = staffIds.map((staffId: string) => ({
      department_id: id,
      staff_id: staffId
    }));

    await prisma.departmentStaff.createMany({
      data: assignments
    });

    return res.json({
      message: 'Staff assignments updated successfully'
    });
  } catch (error: any) {
    console.error('Department staff assignment error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
});

app.delete('/api/admin/departments/:id/staff/:staffId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id, staffId } = req.params;

    if (!id || !staffId) {
      return res.status(400).json({ message: 'Department ID and Staff ID are required' });
    }

    await prisma.departmentStaff.deleteMany({
      where: {
        department_id: id,
        staff_id: staffId
      }
    });

    return res.json({
      message: 'Staff member removed from department successfully'
    });
  } catch (error) {
    console.error('Department staff removal error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin Services routes
app.get('/api/admin/services', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      include: {
        center_head: true,
        equipment: true,
        tabs: {
          orderBy: {
            order_index: 'asc'
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Parse features JSON
    const servicesWithParsedFeatures = services.map((service: (typeof services)[0]) => ({
      ...service,
      features: service.features ? JSON.parse(service.features as string) : []
    }));

    return res.json({
      services: servicesWithParsedFeatures,
      total: services.length
    });
  } catch (error) {
    console.error('Admin services fetch error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/admin/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'Service ID is required' });
    }
    
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        center_head: true,
        equipment: true,
        tabs: {
          orderBy: {
            order_index: 'asc'
          }
        }
      }
    });

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Parse features JSON
    const serviceWithParsedFeatures = {
      ...service,
      features: service.features ? JSON.parse(service.features as string) : []
    };

    return res.json({ service: serviceWithParsedFeatures });
  } catch (error) {
    console.error('Admin service fetch error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/admin/services', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const serviceData = req.body;

    if (!serviceData.title || !serviceData.description || !serviceData.category) {
      return res.status(400).json({ message: 'Title, description, and category are required' });
    }

    // Create service data object
    const createData: any = {
      title: serviceData.title,
      description: serviceData.description,
      category: serviceData.category,
      price: serviceData.price || 0,
      is_free: serviceData.is_free ?? false,
      is_featured: serviceData.is_featured ?? false,
      is_published: serviceData.is_published ?? true,
      group_order: serviceData.group_order || 0
    };

    // Add optional fields only if they exist
    if (serviceData.subtitle) createData.subtitle = serviceData.subtitle;
    if (serviceData.image) createData.image = serviceData.image;
    if (serviceData.icon) createData.icon = serviceData.icon;
    if (serviceData.features) createData.features = JSON.stringify(serviceData.features);
    if (serviceData.duration) createData.duration = serviceData.duration;
    if (serviceData.center_head_id) createData.center_head_id = serviceData.center_head_id;
    if (serviceData.group_name) createData.group_name = serviceData.group_name;

    // Create service
    const service = await prisma.service.create({
      data: createData,
      include: {
        center_head: true
      }
    });

    // Create tabs if provided
    if (serviceData.tabs && Array.isArray(serviceData.tabs)) {
      await prisma.serviceTab.createMany({
        data: serviceData.tabs.map((tab: any) => ({
          service_id: service.id,
          title: tab.title,
          content: tab.content,
          order_index: tab.order_index || 0
        }))
      });
    }

    return res.json({ service });
  } catch (error: any) {
    console.error('Admin service create error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
});

app.put('/api/admin/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const serviceData = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Service ID is required' });
    }

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id }
    });

    if (!existingService) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Update service
    const updateData: any = {};
    if (serviceData.title !== undefined) updateData.title = serviceData.title;
    if (serviceData.subtitle !== undefined) updateData.subtitle = serviceData.subtitle || null;
    if (serviceData.description !== undefined) updateData.description = serviceData.description;
    if (serviceData.image !== undefined) updateData.image = serviceData.image || null;
    if (serviceData.category !== undefined) updateData.category = serviceData.category;
    if (serviceData.icon !== undefined) updateData.icon = serviceData.icon || null;
    if (serviceData.features !== undefined) updateData.features = serviceData.features ? JSON.stringify(serviceData.features) : undefined;
    if (serviceData.duration !== undefined) updateData.duration = serviceData.duration || null;
    if (serviceData.price !== undefined) updateData.price = serviceData.price || 0;
    if (serviceData.is_free !== undefined) updateData.is_free = serviceData.is_free;
    if (serviceData.is_featured !== undefined) updateData.is_featured = serviceData.is_featured;
    if (serviceData.is_published !== undefined) updateData.is_published = serviceData.is_published;
    if (serviceData.center_head_id !== undefined) updateData.center_head_id = serviceData.center_head_id || null;
    if (serviceData.group_name !== undefined) updateData.group_name = serviceData.group_name || null;
    if (serviceData.group_order !== undefined) updateData.group_order = serviceData.group_order || 0;

    const service = await prisma.service.update({
      where: { id },
      data: updateData,
      include: {
        center_head: true
      }
    });

    // Update tabs if provided
    if (serviceData.tabs && Array.isArray(serviceData.tabs)) {
      // Delete existing tabs
      await prisma.serviceTab.deleteMany({
        where: { service_id: id }
      });

      // Create new tabs
      if (serviceData.tabs.length > 0) {
        await prisma.serviceTab.createMany({
          data: serviceData.tabs.map((tab: any) => ({
            service_id: id,
            title: tab.title,
            content: tab.content,
            order_index: tab.order_index || 0
          }))
        });
      }
    }

    return res.json({ service });
  } catch (error: any) {
    console.error('Admin service update error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
});

app.delete('/api/admin/services/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Service ID is required' });
    }

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id }
    });

    if (!existingService) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Delete service (tabs and equipment will be deleted due to cascade)
    await prisma.service.delete({
      where: { id }
    });

    return res.json({
      message: 'Service deleted successfully'
    });
  } catch (error: any) {
    console.error('Admin service delete error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
});

// Admin Service Centers routes
app.get('/api/admin/service-centers', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { includeHidden, featured } = req.query as { includeHidden?: string; featured?: string };

    const centers = await (prisma as any).serviceCenter.findMany({
      where: {
        ...(includeHidden === 'true' ? {} : { is_published: true }),
        ...(featured !== undefined ? { is_featured: featured === 'true' } : {})
      },
      include: {
        equipments: true
      },
      orderBy: [
        { order_index: 'asc' },
        { created_at: 'desc' }
      ]
    });

    return res.json({
      centers: centers.map(transformServiceCenter),
      total: centers.length
    });
  } catch (error: any) {
    console.error('Admin service centers fetch error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/admin/service-centers/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Service center ID or slug is required' });
    }

    let center = await (prisma as any).serviceCenter.findUnique({
      where: { id },
      include: {
        equipments: true
      }
    });

    if (!center) {
      center = await (prisma as any).serviceCenter.findUnique({
        where: { slug: id },
        include: {
          equipments: true
        }
      });
    }

    if (!center) {
      return res.status(404).json({ message: 'Service center not found' });
    }

    return res.json({ center: transformServiceCenter(center) });
  } catch (error: any) {
    console.error('Admin service center fetch error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/admin/service-centers', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      slug: slugInput,
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
      orderIndex
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Service center name is required' });
    }

    const finalSlug = slugify(slugInput || name);

    if (!finalSlug) {
      return res.status(400).json({ message: 'Unable to generate a valid slug for the service center' });
    }

    const existingCenter = await (prisma as any).serviceCenter.findUnique({
      where: { slug: finalSlug }
    });

    if (existingCenter) {
      return res.status(400).json({ message: 'A service center with this slug already exists' });
    }

    const equipmentsInput = req.body.equipments ?? req.body.equipmentList ?? req.body.equipment_list;
    const productsInput = req.body.products ?? req.body.productList ?? req.body.product_list;
    const workVolumeInput = req.body.work_volume ?? req.body.workVolume;
    const companyActivityInput = req.body.company_activity ?? req.body.companyActivity;
    const servicesInput = req.body.services ?? req.body.serviceTabs ?? req.body.service_tabs;
    const metricsInput = req.body.metrics ?? req.body.analytics ?? req.body.kpis;

    const equipmentItems = parseEquipmentItems(equipmentsInput);

    const center = await (prisma as any).serviceCenter.create({
      data: {
        name,
        slug: finalSlug,
        headline: headline ?? null,
        description: description ?? null,
        image: image ?? null,
        banner_image: (banner_image ?? bannerImage) || null,
        location: location ?? null,
        contact_phone: (contact_phone ?? contactPhone) || null,
        contact_email: (contact_email ?? contactEmail) || null,
        lab_methodology: (lab_methodology ?? labMethodology) || null,
        future_prospective: (future_prospective ?? futureProspective) || null,
        products: parseJsonValue(productsInput as JsonValue | string | undefined, [] as any[]),
        work_volume: parseJsonValue(workVolumeInput as JsonValue | string | undefined, null as any),
        company_activity: parseJsonValue(companyActivityInput as JsonValue | string | undefined, null as any),
        services: parseJsonValue(servicesInput as JsonValue | string | undefined, [] as any[]),
        metrics: parseJsonValue(metricsInput as JsonValue | string | undefined, null as any),
        is_featured: parseBoolean(is_featured ?? isFeatured, false),
        is_published: parseBoolean(is_published ?? isPublished, true),
        order_index: parseNumber(order_index ?? orderIndex, 0)
      }
    });

    await syncServiceCenterEquipments(center.id, equipmentItems);

    const centerWithRelations = await (prisma as any).serviceCenter.findUnique({
      where: { id: center.id },
      include: {
        equipments: true
      }
    });

    return res.json({
      message: 'Service center created successfully',
      center: centerWithRelations ? transformServiceCenter(centerWithRelations) : transformServiceCenter(center)
    });
  } catch (error: any) {
    console.error('Admin service center create error:', error);
    if (error?.code === 'P2002') {
      return res.status(400).json({ message: 'A service center with this slug already exists' });
    }
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
});

app.put('/api/admin/service-centers/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Service center ID is required' });
    }

    const existingCenter = await (prisma as any).serviceCenter.findUnique({
      where: { id }
    });

    if (!existingCenter) {
      return res.status(404).json({ message: 'Service center not found' });
    }

    const {
      name,
      slug: slugInput,
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
      orderIndex
    } = req.body;

    const updateData: Record<string, any> = {};

    if (name !== undefined) updateData.name = name;

    if (slugInput !== undefined) {
      const finalSlug = slugify(slugInput);
      if (!finalSlug) {
        return res.status(400).json({ message: 'Invalid slug provided' });
      }

      if (finalSlug !== existingCenter.slug) {
        const slugConflict = await (prisma as any).serviceCenter.findUnique({
          where: { slug: finalSlug }
        });

        if (slugConflict && slugConflict.id !== id) {
          return res.status(400).json({ message: 'Another service center with this slug already exists' });
        }
      }

      updateData.slug = finalSlug;
    }

    if (headline !== undefined) updateData.headline = headline ?? null;
    if (description !== undefined) updateData.description = description ?? null;
    if (image !== undefined) updateData.image = image ?? null;
    const bannerValue = banner_image ?? bannerImage;
    if (bannerValue !== undefined) updateData.banner_image = bannerValue || null;
    if (location !== undefined) updateData.location = location ?? null;
    const phoneValue = contact_phone ?? contactPhone;
    if (phoneValue !== undefined) updateData.contact_phone = phoneValue || null;
    const emailValue = contact_email ?? contactEmail;
    if (emailValue !== undefined) updateData.contact_email = emailValue || null;
    const labMethodValue = lab_methodology ?? labMethodology;
    if (labMethodValue !== undefined) updateData.lab_methodology = labMethodValue || null;
    const futureValue = future_prospective ?? futureProspective;
    if (futureValue !== undefined) updateData.future_prospective = futureValue || null;

    const equipmentsInput = req.body.equipments ?? req.body.equipmentList ?? req.body.equipment_list;
    const equipmentItems = equipmentsInput !== undefined ? parseEquipmentItems(equipmentsInput) : null;

    const productsInput = req.body.products ?? req.body.productList ?? req.body.product_list;
    if (productsInput !== undefined) {
      updateData.products = parseJsonValue(productsInput as JsonValue | string | undefined, [] as any[]);
    }

    const workVolumeInput = req.body.work_volume ?? req.body.workVolume;
    if (workVolumeInput !== undefined) {
      updateData.work_volume = parseJsonValue(workVolumeInput as JsonValue | string | undefined, null as any);
    }

    const companyActivityInput = req.body.company_activity ?? req.body.companyActivity;
    if (companyActivityInput !== undefined) {
      updateData.company_activity = parseJsonValue(companyActivityInput as JsonValue | string | undefined, null as any);
    }

    const servicesInput = req.body.services ?? req.body.serviceTabs ?? req.body.service_tabs;
    if (servicesInput !== undefined) {
      updateData.services = parseJsonValue(servicesInput as JsonValue | string | undefined, [] as any[]);
    }

    const metricsInput = req.body.metrics ?? req.body.analytics ?? req.body.kpis;
    if (metricsInput !== undefined) {
      updateData.metrics = parseJsonValue(metricsInput as JsonValue | string | undefined, null as any);
    }

    if (is_featured !== undefined || isFeatured !== undefined) {
      updateData.is_featured = parseBoolean(is_featured ?? isFeatured, existingCenter.is_featured);
    }

    if (is_published !== undefined || isPublished !== undefined) {
      updateData.is_published = parseBoolean(is_published ?? isPublished, existingCenter.is_published);
    }

    if (order_index !== undefined || orderIndex !== undefined) {
      updateData.order_index = parseNumber(order_index ?? orderIndex, existingCenter.order_index);
    }

    const center = await (prisma as any).serviceCenter.update({
      where: { id },
      data: updateData
    });

    if (equipmentItems !== null) {
      await syncServiceCenterEquipments(center.id, equipmentItems);
    }

    const centerWithRelations = await (prisma as any).serviceCenter.findUnique({
      where: { id },
      include: {
        equipments: true
      }
    });

    return res.json({
      message: 'Service center updated successfully',
      center: centerWithRelations ? transformServiceCenter(centerWithRelations) : transformServiceCenter(center)
    });
  } catch (error: any) {
    console.error('Admin service center update error:', error);
    if (error?.code === 'P2002') {
      return res.status(400).json({ message: 'A service center with this slug already exists' });
    }
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
});

app.delete('/api/admin/service-centers/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Service center ID is required' });
    }

    const existingCenter = await (prisma as any).serviceCenter.findUnique({
      where: { id }
    });

    if (!existingCenter) {
      return res.status(404).json({ message: 'Service center not found' });
    }

    await (prisma as any).serviceCenter.delete({
      where: { id }
    });

    return res.json({ message: 'Service center deleted successfully' });
  } catch (error: any) {
    console.error('Admin service center delete error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
});

// Admin Department Sections routes
app.get('/api/admin/department-sections', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const sections = await prisma.departmentSection.findMany({
      include: {
        _count: {
          select: {
            departments: true
          }
        }
      },
      orderBy: {
        order_index: 'asc'
      }
    });

    const sectionsWithCounts = sections.map((section: (typeof sections)[0]) => ({
      id: section.id,
      name: section.name,
      slug: section.slug,
      order_index: section.order_index,
      created_at: section.created_at,
      updated_at: section.updated_at,
      departments_count: section._count.departments
    }));

    return res.json({
      sections: sectionsWithCounts,
      total: sections.length
    });
  } catch (error) {
    console.error('Admin department sections fetch error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/admin/department-sections/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Section ID is required' });
    }
    const section = await prisma.departmentSection.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            departments: true
          }
        }
      }
    });

    if (!section) {
      return res.status(404).json({ message: 'Department section not found' });
    }

    const sectionWithCount = {
      id: section.id,
      name: section.name,
      slug: section.slug,
      order_index: section.order_index,
      created_at: section.created_at,
      updated_at: section.updated_at,
      departments_count: section._count.departments
    };

    return res.json({ section: sectionWithCount });
  } catch (error) {
    console.error('Admin department section fetch error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/admin/department-sections', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, slug, order_index } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Section name is required' });
    }

    // Generate slug from name if not provided
    const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Check if slug already exists
    const existingSection = await prisma.departmentSection.findUnique({
      where: { slug: finalSlug }
    });

    if (existingSection) {
      return res.status(400).json({ message: 'A section with this slug already exists' });
    }

    const section = await prisma.departmentSection.create({
      data: {
        name,
        slug: finalSlug,
        order_index: order_index || 0
      },
      include: {
        _count: {
          select: {
            departments: true
          }
        }
      }
    });

    const sectionWithCount = {
      id: section.id,
      name: section.name,
      slug: section.slug,
      order_index: section.order_index,
      created_at: section.created_at,
      updated_at: section.updated_at,
      departments_count: section._count.departments
    };

    return res.json({
      message: 'Department section created successfully',
      section: sectionWithCount
    });
  } catch (error: any) {
    console.error('Admin department section create error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'A section with this name or slug already exists' });
    }
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
});

app.put('/api/admin/department-sections/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Section ID is required' });
    }
    const { name, slug, order_index } = req.body;

    // Check if section exists
    const existingSection = await prisma.departmentSection.findUnique({
      where: { id }
    });

    if (!existingSection) {
      return res.status(404).json({ message: 'Department section not found' });
    }

    // Generate slug from name if not provided but name is being updated
    let finalSlug = slug;
    if (name && !slug) {
      finalSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    // Check if new slug conflicts with existing section
    if (finalSlug && finalSlug !== existingSection.slug) {
      const slugConflict = await prisma.departmentSection.findUnique({
        where: { slug: finalSlug }
      });
      if (slugConflict) {
        return res.status(400).json({ message: 'A section with this slug already exists' });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (finalSlug !== undefined) updateData.slug = finalSlug;
    if (order_index !== undefined) updateData.order_index = order_index;

    const section = await prisma.departmentSection.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            departments: true
          }
        }
      }
    });

    const sectionWithCount = {
      id: section.id,
      name: section.name,
      slug: section.slug,
      order_index: section.order_index,
      created_at: section.created_at,
      updated_at: section.updated_at,
      departments_count: section._count.departments
    };

    return res.json({
      message: 'Department section updated successfully',
      section: sectionWithCount
    });
  } catch (error: any) {
    console.error('Admin department section update error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'A section with this name or slug already exists' });
    }
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
});

app.delete('/api/admin/department-sections/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Section ID is required' });
    }

    // Check if section exists
    const existingSection = await prisma.departmentSection.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            departments: true
          }
        }
      }
    });

    if (!existingSection) {
      return res.status(404).json({ message: 'Department section not found' });
    }

    // Check if section has departments
    if (existingSection._count.departments > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete section with departments. Please remove or reassign departments first.' 
      });
    }

    await prisma.departmentSection.delete({
      where: { id }
    });

    return res.json({
      message: 'Department section deleted successfully'
    });
  } catch (error: any) {
    console.error('Admin department section delete error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  } 
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
if (isHttpsEnabled()) {
  // Start HTTPS server
  const httpsServer = createHttpsServer(app, port);
  
  if (httpsServer) {
    const httpsPort = process.env.HTTPS_PORT ? parseInt(process.env.HTTPS_PORT) : port;
    console.log(`🚀 EPRI Backend server running on HTTPS port ${httpsPort}`);
    console.log(`📊 Health check: https://localhost:${httpsPort}/api/health`);
  } else {
    // Fallback to HTTP if HTTPS setup fails
    app.listen(port, () => {
      console.log(`🚀 EPRI Backend server running on HTTP port ${port} (HTTPS setup failed)`);
      console.log(`📊 Health check: http://localhost:${port}/api/health`);
    });
  }
} else {
  // Start HTTP server (default)
  app.listen(port, () => {
    console.log(`🚀 EPRI Backend server running on HTTP port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/api/health`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

export { prisma };
