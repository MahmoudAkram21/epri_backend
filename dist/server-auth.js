"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const https_server_1 = require("./https-server");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3002;
const prisma = new client_1.PrismaClient();
const slugify = (value) => value
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
const parseJsonValue = (value, fallback) => {
    if (value === null || value === undefined) {
        return fallback;
    }
    if (typeof value === 'string') {
        if (value.trim() === '') {
            return fallback;
        }
        try {
            return JSON.parse(value);
        }
        catch (error) {
            console.warn('Failed to parse JSON string field. Returning fallback.', { value, error });
            return fallback;
        }
    }
    return value;
};
const normalizeCenterEquipments = (equipments) => {
    if (!Array.isArray(equipments))
        return [];
    return equipments.map((equipment) => ({
        id: equipment.id,
        name: equipment.name,
        details: equipment.description ?? null,
        description: equipment.description ?? null,
        image: equipment.image ?? null,
        specifications: parseJsonValue(equipment.specifications, null)
    }));
};
const parseEquipmentItems = (input) => {
    const items = parseJsonValue(input, []);
    if (!Array.isArray(items))
        return [];
    return items
        .map((item) => {
        if (!item || typeof item !== 'object')
            return null;
        const name = item.name ?? item.title ?? '';
        if (!name)
            return null;
        return {
            name,
            description: item.details ?? item.description ?? null,
            image: item.image ?? null,
            specifications: item.specifications !== undefined
                ? parseJsonValue(item.specifications, null)
                : null
        };
    })
        .filter((item) => item !== null);
};
const syncServiceCenterEquipments = async (centerId, equipments) => {
    await prisma.serviceEquipment.deleteMany({
        where: { service_center_id: centerId }
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
        }))
    });
};
const transformServiceCenter = (center) => {
    const { equipments, ...rest } = center;
    return {
        ...rest,
        equipments: normalizeCenterEquipments(equipments),
        products: parseJsonValue(center.products, []),
        work_volume: parseJsonValue(center.work_volume, null),
        company_activity: parseJsonValue(center.company_activity, null),
        services: parseJsonValue(center.services, []),
        metrics: parseJsonValue(center.metrics, null)
    };
};
const parseBoolean = (value, fallback) => {
    if (value === undefined || value === null)
        return fallback;
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'number')
        return value !== 0;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === '')
            return fallback;
        if (normalized === 'true' || normalized === '1' || normalized === 'yes')
            return true;
        if (normalized === 'false' || normalized === '0' || normalized === 'no')
            return false;
    }
    return fallback;
};
const parseNumber = (value, fallback) => {
    if (value === undefined || value === null)
        return fallback;
    if (typeof value === 'number')
        return value;
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        if (!isNaN(parsed))
            return parsed;
    }
    return fallback;
};
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const visitor_stats_1 = __importDefault(require("./routes/visitor-stats"));
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'EPRI Backend API is running',
        timestamp: new Date().toISOString()
    });
});
app.use('/api/visitor-stats', visitor_stats_1.default);
app.post('/api/auth/register', async (req, res) => {
    try {
        const { first_name, last_name, email, password, phone, role = 'STUDENT' } = req.body;
        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({
                message: 'First name, last name, email, and password are required'
            });
        }
        if (password.length < 8) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters long'
            });
        }
        if (role === 'ADMIN') {
            return res.status(400).json({
                message: 'Cannot register with ADMIN role'
            });
        }
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        const saltRounds = 12;
        const password_hash = await bcryptjs_1.default.hash(password, saltRounds);
        const user = await prisma.user.create({
            data: {
                first_name,
                last_name,
                email,
                password_hash,
                phone,
                role: role,
                is_verified: false
            },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone: true,
                role: true,
                is_verified: true,
                created_at: true
            }
        });
        return res.status(201).json({
            message: 'User registered successfully. Account is pending verification.',
            user
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password_hash || '');
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        if (!user.is_verified) {
            return res.status(403).json({
                message: 'Account pending verification. Please wait for administrator approval.',
                code: 'ACCOUNT_PENDING'
            });
        }
        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email,
            role: user.role
        }, jwtSecret, { expiresIn: '7d' });
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
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
app.get('/api/auth/profile', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Access token required' });
        }
        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
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
                created_at: true,
                updated_at: true
            }
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.json({ user });
    }
    catch (error) {
        console.error('Profile fetch error:', error);
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
});
app.get('/api/auth/verify', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Access token required' });
        }
        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        return res.json({
            message: 'Token is valid',
            user: {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role
            }
        });
    }
    catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
});
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: 'Access token required' });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, role: true, is_verified: true }
        });
        if (!user || !user.is_verified) {
            res.status(401).json({ message: 'Invalid or unverified token' });
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
        res.status(403).json({ message: 'Invalid or expired token' });
    }
};
const requireAdmin = (req, res, next) => {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
        res.status(403).json({ message: 'Admin access required' });
        return;
    }
    next();
};
app.get('/api/events', (req, res) => {
    res.json({
        events: [],
        message: 'Events endpoint - ready for implementation',
        query: req.query
    });
});
app.get('/api/courses', async (req, res) => {
    try {
        const { category, level, delivery_type, is_featured, is_published = 'true', page = '1', limit = '50' } = req.query;
        console.log('Fetching courses with params:', { category, level, delivery_type, is_featured, is_published });
        const where = {};
        if (is_published !== undefined) {
            where.is_published = is_published === 'true';
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
            where.is_featured = is_featured === 'true';
        }
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 50;
        const skip = (pageNum - 1) * limitNum;
        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                orderBy: [
                    { is_featured: 'desc' },
                    { created_at: 'desc' }
                ],
                skip,
                take: limitNum,
                include: {
                    lessons: {
                        select: {
                            id: true,
                            title: true,
                            duration: true,
                            is_preview: true,
                            order_index: true
                        },
                        orderBy: {
                            order_index: 'asc'
                        }
                    }
                }
            }),
            prisma.course.count({ where })
        ]);
        const transformedCourses = courses.map(course => ({
            ...course,
            lessons_count: course.lessons.length,
            total_duration: course.lessons.reduce((sum, lesson) => sum + lesson.duration, 0),
            preview_lessons: course.lessons.filter(lesson => lesson.is_preview).length
        }));
        console.log(`Found ${transformedCourses.length} courses`);
        return res.json({
            data: transformedCourses,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    }
    catch (error) {
        console.error('Get courses error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
app.get('/api/courses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Fetching course:', id);
        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                lessons: {
                    orderBy: {
                        order_index: 'asc'
                    }
                }
            }
        });
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        const transformedCourse = {
            ...course,
            objectives: course.objectives ? JSON.parse(course.objectives) : [],
            requirements: course.requirements ? JSON.parse(course.requirements) : [],
            lessons_count: course.lessons.length,
            total_duration: course.lessons.reduce((sum, lesson) => sum + lesson.duration, 0),
            preview_lessons: course.lessons.filter(lesson => lesson.is_preview)
        };
        return res.json({
            course: transformedCourse
        });
    }
    catch (error) {
        console.error('Get course error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
app.get('/api/courses/:id/lessons', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Fetching lessons for course:', id);
        const course = await prisma.course.findUnique({
            where: { id },
            select: { id: true, title: true }
        });
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        const lessons = await prisma.lesson.findMany({
            where: { course_id: id },
            orderBy: {
                order_index: 'asc'
            }
        });
        const transformedLessons = lessons.map(lesson => ({
            ...lesson,
            attachments: lesson.attachments ? JSON.parse(lesson.attachments) : [],
            quiz_data: lesson.quiz_data ? JSON.parse(lesson.quiz_data) : null
        }));
        return res.json({
            lessons: transformedLessons,
            course: {
                id: course.id,
                title: course.title
            }
        });
    }
    catch (error) {
        console.error('Get course lessons error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
app.get('/api/courses/:courseId/lessons/:lessonId', async (req, res) => {
    try {
        const { courseId, lessonId } = req.params;
        console.log('Fetching lesson:', { courseId, lessonId });
        const lesson = await prisma.lesson.findFirst({
            where: {
                id: lessonId,
                course_id: courseId
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        is_free: true
                    }
                }
            }
        });
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }
        const transformedLesson = {
            ...lesson,
            attachments: lesson.attachments ? JSON.parse(lesson.attachments) : [],
            quiz_data: lesson.quiz_data ? JSON.parse(lesson.quiz_data) : null
        };
        return res.json({
            lesson: transformedLesson
        });
    }
    catch (error) {
        console.error('Get lesson error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
app.get('/api/admin/events', async (req, res) => {
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
    }
    catch (error) {
        console.error('Admin events fetch error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
app.get('/api/admin/users', async (req, res) => {
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
                    include: {
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
    }
    catch (error) {
        console.error('Admin users fetch error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
app.get('/api/admin/event-requests', async (req, res) => {
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
    }
    catch (error) {
        console.error('Admin event requests fetch error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
app.post('/api/admin/events', async (req, res) => {
    try {
        const { title, description, start_date, end_date, price, capacity, status, address_id, featured, registration_open, is_conference, cover_image, agenda, guidelines, category_ids, speaker_ids } = req.body;
        const event = await prisma.event.create({
            data: {
                title,
                description,
                start_date: new Date(start_date),
                end_date: end_date ? new Date(end_date) : null,
                price: parseFloat(price) || 0,
                capacity: parseInt(capacity) || 100,
                status: status || 'PUBLISHED',
                featured: featured || false,
                registration_open: registration_open !== false,
                is_conference: is_conference || false,
                cover_image: cover_image || null,
                agenda: agenda ? (typeof agenda === 'string' ? JSON.parse(agenda) : agenda) : null,
                guidelines: guidelines || null,
                ...(address_id && { address_id }),
                categories: category_ids ? {
                    create: category_ids.map((categoryId) => ({
                        category_id: categoryId
                    }))
                } : undefined,
                speakers: speaker_ids ? {
                    connect: speaker_ids.map((speakerId) => ({
                        id: speakerId
                    }))
                } : undefined
            },
            include: {
                categories: {
                    include: {
                        category: true
                    }
                },
                address: true,
                speakers: true
            }
        });
        return res.status(201).json({
            message: 'Event created successfully',
            event
        });
    }
    catch (error) {
        console.error('Create event error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
app.put('/api/admin/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, start_date, end_date, price, capacity, status, address_id, featured, registration_open, is_conference, cover_image, agenda, guidelines } = req.body;
        if (is_conference) {
            const existingConference = await prisma.event.findFirst({
                where: {
                    is_conference: true,
                    id: { not: id }
                }
            });
            if (existingConference) {
                await prisma.event.update({
                    where: { id: existingConference.id },
                    data: { is_conference: false }
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
                agenda: typeof agenda === 'undefined' ? undefined : (agenda ? (typeof agenda === 'string' ? JSON.parse(agenda) : agenda) : null),
                guidelines,
                ...(address_id && { address_id })
            },
            include: {
                categories: {
                    include: {
                        category: true
                    }
                },
                address: true,
                speakers: true
            }
        });
        return res.json({
            message: 'Event updated successfully',
            event
        });
    }
    catch (error) {
        console.error('Update event error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
app.delete('/api/admin/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.event.delete({
            where: { id }
        });
        return res.json({
            message: 'Event deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete event error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
app.put('/api/admin/users/:id/role', async (req, res) => {
    try {
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
                is_verified: true
            }
        });
        return res.json({
            message: 'User role updated successfully',
            user
        });
    }
    catch (error) {
        console.error('Update user role error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
app.put('/api/admin/users/:id/verify', async (req, res) => {
    try {
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
                is_verified: true
            }
        });
        return res.json({
            message: 'User verification status updated successfully',
            user
        });
    }
    catch (error) {
        console.error('Update user verification error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
app.post('/api/admin/users', async (req, res) => {
    try {
        const { first_name, last_name, email, password, phone, role = 'STUDENT', is_verified = false } = req.body;
        if (!first_name || !last_name || !email) {
            return res.status(400).json({
                message: 'First name, last name, and email are required'
            });
        }
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        let password_hash = null;
        if (password) {
            if (password.length < 8) {
                return res.status(400).json({
                    message: 'Password must be at least 8 characters long'
                });
            }
            const saltRounds = 12;
            password_hash = await bcryptjs_1.default.hash(password, saltRounds);
        }
        const user = await prisma.user.create({
            data: {
                first_name,
                last_name,
                email,
                password_hash,
                phone,
                role: role,
                is_verified
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
                updated_at: true
            }
        });
        return res.status(201).json({
            message: 'User created successfully',
            user
        });
    }
    catch (error) {
        console.error('Create user error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
app.put('/api/admin/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, email, password, phone, role, is_verified } = req.body;
        const existingUser = await prisma.user.findUnique({
            where: { id }
        });
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        const updateData = {};
        if (first_name !== undefined)
            updateData.first_name = first_name;
        if (last_name !== undefined)
            updateData.last_name = last_name;
        if (phone !== undefined)
            updateData.phone = phone;
        if (role !== undefined)
            updateData.role = role;
        if (is_verified !== undefined)
            updateData.is_verified = is_verified;
        if (email && email !== existingUser.email) {
            const emailExists = await prisma.user.findUnique({
                where: { email }
            });
            if (emailExists) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            updateData.email = email;
        }
        if (password) {
            if (password.length < 8) {
                return res.status(400).json({
                    message: 'Password must be at least 8 characters long'
                });
            }
            const saltRounds = 12;
            updateData.password_hash = await bcryptjs_1.default.hash(password, saltRounds);
        }
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
                updated_at: true
            }
        });
        return res.json({
            message: 'User updated successfully',
            user
        });
    }
    catch (error) {
        console.error('Update user error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
app.get('/api/admin/users/:id', async (req, res) => {
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
                                start_date: true
                            }
                        }
                    }
                }
            }
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.json({ user });
    }
    catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
app.delete('/api/admin/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id }
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        await prisma.user.delete({
            where: { id }
        });
        return res.json({
            message: 'User deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
app.get('/api/admin/stats', async (req, res) => {
    try {
        const [totalUsers, totalEvents, totalEventRequests, pendingRequests, verifiedUsers, recentEvents] = await Promise.all([
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
    }
    catch (error) {
        console.error('Admin stats error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});
app.get('/api/department-sections', async (req, res) => {
    try {
        const sections = await prisma.departmentSection.findMany({
            orderBy: { order_index: 'asc' }
        });
        const sectionsWithCount = await Promise.all(sections.map(async (section) => {
            const count = await prisma.department.count({
                where: { section_id: section.id }
            });
            return {
                ...section,
                departments_count: count
            };
        }));
        res.json({ sections: sectionsWithCount });
    }
    catch (err) {
        console.error('Error fetching department sections:', err);
        res.status(500).json({ message: 'Failed to fetch department sections' });
    }
});
app.get('/api/departments', async (req, res) => {
    try {
        const { sectionId } = req.query;
        const departments = await prisma.department.findMany({
            ...(sectionId ? { where: { section_id: sectionId } } : {}),
            orderBy: { created_at: 'desc' }
        });
        res.json({ departments });
    }
    catch (err) {
        console.error('Error fetching departments', err);
        res.status(500).json({ message: 'Failed to fetch departments' });
    }
});
app.get('/api/departments/:id', async (req, res) => {
    console.log('=== DEPARTMENT API CALLED ===', req.params.id);
    try {
        const { id } = req.params;
        const department = await prisma.department.findUnique({
            where: { id },
            include: {
                section: true
            }
        });
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }
        console.log('Fetching staff for department:', id);
        const departmentStaff = await prisma.$queryRaw `
      SELECT s.* FROM staff s
      INNER JOIN department_staff ds ON s.id = ds.staff_id
      WHERE ds.department_id = ${id}
    `;
        console.log('Found staff members:', departmentStaff);
        const services = await prisma.service.findMany({
            where: {
                is_published: true
            },
            include: {
                center_head: true
            },
            take: 10
        });
        console.log('Fetching laboratories for department:', id);
        const laboratories = await prisma.laboratory.findMany({
            where: {
                department_id: id,
                is_active: true
            },
            orderBy: [
                { display_order: 'asc' },
                { name: 'asc' }
            ]
        });
        console.log('Found laboratories:', laboratories.length);
        const manager = Array.isArray(departmentStaff) && departmentStaff.length > 0
            ? departmentStaff.find((staff) => staff.current_admin_position) || departmentStaff[0]
            : null;
        console.log('Creating enhanced department with staff count:', Array.isArray(departmentStaff) ? departmentStaff.length : 'not array');
        const enhancedDepartment = {
            ...department,
            staff: departmentStaff || [],
            manager: manager ? {
                ...manager,
                expertise: manager.research_interests ?
                    manager.research_interests.split(',').map((s) => s.trim()).filter(Boolean) : []
            } : null,
            analysisServices: services.map(service => ({
                id: service.id,
                name: service.title,
                description: service.description,
                price: service.price ? parseFloat(service.price.toString()) : null,
                duration: service.duration,
                features: service.features
            })),
            laboratories: laboratories || [],
            equipment: [],
            achievements: [],
            researchAreas: [],
            about: department.description
        };
        console.log('Returning enhanced department:', JSON.stringify(enhancedDepartment, null, 2));
        return res.json({ department: enhancedDepartment });
    }
    catch (err) {
        console.error('Error fetching department:', err);
        return res.status(500).json({ message: 'Failed to fetch department' });
    }
});
app.get('/api/staff/:id', async (req, res) => {
    console.log('=== STAFF API CALLED ===', req.params.id);
    try {
        const { id } = req.params;
        const staff = await prisma.staff.findUnique({
            where: { id }
        });
        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }
        const staffDepartments = await prisma.$queryRaw `
      SELECT d.*, s.name as section_name FROM department d
      INNER JOIN department_staff ds ON d.id = ds.department_id
      INNER JOIN department_section s ON d.section_id = s.id
      WHERE ds.staff_id = ${id}
    `;
        console.log('Found departments for staff:', staffDepartments);
        const researchInterests = staff.research_interests ?
            staff.research_interests.split(',').map((s) => s.trim()).filter(Boolean) : [];
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
        console.log('Returning enhanced staff:', JSON.stringify(enhancedStaff, null, 2));
        return res.json({ staff: enhancedStaff });
    }
    catch (err) {
        console.error('Error fetching staff:', err);
        return res.status(500).json({ message: 'Failed to fetch staff' });
    }
});
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
        const departmentsWithStaff = await Promise.all(departments.map(async (department) => {
            const staffCount = await prisma.departmentStaff.count({
                where: { department_id: department.id }
            });
            return {
                ...department,
                staff_count: staffCount
            };
        }));
        return res.json({
            departments: departmentsWithStaff,
            total: departments.length
        });
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
        const existingDepartment = await prisma.department.findUnique({
            where: { id }
        });
        if (!existingDepartment) {
            return res.status(404).json({ message: 'Department not found' });
        }
        const department = await prisma.department.update({
            where: { id },
            data: {
                ...(name && { name }),
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
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Admin department delete error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
app.get('/api/admin/department-sections', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const sections = await prisma.departmentSection.findMany({
            orderBy: {
                order_index: 'asc'
            }
        });
        const sectionsWithCount = await Promise.all(sections.map(async (section) => {
            const count = await prisma.department.count({
                where: { section_id: section.id }
            });
            return {
                ...section,
                departments_count: count
            };
        }));
        return res.json({
            sections: sectionsWithCount,
            total: sections.length
        });
    }
    catch (error) {
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
                departments: {
                    orderBy: { created_at: 'desc' }
                }
            }
        });
        if (!section) {
            return res.status(404).json({ message: 'Department section not found' });
        }
        return res.json({ section });
    }
    catch (error) {
        console.error('Admin department section fetch error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
app.post('/api/admin/department-sections', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, slug, order_index } = req.body;
        if (!name || !slug) {
            return res.status(400).json({ message: 'Name and slug are required' });
        }
        const existingSection = await prisma.departmentSection.findUnique({
            where: { slug }
        });
        if (existingSection) {
            return res.status(400).json({ message: 'Section with this slug already exists' });
        }
        const section = await prisma.departmentSection.create({
            data: {
                name,
                slug,
                order_index: order_index || 0
            }
        });
        return res.json({
            message: 'Department section created successfully',
            section
        });
    }
    catch (error) {
        console.error('Admin department section create error:', error);
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
        const existingSection = await prisma.departmentSection.findUnique({
            where: { id }
        });
        if (!existingSection) {
            return res.status(404).json({ message: 'Department section not found' });
        }
        if (slug && slug !== existingSection.slug) {
            const slugConflict = await prisma.departmentSection.findUnique({
                where: { slug }
            });
            if (slugConflict) {
                return res.status(400).json({ message: 'Section with this slug already exists' });
            }
        }
        const section = await prisma.departmentSection.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(slug && { slug }),
                ...(order_index !== undefined && { order_index })
            }
        });
        return res.json({
            message: 'Department section updated successfully',
            section
        });
    }
    catch (error) {
        console.error('Admin department section update error:', error);
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
        const existingSection = await prisma.departmentSection.findUnique({
            where: { id }
        });
        if (!existingSection) {
            return res.status(404).json({ message: 'Department section not found' });
        }
        const departmentCount = await prisma.department.count({
            where: { section_id: id }
        });
        if (departmentCount > 0) {
            return res.status(400).json({
                message: `Cannot delete section with ${departmentCount} departments. Move or delete departments first.`
            });
        }
        await prisma.departmentSection.delete({
            where: { id }
        });
        return res.json({
            message: 'Department section deleted successfully'
        });
    }
    catch (error) {
        console.error('Admin department section delete error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
app.get('/api/admin/staff', authenticateToken, requireAdmin, async (req, res) => {
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
    }
    catch (error) {
        console.error('Admin staff fetch error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
app.post('/api/admin/staff', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, title, academic_position, current_admin_position, ex_admin_position, scientific_name, picture, gallery, bio, research_interests, news, email, alternative_email, phone, mobile, website, google_scholar, research_gate, academia_edu, linkedin, facebook, twitter, google_plus, youtube, wordpress, instagram, mendeley, zotero, evernote, orcid, scopus, publications_count, papers_count, abstracts_count, courses_files_count, inlinks_count, external_links_count, faculty, department, office_location, office_hours } = req.body;
        if (!name || !title) {
            return res.status(400).json({ message: 'Name and title are required' });
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
                office_hours: office_hours || null
            }
        });
        return res.json({
            message: 'Staff member created successfully',
            staff: staffMember
        });
    }
    catch (error) {
        console.error('Admin staff create error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
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
    }
    catch (error) {
        console.error('Admin staff fetch error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
app.put('/api/admin/staff/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        if (!id) {
            return res.status(400).json({ message: 'Staff ID is required' });
        }
        const existingStaff = await prisma.staff.findUnique({
            where: { id }
        });
        if (!existingStaff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }
        const updatedStaff = await prisma.staff.update({
            where: { id },
            data: {
                name: updateData.name || existingStaff.name,
                title: updateData.title || existingStaff.title,
                academic_position: updateData.academic_position !== undefined ? updateData.academic_position : existingStaff.academic_position,
                current_admin_position: updateData.current_admin_position !== undefined ? updateData.current_admin_position : existingStaff.current_admin_position,
                ex_admin_position: updateData.ex_admin_position !== undefined ? updateData.ex_admin_position : existingStaff.ex_admin_position,
                scientific_name: updateData.scientific_name !== undefined ? updateData.scientific_name : existingStaff.scientific_name,
                picture: updateData.picture !== undefined ? updateData.picture : existingStaff.picture,
                bio: updateData.bio !== undefined ? updateData.bio : existingStaff.bio,
                research_interests: updateData.research_interests !== undefined ? updateData.research_interests : existingStaff.research_interests,
                news: updateData.news !== undefined ? updateData.news : existingStaff.news,
                email: updateData.email !== undefined ? updateData.email : existingStaff.email,
                alternative_email: updateData.alternative_email !== undefined ? updateData.alternative_email : existingStaff.alternative_email,
                phone: updateData.phone !== undefined ? updateData.phone : existingStaff.phone,
                mobile: updateData.mobile !== undefined ? updateData.mobile : existingStaff.mobile,
                website: updateData.website !== undefined ? updateData.website : existingStaff.website,
                office_location: updateData.office_location !== undefined ? updateData.office_location : existingStaff.office_location,
                office_hours: updateData.office_hours !== undefined ? updateData.office_hours : existingStaff.office_hours,
                faculty: updateData.faculty !== undefined ? updateData.faculty : existingStaff.faculty,
                department: updateData.department !== undefined ? updateData.department : existingStaff.department,
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
                external_links_count: updateData.external_links_count !== undefined ? updateData.external_links_count : existingStaff.external_links_count
            }
        });
        return res.json({
            message: 'Staff member updated successfully',
            staff: updatedStaff
        });
    }
    catch (error) {
        console.error('Admin staff update error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
app.delete('/api/admin/staff/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'Staff ID is required' });
        }
        const existingStaff = await prisma.staff.findUnique({
            where: { id }
        });
        if (!existingStaff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }
        await prisma.departmentStaff.deleteMany({
            where: { staff_id: id }
        });
        await prisma.staff.delete({
            where: { id }
        });
        return res.json({
            message: 'Staff member deleted successfully'
        });
    }
    catch (error) {
        console.error('Admin staff delete error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
app.get('/api/admin/departments/:id/staff', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'Department ID is required' });
        }
        const departmentStaff = await prisma.departmentStaff.findMany({
            where: { department_id: id },
            orderBy: {
                created_at: 'desc'
            }
        });
        const staffIds = departmentStaff.map(ds => ds.staff_id);
        const staff = await prisma.staff.findMany({
            where: {
                id: { in: staffIds }
            },
            orderBy: {
                name: 'asc'
            }
        });
        return res.json({
            staff,
            total: staff.length
        });
    }
    catch (error) {
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
        if (!staffIds || !Array.isArray(staffIds)) {
            return res.status(400).json({ message: 'Staff IDs array is required' });
        }
        const department = await prisma.department.findUnique({
            where: { id }
        });
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }
        await prisma.departmentStaff.deleteMany({
            where: { department_id: id }
        });
        if (staffIds.length > 0) {
            const assignments = staffIds.map(staffId => ({
                department_id: id,
                staff_id: staffId
            }));
            await prisma.departmentStaff.createMany({
                data: assignments
            });
        }
        return res.json({
            message: 'Department staff assignments updated successfully'
        });
    }
    catch (error) {
        console.error('Department staff assignment error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
app.delete('/api/admin/departments/:departmentId/staff/:staffId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { departmentId, staffId } = req.params;
        if (!departmentId || !staffId) {
            return res.status(400).json({ message: 'Department ID and Staff ID are required' });
        }
        const assignment = await prisma.departmentStaff.findFirst({
            where: {
                department_id: departmentId,
                staff_id: staffId
            }
        });
        if (!assignment) {
            return res.status(404).json({ message: 'Staff assignment not found' });
        }
        await prisma.departmentStaff.delete({
            where: {
                id: assignment.id
            }
        });
        return res.json({
            message: 'Staff member removed from department successfully'
        });
    }
    catch (error) {
        console.error('Department staff removal error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
app.get('/api/laboratories', async (req, res) => {
    try {
        const { departmentId, sectionId } = req.query;
        console.log('Fetching laboratories with params:', { departmentId, sectionId });
        let whereClause = 'WHERE is_active = 1';
        const params = [];
        if (departmentId) {
            whereClause += ' AND department_id = ?';
            params.push(departmentId);
        }
        if (sectionId) {
            whereClause += ' AND section_id = ?';
            params.push(sectionId);
        }
        const laboratories = await prisma.$queryRawUnsafe(`
      SELECT 
        l.*,
        d.name as department_name,
        ds.name as section_name
      FROM laboratory l
      LEFT JOIN department d ON l.department_id = d.id
      LEFT JOIN department_section ds ON l.section_id = ds.id
      ${whereClause}
      ORDER BY l.display_order ASC, l.name ASC
    `, ...params);
        console.log('Found laboratories:', laboratories.length);
        return res.json({ laboratories });
    }
    catch (error) {
        console.error('Get laboratories error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
app.get('/api/laboratories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const laboratory = await prisma.$queryRawUnsafe(`
      SELECT 
        l.*,
        d.name as department_name,
        d.description as department_description,
        ds.name as section_name
      FROM laboratory l
      LEFT JOIN department d ON l.department_id = d.id
      LEFT JOIN department_section ds ON l.section_id = ds.id
      WHERE l.id = ?
    `, id);
        if (!laboratory || laboratory.length === 0) {
            return res.status(404).json({ message: 'Laboratory not found' });
        }
        const lab = laboratory[0];
        const transformedLab = {
            ...lab,
            department: lab.department_name ? {
                id: lab.department_id,
                name: lab.department_name,
                description: lab.department_description
            } : null,
            section: lab.section_name ? {
                id: lab.section_id,
                name: lab.section_name
            } : null
        };
        return res.json({ laboratory: transformedLab });
    }
    catch (error) {
        console.error('Get laboratory error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
app.get('/api/admin/laboratories', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { departmentId, sectionId, search } = req.query;
        console.log('Admin fetching laboratories with params:', { departmentId, sectionId, search });
        let whereClause = 'WHERE 1=1';
        const params = [];
        if (departmentId) {
            whereClause += ' AND l.department_id = ?';
            params.push(departmentId);
        }
        if (sectionId) {
            whereClause += ' AND l.section_id = ?';
            params.push(sectionId);
        }
        if (search) {
            whereClause += ' AND (l.name LIKE ? OR l.description LIKE ? OR l.head_name LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        const laboratories = await prisma.$queryRawUnsafe(`
      SELECT 
        l.*,
        d.name as department_name,
        ds.name as section_name
      FROM laboratory l
      LEFT JOIN department d ON l.department_id = d.id
      LEFT JOIN department_section ds ON l.section_id = ds.id
      ${whereClause}
      ORDER BY l.display_order ASC, l.name ASC
    `, ...params);
        const transformedLabs = laboratories.map(lab => ({
            ...lab,
            department: lab.department_name ? {
                id: lab.department_id,
                name: lab.department_name
            } : null,
            section: lab.section_name ? {
                id: lab.section_id,
                name: lab.section_name
            } : null
        }));
        console.log('Found laboratories:', transformedLabs.length);
        return res.json({ laboratories: transformedLabs });
    }
    catch (error) {
        console.error('Admin get laboratories error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
app.post('/api/admin/laboratories', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, description, image, head_name, head_title, head_academic_title, head_picture, head_cv_url, head_email, head_bio, address, phone, alternative_phone, fax, email, website, established_year, facilities, equipment_list, research_areas, services_offered, staff_count, students_count, department_id, section_id, building, floor, room_numbers, is_active, is_featured, display_order } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Laboratory name is required' });
        }
        const laboratory = await prisma.laboratory.create({
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
                established_year: established_year ? parseInt(established_year) : null,
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
                updated_at: new Date()
            },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                section: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        return res.status(201).json({
            message: 'Laboratory created successfully',
            laboratory
        });
    }
    catch (error) {
        console.error('Create laboratory error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
app.put('/api/admin/laboratories/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, image, head_name, head_title, head_academic_title, head_picture, head_cv_url, head_email, head_bio, address, phone, alternative_phone, fax, email, website, established_year, facilities, equipment_list, research_areas, services_offered, staff_count, students_count, department_id, section_id, building, floor, room_numbers, is_active, is_featured, display_order } = req.body;
        const existingLab = await prisma.laboratory.findUnique({
            where: { id }
        });
        if (!existingLab) {
            return res.status(404).json({ message: 'Laboratory not found' });
        }
        const laboratory = await prisma.laboratory.update({
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
                established_year: established_year ? parseInt(established_year) : existingLab.established_year,
                facilities,
                equipment_list,
                research_areas,
                services_offered,
                staff_count: staff_count ? parseInt(staff_count) : existingLab.staff_count,
                students_count: students_count ? parseInt(students_count) : existingLab.students_count,
                department_id,
                section_id,
                building,
                floor,
                room_numbers,
                is_active: is_active !== undefined ? Boolean(is_active) : existingLab.is_active,
                is_featured: is_featured !== undefined ? Boolean(is_featured) : existingLab.is_featured,
                display_order: display_order ? parseInt(display_order) : existingLab.display_order,
                updated_at: new Date()
            },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                section: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        return res.json({
            message: 'Laboratory updated successfully',
            laboratory
        });
    }
    catch (error) {
        console.error('Update laboratory error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
app.delete('/api/admin/laboratories/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const laboratory = await prisma.laboratory.findUnique({
            where: { id }
        });
        if (!laboratory) {
            return res.status(404).json({ message: 'Laboratory not found' });
        }
        await prisma.laboratory.delete({
            where: { id }
        });
        return res.json({
            message: 'Laboratory deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete laboratory error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
app.get('/api/services', async (req, res) => {
    try {
        const services = await prisma.service.findMany({
            include: {
                center_head: {
                    select: {
                        id: true,
                        name: true,
                        title: true,
                        picture: true
                    }
                },
                equipment: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        image: true,
                        specifications: true
                    }
                },
                tabs: {
                    orderBy: { order_index: 'asc' }
                }
            },
            orderBy: { created_at: 'desc' }
        });
        const servicesWithParsedData = services.map((service) => ({
            ...service,
            features: typeof service.features === 'string' ? JSON.parse(service.features) : service.features,
            equipment: service.equipment.map((eq) => ({
                ...eq,
                specifications: typeof eq.specifications === 'string' ? JSON.parse(eq.specifications) : eq.specifications
            }))
        }));
        res.json({ services: servicesWithParsedData, total: services.length });
    }
    catch (err) {
        console.error('Error fetching services:', err);
        res.status(500).json({ message: 'Failed to fetch services' });
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
                    orderBy: { order_index: 'asc' }
                }
            }
        });
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        const serviceWithParsedData = {
            ...service,
            features: typeof service.features === 'string' ? JSON.parse(service.features) : service.features,
            equipment: service.equipment.map((eq) => ({
                ...eq,
                specifications: typeof eq.specifications === 'string' ? JSON.parse(eq.specifications) : eq.specifications
            })),
            centerHead: service.center_head ? {
                ...service.center_head,
                expertise: typeof service.center_head.expertise === 'string' ? JSON.parse(service.center_head.expertise) : service.center_head.expertise
            } : null
        };
        return res.json({ service: serviceWithParsedData });
    }
    catch (err) {
        console.error('Error fetching service:', err);
        return res.status(500).json({ message: 'Failed to fetch service' });
    }
});
app.get('/api/service-center-heads', async (req, res) => {
    try {
        const centerHeads = await prisma.serviceCenterHead.findMany({
            orderBy: { name: 'asc' }
        });
        const centerHeadsWithParsedData = centerHeads.map(head => ({
            ...head,
            expertise: typeof head.expertise === 'string' ? JSON.parse(head.expertise) : head.expertise
        }));
        res.json({ centerHeads: centerHeadsWithParsedData, total: centerHeads.length });
    }
    catch (err) {
        console.error('Error fetching service center heads:', err);
        res.status(500).json({ message: 'Failed to fetch service center heads' });
    }
});
app.get('/api/service-centers', async (req, res) => {
    try {
        const { featured } = req.query;
        const centers = await prisma.serviceCenter.findMany({
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
    }
    catch (error) {
        console.error('Service centers fetch error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
app.get('/api/service-centers/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const { preview } = req.query;
        if (!slug) {
            return res.status(400).json({ message: 'Service center slug is required' });
        }
        const center = await prisma.serviceCenter.findUnique({
            where: { slug },
            include: {
                equipments: true
            }
        });
        if (!center) {
            return res.status(404).json({ message: 'Service center not found' });
        }
        if (!center.is_published && preview !== 'true') {
            return res.status(404).json({ message: 'Service center not found' });
        }
        return res.json({
            center: transformServiceCenter(center)
        });
    }
    catch (error) {
        console.error('Service center fetch error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
app.get('/api/admin/services', async (req, res) => {
    try {
        const services = await prisma.service.findMany({
            include: {
                center_head: {
                    select: {
                        id: true,
                        name: true,
                        title: true
                    }
                },
                tabs: {
                    orderBy: { order_index: 'asc' }
                }
            },
            orderBy: { created_at: 'desc' }
        });
        const servicesWithParsedData = services.map((service) => ({
            ...service,
            features: typeof service.features === 'string' ? JSON.parse(service.features) : service.features,
            centerHead: service.center_head
        }));
        res.json({ services: servicesWithParsedData, total: services.length });
    }
    catch (err) {
        console.error('Error fetching admin services:', err);
        res.status(500).json({ message: 'Failed to fetch services' });
    }
});
app.get('/api/admin/services/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const service = await prisma.service.findUnique({
            where: { id },
            include: {
                center_head: true,
                equipment: true,
                tabs: {
                    orderBy: { order_index: 'asc' }
                }
            }
        });
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        const serviceWithParsedData = {
            ...service,
            features: typeof service.features === 'string' ? JSON.parse(service.features) : service.features,
            centerHead: service.center_head
        };
        return res.json({ service: serviceWithParsedData });
    }
    catch (err) {
        console.error('Error fetching service:', err);
        return res.status(500).json({ message: 'Failed to fetch service' });
    }
});
app.post('/api/admin/services', async (req, res) => {
    try {
        const { title, subtitle, description, image, category, icon, features, center_head_id, duration, price, is_free, is_featured, is_published, group_name, group_order, tabs } = req.body;
        if (!title || !description) {
            return res.status(400).json({ message: 'Title and description are required' });
        }
        const service = await prisma.service.create({
            data: {
                title,
                subtitle: subtitle || null,
                description,
                image: image || null,
                category: category || 'General',
                icon: icon || null,
                features: features || '[]',
                center_head_id: center_head_id || null,
                duration: duration || null,
                price: price || 0,
                is_free: is_free || false,
                is_featured: is_featured || false,
                is_published: is_published !== undefined ? is_published : true,
                group_name: group_name || null,
                group_order: group_order || 0
            },
            include: {
                center_head: {
                    select: {
                        id: true,
                        name: true,
                        title: true
                    }
                }
            }
        });
        if (tabs && Array.isArray(tabs) && tabs.length > 0) {
            await prisma.serviceTab.createMany({
                data: tabs.map((tab) => ({
                    serviceId: service.id,
                    title: tab.title,
                    content: tab.content,
                    order_index: tab.order_index || 0
                }))
            });
        }
        const serviceWithTabs = await prisma.service.findUnique({
            where: { id: service.id },
            include: {
                center_head: {
                    select: {
                        id: true,
                        name: true,
                        title: true
                    }
                },
                tabs: {
                    orderBy: { order_index: 'asc' }
                }
            }
        });
        return res.status(201).json({
            service: {
                ...serviceWithTabs,
                features: typeof serviceWithTabs?.features === 'string' ? JSON.parse(serviceWithTabs.features) : serviceWithTabs?.features,
                centerHead: serviceWithTabs?.center_head
            },
            message: 'Service created successfully'
        });
    }
    catch (err) {
        console.error('Error creating service:', err);
        return res.status(500).json({ message: 'Failed to create service' });
    }
});
app.put('/api/admin/services/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, subtitle, description, image, category, icon, features, center_head_id, duration, price, is_free, is_featured, is_published, group_name, group_order, tabs } = req.body;
        const service = await prisma.service.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(subtitle !== undefined && { subtitle: subtitle || null }),
                ...(description && { description }),
                ...(image !== undefined && { image: image || null }),
                ...(category && { category }),
                ...(icon !== undefined && { icon: icon || null }),
                ...(features !== undefined && { features }),
                ...(center_head_id !== undefined && { center_head_id: center_head_id || null }),
                ...(duration !== undefined && { duration: duration || null }),
                ...(price !== undefined && { price }),
                ...(is_free !== undefined && { is_free }),
                ...(is_featured !== undefined && { is_featured }),
                ...(is_published !== undefined && { is_published }),
                ...(group_name !== undefined && { group_name: group_name || null }),
                ...(group_order !== undefined && { group_order })
            }
        });
        if (tabs !== undefined) {
            await prisma.serviceTab.deleteMany({
                where: { serviceId: id }
            });
            if (Array.isArray(tabs) && tabs.length > 0) {
                await prisma.serviceTab.createMany({
                    data: tabs.map((tab) => ({
                        serviceId: id,
                        title: tab.title,
                        content: tab.content,
                        order_index: tab.order_index || 0
                    }))
                });
            }
        }
        const updatedService = await prisma.service.findUnique({
            where: { id },
            include: {
                center_head: {
                    select: {
                        id: true,
                        name: true,
                        title: true
                    }
                },
                tabs: {
                    orderBy: { order_index: 'asc' }
                }
            }
        });
        return res.json({
            service: {
                ...updatedService,
                features: typeof updatedService?.features === 'string' ? JSON.parse(updatedService.features) : updatedService?.features,
                centerHead: updatedService?.center_head
            },
            message: 'Service updated successfully'
        });
    }
    catch (err) {
        console.error('Error updating service:', err);
        if (err.code === 'P2025') {
            return res.status(404).json({ message: 'Service not found' });
        }
        return res.status(500).json({ message: 'Failed to update service' });
    }
});
app.delete('/api/admin/services/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.serviceEquipment.deleteMany({
            where: { serviceId: id }
        });
        await prisma.service.delete({
            where: { id }
        });
        return res.json({ message: 'Service deleted successfully' });
    }
    catch (err) {
        console.error('Error deleting service:', err);
        if (err.code === 'P2025') {
            return res.status(404).json({ message: 'Service not found' });
        }
        return res.status(500).json({ message: 'Failed to delete service' });
    }
});
app.get('/api/admin/courses', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { search, category, level, delivery_type } = req.query;
        console.log('Admin fetching courses with params:', { search, category, level, delivery_type });
        const where = {};
        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } },
                { instructor_name: { contains: search } }
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
            orderBy: [
                { is_featured: 'desc' },
                { created_at: 'desc' }
            ],
            include: {
                lessons: {
                    select: {
                        id: true,
                        title: true,
                        duration: true,
                        order_index: true
                    },
                    orderBy: {
                        order_index: 'asc'
                    }
                }
            }
        });
        const transformedCourses = courses.map(course => ({
            ...course,
            lessons_count: course.lessons.length,
            total_duration: course.lessons.reduce((sum, lesson) => sum + lesson.duration, 0)
        }));
        console.log(`Found ${transformedCourses.length} courses`);
        return res.json({
            courses: transformedCourses,
            total: transformedCourses.length
        });
    }
    catch (error) {
        console.error('Admin get courses error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
app.get('/api/admin/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'Course ID is required' });
        }
        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                lessons: {
                    orderBy: {
                        order_index: 'asc'
                    }
                }
            }
        });
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        const transformedCourse = {
            ...course,
            objectives: course.objectives ? JSON.parse(course.objectives) : [],
            requirements: course.requirements ? JSON.parse(course.requirements) : []
        };
        return res.json({ course: transformedCourse });
    }
    catch (error) {
        console.error('Admin get course error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
app.post('/api/admin/courses', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { title, subtitle, description, image, instructor_name, category, price, is_free, duration_hours, duration_weeks, level, language, max_students, is_published, is_featured, delivery_type, meeting_location, room_number, building, address, zoom_link, meeting_id, meeting_passcode, platform, start_date, end_date, schedule_info, time_zone, objectives, requirements } = req.body;
        if (!title || !category || !level || !delivery_type) {
            return res.status(400).json({
                message: 'Title, category, level, and delivery type are required'
            });
        }
        const courseData = {
            title,
            subtitle: subtitle || null,
            description: description || null,
            image: image || null,
            instructor_name: instructor_name || null,
            category,
            price: parseFloat(price) || 0,
            is_free: is_free || false,
            duration_hours: parseInt(duration_hours) || 0,
            duration_weeks: parseInt(duration_weeks) || 0,
            level,
            language: language || 'English',
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
            time_zone: time_zone || 'UTC',
            rating_average: 0,
            rating_count: 0,
            enrollment_count: 0
        };
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
                        order_index: 'asc'
                    }
                }
            }
        });
        return res.status(201).json({
            message: 'Course created successfully',
            course
        });
    }
    catch (error) {
        console.error('Admin create course error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
app.put('/api/admin/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        if (!id) {
            return res.status(400).json({ message: 'Course ID is required' });
        }
        const existingCourse = await prisma.course.findUnique({
            where: { id }
        });
        if (!existingCourse) {
            return res.status(404).json({ message: 'Course not found' });
        }
        const courseUpdateData = {};
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
            courseUpdateData.duration_hours = parseInt(updateData.duration_hours) || 0;
        if (updateData.duration_weeks !== undefined)
            courseUpdateData.duration_weeks = parseInt(updateData.duration_weeks) || 0;
        if (updateData.level !== undefined)
            courseUpdateData.level = updateData.level;
        if (updateData.language !== undefined)
            courseUpdateData.language = updateData.language || 'English';
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
            courseUpdateData.start_date = updateData.start_date ? new Date(updateData.start_date) : null;
        if (updateData.end_date !== undefined)
            courseUpdateData.end_date = updateData.end_date ? new Date(updateData.end_date) : null;
        if (updateData.schedule_info !== undefined)
            courseUpdateData.schedule_info = updateData.schedule_info || null;
        if (updateData.time_zone !== undefined)
            courseUpdateData.time_zone = updateData.time_zone || 'UTC';
        if (updateData.objectives !== undefined) {
            if (updateData.objectives && updateData.objectives.length > 0) {
                courseUpdateData.objectives = JSON.stringify(updateData.objectives);
            }
            else {
                courseUpdateData.objectives = null;
            }
        }
        if (updateData.requirements !== undefined) {
            if (updateData.requirements && updateData.requirements.length > 0) {
                courseUpdateData.requirements = JSON.stringify(updateData.requirements);
            }
            else {
                courseUpdateData.requirements = null;
            }
        }
        const course = await prisma.course.update({
            where: { id },
            data: courseUpdateData,
            include: {
                lessons: {
                    orderBy: {
                        order_index: 'asc'
                    }
                }
            }
        });
        return res.json({
            message: 'Course updated successfully',
            course
        });
    }
    catch (error) {
        console.error('Admin update course error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
app.delete('/api/admin/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'Course ID is required' });
        }
        const existingCourse = await prisma.course.findUnique({
            where: { id }
        });
        if (!existingCourse) {
            return res.status(404).json({ message: 'Course not found' });
        }
        await prisma.course.delete({
            where: { id }
        });
        return res.json({
            message: 'Course deleted successfully'
        });
    }
    catch (error) {
        console.error('Admin delete course error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
app.get('/api/admin/courses/:courseId/lessons', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { courseId } = req.params;
        if (!courseId) {
            return res.status(400).json({ message: 'Course ID is required' });
        }
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true, title: true }
        });
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        const lessons = await prisma.lesson.findMany({
            where: { course_id: courseId },
            orderBy: {
                order_index: 'asc'
            }
        });
        const transformedLessons = lessons.map(lesson => ({
            ...lesson,
            attachments: lesson.attachments ? JSON.parse(lesson.attachments) : [],
            quiz_data: lesson.quiz_data ? JSON.parse(lesson.quiz_data) : null
        }));
        return res.json({
            lessons: transformedLessons,
            course: {
                id: course.id,
                title: course.title
            }
        });
    }
    catch (error) {
        console.error('Admin get course lessons error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
app.post('/api/admin/courses/:courseId/lessons', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { courseId } = req.params;
        if (!courseId) {
            return res.status(400).json({ message: 'Course ID is required' });
        }
        const { title, description, content, video_url, video_type, video_id, duration, order_index, is_free, is_preview, attachments, quiz_data, notes } = req.body;
        const course = await prisma.course.findUnique({
            where: { id: courseId }
        });
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        if (!title) {
            return res.status(400).json({ message: 'Lesson title is required' });
        }
        const lessonData = {
            course_id: courseId,
            title,
            description: description || null,
            content: content || null,
            video_url: video_url || null,
            video_type: video_type || 'youtube',
            video_id: video_id || null,
            duration: parseInt(duration) || 0,
            order_index: parseInt(order_index) || 0,
            is_free: is_free || false,
            is_preview: is_preview || false,
            notes: notes || null
        };
        if (attachments && attachments.length > 0) {
            lessonData.attachments = JSON.stringify(attachments);
        }
        if (quiz_data && quiz_data.questions && quiz_data.questions.length > 0) {
            lessonData.quiz_data = JSON.stringify(quiz_data);
        }
        const lesson = await prisma.lesson.create({
            data: lessonData
        });
        return res.status(201).json({
            message: 'Lesson created successfully',
            lesson
        });
    }
    catch (error) {
        console.error('Admin create lesson error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
app.put('/api/admin/lessons/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        if (!id) {
            return res.status(400).json({ message: 'Lesson ID is required' });
        }
        const existingLesson = await prisma.lesson.findUnique({
            where: { id }
        });
        if (!existingLesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }
        const lessonUpdateData = {};
        if (updateData.title !== undefined)
            lessonUpdateData.title = updateData.title;
        if (updateData.description !== undefined)
            lessonUpdateData.description = updateData.description || null;
        if (updateData.content !== undefined)
            lessonUpdateData.content = updateData.content || null;
        if (updateData.video_url !== undefined)
            lessonUpdateData.video_url = updateData.video_url || null;
        if (updateData.video_type !== undefined)
            lessonUpdateData.video_type = updateData.video_type || 'youtube';
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
        if (updateData.attachments !== undefined) {
            if (updateData.attachments && updateData.attachments.length > 0) {
                lessonUpdateData.attachments = JSON.stringify(updateData.attachments);
            }
            else {
                lessonUpdateData.attachments = null;
            }
        }
        if (updateData.quiz_data !== undefined) {
            if (updateData.quiz_data && updateData.quiz_data.questions && updateData.quiz_data.questions.length > 0) {
                lessonUpdateData.quiz_data = JSON.stringify(updateData.quiz_data);
            }
            else {
                lessonUpdateData.quiz_data = null;
            }
        }
        if (updateData.notes !== undefined)
            lessonUpdateData.notes = updateData.notes || null;
        const lesson = await prisma.lesson.update({
            where: { id },
            data: lessonUpdateData
        });
        return res.json({
            message: 'Lesson updated successfully',
            lesson
        });
    }
    catch (error) {
        console.error('Admin update lesson error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
app.delete('/api/admin/lessons/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'Lesson ID is required' });
        }
        const existingLesson = await prisma.lesson.findUnique({
            where: { id }
        });
        if (!existingLesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }
        await prisma.lesson.delete({
            where: { id }
        });
        return res.json({
            message: 'Lesson deleted successfully'
        });
    }
    catch (error) {
        console.error('Admin delete lesson error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
app.get('/api/admin/service-centers', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { includeHidden, featured } = req.query;
        const centers = await prisma.serviceCenter.findMany({
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
    }
    catch (error) {
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
        let center = await prisma.serviceCenter.findUnique({
            where: { id },
            include: {
                equipments: true
            }
        });
        if (!center) {
            center = await prisma.serviceCenter.findUnique({
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
    }
    catch (error) {
        console.error('Admin service center fetch error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
app.post('/api/admin/service-centers', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, slug: slugInput, type, headline, description, image, banner_image, bannerImage, location, contact_phone, contactPhone, contact_email, contactEmail, lab_methodology, labMethodology, future_prospective, futureProspective, is_featured, isFeatured, is_published, isPublished, order_index, orderIndex, equipments, products, work_volume, company_activity, services, metrics } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Service center name is required' });
        }
        const finalSlug = slugify(slugInput || name);
        if (!finalSlug) {
            return res.status(400).json({ message: 'Unable to generate a valid slug for the service center' });
        }
        const existingCenter = await prisma.serviceCenter.findUnique({
            where: { slug: finalSlug }
        });
        if (existingCenter) {
            return res.status(400).json({ message: 'A service center with this slug already exists' });
        }
        const equipmentItems = parseEquipmentItems(equipments);
        const center = await prisma.serviceCenter.create({
            data: {
                name,
                slug: finalSlug,
                type: type || 'center',
                headline: headline ?? null,
                description: description ?? null,
                image: image ?? null,
                banner_image: (banner_image ?? bannerImage) || null,
                location: location ?? null,
                contact_phone: (contact_phone ?? contactPhone) || null,
                contact_email: (contact_email ?? contactEmail) || null,
                lab_methodology: (lab_methodology ?? labMethodology) || null,
                future_prospective: (future_prospective ?? futureProspective) || null,
                products: parseJsonValue(products, []),
                work_volume: parseJsonValue(work_volume, null),
                company_activity: parseJsonValue(company_activity, null),
                services: parseJsonValue(services, []),
                metrics: parseJsonValue(metrics, null),
                is_featured: parseBoolean(is_featured ?? isFeatured, false),
                is_published: parseBoolean(is_published ?? isPublished, true),
                order_index: parseNumber(order_index ?? orderIndex, 0)
            }
        });
        await syncServiceCenterEquipments(center.id, equipmentItems);
        const centerWithRelations = await prisma.serviceCenter.findUnique({
            where: { id: center.id },
            include: {
                equipments: true
            }
        });
        return res.json({
            message: 'Service center created successfully',
            center: centerWithRelations ? transformServiceCenter(centerWithRelations) : transformServiceCenter(center)
        });
    }
    catch (error) {
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
        const existingCenter = await prisma.serviceCenter.findUnique({
            where: { id }
        });
        if (!existingCenter) {
            return res.status(404).json({ message: 'Service center not found' });
        }
        const { name, slug: slugInput, type, headline, description, image, banner_image, bannerImage, location, contact_phone, contactPhone, contact_email, contactEmail, lab_methodology, labMethodology, future_prospective, futureProspective, is_featured, isFeatured, is_published, isPublished, order_index, orderIndex, equipments, products, work_volume, company_activity, services, metrics } = req.body;
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (type !== undefined)
            updateData.type = type;
        if (slugInput !== undefined) {
            const finalSlug = slugify(slugInput);
            if (!finalSlug) {
                return res.status(400).json({ message: 'Invalid slug provided' });
            }
            if (finalSlug !== existingCenter.slug) {
                const slugConflict = await prisma.serviceCenter.findUnique({
                    where: { slug: finalSlug }
                });
                if (slugConflict && slugConflict.id !== id) {
                    return res.status(400).json({ message: 'Another service center with this slug already exists' });
                }
            }
            updateData.slug = finalSlug;
        }
        if (headline !== undefined)
            updateData.headline = headline ?? null;
        if (description !== undefined)
            updateData.description = description ?? null;
        if (image !== undefined)
            updateData.image = image ?? null;
        const bannerValue = banner_image ?? bannerImage;
        if (bannerValue !== undefined)
            updateData.banner_image = bannerValue || null;
        if (location !== undefined)
            updateData.location = location ?? null;
        const phoneValue = contact_phone ?? contactPhone;
        if (phoneValue !== undefined)
            updateData.contact_phone = phoneValue || null;
        const emailValue = contact_email ?? contactEmail;
        if (emailValue !== undefined)
            updateData.contact_email = emailValue || null;
        const labMethodValue = lab_methodology ?? labMethodology;
        if (labMethodValue !== undefined)
            updateData.lab_methodology = labMethodValue || null;
        const futureValue = future_prospective ?? futureProspective;
        if (futureValue !== undefined)
            updateData.future_prospective = futureValue || null;
        const equipmentItems = equipments !== undefined ? parseEquipmentItems(equipments) : null;
        if (products !== undefined) {
            updateData.products = parseJsonValue(products, []);
        }
        if (work_volume !== undefined) {
            updateData.work_volume = parseJsonValue(work_volume, null);
        }
        if (company_activity !== undefined) {
            updateData.company_activity = parseJsonValue(company_activity, null);
        }
        if (services !== undefined) {
            updateData.services = parseJsonValue(services, []);
        }
        if (metrics !== undefined) {
            updateData.metrics = parseJsonValue(metrics, null);
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
        const center = await prisma.serviceCenter.update({
            where: { id },
            data: updateData
        });
        if (equipmentItems !== null) {
            await syncServiceCenterEquipments(center.id, equipmentItems);
        }
        const centerWithRelations = await prisma.serviceCenter.findUnique({
            where: { id },
            include: {
                equipments: true
            }
        });
        return res.json({
            message: 'Service center updated successfully',
            center: centerWithRelations ? transformServiceCenter(centerWithRelations) : transformServiceCenter(center)
        });
    }
    catch (error) {
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
        const existingCenter = await prisma.serviceCenter.findUnique({
            where: { id }
        });
        if (!existingCenter) {
            return res.status(404).json({ message: 'Service center not found' });
        }
        await prisma.serviceCenter.delete({
            where: { id }
        });
        return res.json({ message: 'Service center deleted successfully' });
    }
    catch (error) {
        console.error('Admin service center delete error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        });
    }
});
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});
if ((0, https_server_1.isHttpsEnabled)()) {
    const httpsServer = (0, https_server_1.createHttpsServer)(app, port);
    if (httpsServer) {
        console.log(`🚀 Server running on HTTPS port ${process.env.HTTPS_PORT || port}`);
        console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'https://localhost:3000'}`);
    }
    else {
        app.listen(port, () => {
            console.log(`🚀 Server running on HTTP port ${port} (HTTPS setup failed)`);
            console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
        });
    }
}
else {
    app.listen(port, () => {
        console.log(`🚀 Server running on HTTP port ${port}`);
        console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
}
console.log(`🔐 Auth endpoints ready: /api/auth/*`);
console.log(`🏢 Department endpoints ready: /api/departments, /api/department-sections`);
console.log(`🔧 Services endpoints ready: /api/services, /api/admin/services, /api/service-center-heads`);
console.log(`🏛️ Service Centers endpoints ready: /api/service-centers, /api/admin/service-centers`);
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await prisma.$disconnect();
    process.exit(0);
});
//# sourceMappingURL=server-auth.js.map