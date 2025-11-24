import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient ();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create users for each role
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@epri.edu' },
      update: {},
      create: {
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@epri.edu',
        password_hash: hashedPassword,
        role: 'ADMIN',
        is_verified: true,
        phone: '+201234567890'
      }
    }),
    prisma.user.upsert({
      where: { email: 'student@epri.edu' },
      update: {},
      create: {
        first_name: 'Ahmed',
        last_name: 'Mohamed',
        email: 'student@epri.edu',
        password_hash: hashedPassword,
        role: 'STUDENT',
        is_verified: true,
        phone: '+201234567891'
      }
    }),
    prisma.user.upsert({
      where: { email: 'researcher@epri.edu' },
      update: {},
      create: {
        first_name: 'Dr. Fatima',
        last_name: 'Ali',
        email: 'researcher@epri.edu',
        password_hash: hashedPassword,
        role: 'RESEARCHER',
        is_verified: true,
        phone: '+201234567892'
      }
    }),
    prisma.user.upsert({
      where: { email: 'instructor@epri.edu' },
      update: {},
      create: {
        first_name: 'Prof. Mohamed',
        last_name: 'Ibrahim',
        email: 'instructor@epri.edu',
        password_hash: hashedPassword,
        role: 'INSTRUCTOR',
        is_verified: true,
        phone: '+201234567893'
      }
    }),
    prisma.user.upsert({
      where: { email: 'guest@epri.edu' },
      update: {},
      create: {
        first_name: 'Guest',
        last_name: 'User',
        email: 'guest@epri.edu',
        password_hash: hashedPassword,
        role: 'GUEST',
        is_verified: false,
        phone: '+201234567894'
      }
    })
  ]);

  console.log('✅ Users created for all roles');
  console.log('   - Admin: admin@epri.edu');
  console.log('   - Student: student@epri.edu');
  console.log('   - Researcher: researcher@epri.edu');
  console.log('   - Instructor: instructor@epri.edu');
  console.log('   - Guest: guest@epri.edu');
  console.log('   All passwords: password123');

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { title: 'Petroleum Engineering' },
      update: {},
      create: {
        title: 'Petroleum Engineering',
        description: 'Advanced petroleum engineering techniques and technologies',
        color: '#3B82F6',
        icon: '⚙️'
      }
    }),
    prisma.category.upsert({
      where: { title: 'Geology & Geophysics' },
      update: {},
      create: {
        title: 'Geology & Geophysics',
        description: 'Geological and geophysical research methods',
        color: '#10B981',
        icon: '🌍'
      }
    }),
    prisma.category.upsert({
      where: { title: 'Environmental Studies' },
      update: {},
      create: {
        title: 'Environmental Studies',
        description: 'Environmental impact assessment and sustainability',
        color: '#059669',
        icon: '🌱'
      }
    }),
    prisma.category.upsert({
      where: { title: 'Research & Development' },
      update: {},
      create: {
        title: 'Research & Development',
        description: 'Cutting-edge research and development projects',
        color: '#8B5CF6',
        icon: '🔬'
      }
    })
  ]);

  console.log('✅ Categories created');

  // Create addresses
  const addresses = await Promise.all([
    prisma.address.upsert({
      where: { id: 'main-campus' },
      update: {},
      create: {
        id: 'main-campus',
        title: 'EPRI Main Campus',
        line_1: '1 Ahmed El-Zomor Street',
        line_2: 'Nasr City',
        city: 'Cairo',
        state: 'Cairo',
        country: 'Egypt',
        postal_code: '11765',
        map_link: 'https://maps.google.com/?q=EPRI+Cairo',
        latitude: 30.0444,
        longitude: 31.2357
      }
    }),
    prisma.address.upsert({
      where: { id: 'research-center' },
      update: {},
      create: {
        id: 'research-center',
        title: 'EPRI Research Center',
        line_1: '15 Research Avenue',
        line_2: 'New Administrative Capital',
        city: 'Cairo',
        state: 'Cairo',
        country: 'Egypt',
        postal_code: '11835',
        map_link: 'https://maps.google.com/?q=EPRI+Research+Center',
        latitude: 30.0281,
        longitude: 31.4999
      }
    })
  ]);

  console.log('✅ Addresses created');

  // Create speakers
  const speakers = await Promise.all([
    prisma.speaker.upsert({
      where: { id: 'dr-ahmed-hassan' },
      update: {},
      create: {
        id: 'dr-ahmed-hassan',
        name: 'Dr. Ahmed Hassan',
        title: 'Senior Petroleum Engineer',
        bio: 'Expert in reservoir engineering with 20+ years of experience in the oil and gas industry.',
        picture: '/speakers/dr-ahmed-hassan.jpg',
        topics: JSON.stringify(['Reservoir Engineering', 'Enhanced Oil Recovery', 'Well Testing']),
        expertise: 'Petroleum Engineering',
        institution: 'Egyptian Petroleum Research Institute',
        linkedin: 'https://linkedin.com/in/ahmed-hassan',
        twitter: 'https://twitter.com/ahmed_hassan'
      }
    }),
    prisma.speaker.upsert({
      where: { id: 'dr-fatima-mahmoud' },
      update: {},
      create: {
        id: 'dr-fatima-mahmoud',
        name: 'Dr. Fatima Mahmoud',
        title: 'Chief Geologist',
        bio: 'Leading expert in geological modeling and seismic interpretation.',
        picture: '/speakers/dr-fatima-mahmoud.jpg',
        topics: JSON.stringify(['Geological Modeling', 'Seismic Interpretation', 'Exploration Geology']),
        expertise: 'Geology & Geophysics',
        institution: 'Egyptian Petroleum Research Institute',
        linkedin: 'https://linkedin.com/in/fatima-mahmoud',
        twitter: 'https://twitter.com/fatima_mahmoud'
      }
    }),
    prisma.speaker.upsert({
      where: { id: 'dr-mohamed-ali' },
      update: {},
      create: {
        id: 'dr-mohamed-ali',
        name: 'Dr. Mohamed Ali',
        title: 'Environmental Consultant',
        bio: 'Specialist in environmental impact assessment and sustainable energy practices.',
        picture: '/speakers/dr-mohamed-ali.jpg',
        topics: JSON.stringify(['Environmental Impact Assessment', 'Sustainable Energy', 'Climate Change']),
        expertise: 'Environmental Studies',
        institution: 'Egyptian Petroleum Research Institute',
        linkedin: 'https://linkedin.com/in/mohamed-ali',
        twitter: 'https://twitter.com/mohamed_ali'
      }
    })
  ]);

  console.log('✅ Speakers created');

  // Create Department Sections
  const sections = await Promise.all([
    prisma.departmentSection.upsert({
      where: { slug: 'exploration' },
      update: {},
      create: { name: 'Exploration', slug: 'exploration', order_index: 1 }
    }),
    prisma.departmentSection.upsert({
      where: { slug: 'production' },
      update: {},
      create: { name: 'Production', slug: 'production', order_index: 2 }
    }),
    prisma.departmentSection.upsert({
      where: { slug: 'analysis-evaluation' },
      update: {},
      create: { name: 'Analysis & Evaluation', slug: 'analysis-evaluation', order_index: 3 }
    }),
    prisma.departmentSection.upsert({
      where: { slug: 'refining' },
      update: {},
      create: { name: 'Refining', slug: 'refining', order_index: 4 }
    }),
    prisma.departmentSection.upsert({
      where: { slug: 'petroleum-applications' },
      update: {},
      create: { name: 'Petroleum Applications', slug: 'petroleum-applications', order_index: 5 }
    }),
    prisma.departmentSection.upsert({
      where: { slug: 'petrochemicals' },
      update: {},
      create: { name: 'Petrochemicals', slug: 'petrochemicals', order_index: 6 }
    }),
    prisma.departmentSection.upsert({
      where: { slug: 'processes-design-develop' },
      update: {},
      create: { name: 'Processes Design & Develop', slug: 'processes-design-develop', order_index: 7 }
    })
  ]);

  console.log('✅ Department sections created');

  // Create comprehensive departments and assign to appropriate sections
  const departmentsData = [
    // Exploration Section
    {
      id: 'dept-sedimentology',
      name: 'Sedimentology Laboratory',
      description: 'Advanced sedimentological analysis and research facility specializing in sediment characterization, depositional environment interpretation, and reservoir quality assessment.',
      image: '/petroleum-lab-testing.jpg',
      icon: '🪨',
      section: 'exploration'
    },
    {
      id: 'dept-paleontology',
      name: 'Paleontology Laboratory',
      description: 'Specialized facility for micropaleontological and biostratigraphic analysis, providing age dating, paleoenvironmental interpretation, and correlation services for petroleum exploration.',
      image: '/petroleum-lab-testing.jpg',
      icon: '🦴',
      section: 'exploration'
    },
    {
      id: 'dept-geophysics',
      name: 'Geophysics Laboratory',
      description: 'Advanced geophysical research facility equipped with state-of-the-art instruments for seismic data processing, well log analysis, and geophysical modeling for petroleum exploration and reservoir characterization.',
      image: '/geophysical-survey.jpg',
      icon: '📊',
      section: 'exploration'
    },
    {
      id: 'dept-drilling',
      name: 'Drilling Engineering',
      description: 'Specialized in drilling fluid analysis, wellbore stability assessment, and drilling optimization for petroleum exploration and production.',
      image: '/drilling-engineering.jpg',
      icon: '⛏️',
      section: 'exploration'
    },
    // Production Section
    {
      id: 'dept-reservoir',
      name: 'Reservoir Engineering',
      description: 'Expertise in reservoir characterization, production optimization, and enhanced oil recovery techniques for maximizing hydrocarbon recovery.',
      image: '/reservoir-engineering.jpg',
      icon: '🛢️',
      section: 'production'
    },
    {
      id: 'dept-production',
      name: 'Production Technology',
      description: 'Advanced production engineering services including well completion design, production optimization, and artificial lift systems.',
      image: '/petroleum-lab-testing.jpg',
      icon: '⚙️',
      section: 'production'
    },
    // Analysis & Evaluation Section
    {
      id: 'dept-core-analysis',
      name: 'Core Analysis Laboratory',
      description: 'Comprehensive core analysis services including porosity, permeability, saturation, and petrophysical property measurements.',
      image: '/core-analysis-equipment.jpg',
      icon: '🔬',
      section: 'analysis-evaluation'
    },
    {
      id: 'dept-chemical-analysis',
      name: 'Chemical Analysis Laboratory',
      description: 'State-of-the-art equipment for chemical analysis, composition determination, and quality control of petroleum products.',
      image: '/petroleum-lab-testing.jpg',
      icon: '🧪',
      section: 'analysis-evaluation'
    },
    {
      id: 'dept-spectroscopy',
      name: 'Spectroscopy Laboratory',
      description: 'Advanced spectroscopic analysis using GC-MS, IR spectroscopy, and other analytical techniques for petroleum product characterization.',
      image: '/gc-ms-equipment.jpg',
      icon: '📡',
      section: 'analysis-evaluation'
    },
    {
      id: 'dept-corrosion',
      name: 'Corrosion Testing Laboratory',
      description: 'Specialized corrosion testing and evaluation services for materials used in petroleum production and refining operations.',
      image: '/corrosion-testing.jpg',
      icon: '⚗️',
      section: 'analysis-evaluation'
    },
    {
      id: 'dept-soil',
      name: 'Soil Analysis Laboratory',
      description: 'Complete facility for soil contamination assessment, environmental monitoring, and remediation evaluation.',
      image: '/soil-analysis-lab.jpg',
      icon: '🌍',
      section: 'analysis-evaluation'
    },
    {
      id: 'dept-mud',
      name: 'Mud Testing Laboratory',
      description: 'Complete facility for drilling fluid analysis and testing, including rheology measurements and filtration testing.',
      image: '/mud-testing-lab.jpg',
      icon: '🧪',
      section: 'analysis-evaluation'
    },
    // Refining Section
    {
      id: 'dept-refining',
      name: 'Refining Technology',
      description: 'Advanced refining processes, catalyst development, and optimization of petroleum refining operations for improved product quality and yield.',
      image: '/spectrophotometer-equipment.jpg',
      icon: '⚗️',
      section: 'refining'
    },
    {
      id: 'dept-distillation',
      name: 'Distillation & Separation',
      description: 'Specialized in distillation processes, separation technologies, and fractionation for petroleum refining.',
      image: '/petroleum-lab-testing.jpg',
      icon: '🔬',
      section: 'refining'
    },
    // Petroleum Applications Section
    {
      id: 'dept-applications',
      name: 'Petroleum Applications Research',
      description: 'Development and testing of petroleum-based products, lubricants, and specialty chemicals for various industrial applications.',
      image: '/petroleum-lab-testing.jpg',
      icon: '🔧',
      section: 'petroleum-applications'
    },
    {
      id: 'dept-lubricants',
      name: 'Lubricants Development',
      description: 'Research and development of advanced lubricants, greases, and specialty oils for automotive and industrial applications.',
      image: '/petroleum-lab-testing.jpg',
      icon: '⚙️',
      section: 'petroleum-applications'
    },
    // Petrochemicals Section
    {
      id: 'dept-petrochemicals',
      name: 'Petrochemicals Research',
      description: 'Research and development in petrochemical processes, polymer synthesis, and specialty chemical production from petroleum feedstocks.',
      image: '/petroleum-lab-testing.jpg',
      icon: '🧬',
      section: 'petrochemicals'
    },
    {
      id: 'dept-polymers',
      name: 'Polymers & Plastics',
      description: 'Advanced polymer research, plastic development, and materials engineering for various industrial and commercial applications.',
      image: '/petroleum-lab-testing.jpg',
      icon: '🔬',
      section: 'petrochemicals'
    },
    // Processes Design & Develop Section
    {
      id: 'dept-process-design',
      name: 'Process Design & Development',
      description: 'Engineering design and development of petroleum processing facilities, including feasibility studies and process optimization.',
      image: '/simulation-workstation.jpg',
      icon: '📐',
      section: 'processes-design-develop'
    },
    {
      id: 'dept-simulation',
      name: 'Process Simulation',
      description: 'Computer-aided process simulation, modeling, and optimization for petroleum and petrochemical operations.',
      image: '/simulation-workstation.jpg',
      icon: '💻',
      section: 'processes-design-develop'
    },
    {
      id: 'dept-environmental',
      name: 'Environmental Assessment',
      description: 'Environmental impact assessment, monitoring, and sustainable practices for petroleum operations.',
      image: '/environmental-assessment.jpg',
      icon: '🌱',
      section: 'processes-design-develop'
    }
  ];

  // Map section slugs to section IDs
  const sectionMap = new Map<string, string>();
  sections.forEach(section => {
    sectionMap.set(section.slug, section.id);
  });

  // Create departments
  const departments = await Promise.all(
    departmentsData.map(dept => 
      prisma.department.upsert({
        where: { id: dept.id },
        update: {
          name: dept.name,
          description: dept.description,
          image: dept.image,
          icon: dept.icon,
          section_id: sectionMap.get(dept.section) || null
        },
        create: {
          id: dept.id,
          name: dept.name,
          description: dept.description,
          image: dept.image,
          icon: dept.icon,
          section_id: sectionMap.get(dept.section) || null
        }
      })
    )
  );

  console.log(`✅ ${departments.length} departments created/updated`);

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@epri.edu' },
    update: {},
    create: {
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@epri.edu',
      password_hash: adminPassword,
      role: 'ADMIN',
      is_verified: true
    }
  });

  console.log('✅ Admin user created');

  // Create sample events
  const events = await Promise.all([
    prisma.event.upsert({
      where: { id: 'petroleum-conference-2024' },
      update: {},
      create: {
        id: 'petroleum-conference-2024',
        title: 'International Petroleum Engineering Conference 2024',
        description: 'Join us for the premier petroleum engineering conference featuring cutting-edge research and industry innovations.',
        start_date: new Date('2024-12-15T09:00:00Z'),
        end_date: new Date('2024-12-17T17:00:00Z'),
        price: 250.00,
        capacity: 300,
        status: 'PUBLISHED',
        featured: true,
        registration_open: true,
        address_id: addresses[0].id
      }
    }),
    prisma.event.upsert({
      where: { id: 'geology-workshop-2024' },
      update: {},
      create: {
        id: 'geology-workshop-2024',
        title: 'Advanced Geological Modeling Workshop',
        description: 'Hands-on workshop on modern geological modeling techniques and software applications.',
        start_date: new Date('2024-11-20T10:00:00Z'),
        end_date: new Date('2024-11-22T16:00:00Z'),
        price: 150.00,
        capacity: 50,
        status: 'PUBLISHED',
        featured: false,
        registration_open: true,
        address_id: addresses[1].id
      }
    }),
    prisma.event.upsert({
      where: { id: 'environmental-seminar-2024' },
      update: {},
      create: {
        id: 'environmental-seminar-2024',
        title: 'Environmental Impact Assessment Seminar',
        description: 'Comprehensive seminar on environmental impact assessment methodologies and best practices.',
        start_date: new Date('2024-10-25T14:00:00Z'),
        end_date: new Date('2024-10-25T18:00:00Z'),
        price: 75.00,
        capacity: 100,
        status: 'PUBLISHED',
        featured: false,
        registration_open: true,
        address_id: addresses[0].id
      }
    })
  ]);

  console.log('✅ Events created');

  // Connect events to categories
  await Promise.all([
    // Petroleum Conference - Petroleum Engineering & R&D
    prisma.eventCategory.createMany({
      data: [
        { event_id: events[0].id, category_id: categories[0].id },
        { event_id: events[0].id, category_id: categories[3].id }
      ],
      skipDuplicates: true
    }),
    // Geology Workshop - Geology & Geophysics
    prisma.eventCategory.createMany({
      data: [
        { event_id: events[1].id, category_id: categories[1].id }
      ],
      skipDuplicates: true
    }),
    // Environmental Seminar - Environmental Studies
    prisma.eventCategory.createMany({
      data: [
        { event_id: events[2].id, category_id: categories[2].id }
      ],
      skipDuplicates: true
    })
  ]);

  // Connect speakers to events
  await Promise.all([
    // Connect speakers to petroleum conference
    prisma.speaker.update({
      where: { id: speakers[0].id },
      data: {
        events: {
          connect: { id: events[0].id }
        }
      }
    }),
    // Connect speakers to geology workshop
    prisma.speaker.update({
      where: { id: speakers[1].id },
      data: {
        events: {
          connect: { id: events[1].id }
        }
      }
    }),
    // Connect speakers to environmental seminar
    prisma.speaker.update({
      where: { id: speakers[2].id },
      data: {
        events: {
          connect: { id: events[2].id }
        }
      }
    })
  ]);

  console.log('✅ Event relationships created');

  // Create comprehensive course seeds with different delivery types
  const coursesData = [
    {
      id: 'petroleum-fundamentals',
      title: 'Petroleum Engineering Fundamentals',
      subtitle: 'Introduction to Oil & Gas Industry',
      description: 'Comprehensive introduction to petroleum engineering principles, reservoir mechanics, drilling operations, and production optimization. This course covers the fundamental concepts every petroleum engineer should know.',
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop',
      instructor_id: users.find(u => u.role === 'INSTRUCTOR')?.id,
      instructor_name: 'Prof. Mohamed Ibrahim',
      category: 'Petroleum Engineering',
      price: 299.00,
      is_free: false,
      duration_hours: 40,
      duration_weeks: 8,
      level: 'BEGINNER',
      language: 'English',
      max_students: 100,
      is_published: true,
      is_featured: true,
      delivery_type: 'ONLINE',
      zoom_link: 'https://zoom.us/j/123456789',
      meeting_id: '123 456 789',
      meeting_passcode: 'EPRI2024',
      platform: 'Zoom',
      start_date: new Date('2024-12-01T09:00:00Z'),
      end_date: new Date('2025-02-28T17:00:00Z'),
      schedule_info: 'Every Tuesday and Thursday, 9:00 AM - 12:00 PM UTC',
      time_zone: 'UTC',
      objectives: JSON.stringify([
        'Understand fundamental petroleum engineering concepts',
        'Learn about reservoir characterization and evaluation',
        'Master drilling and completion techniques',
        'Analyze production optimization strategies',
        'Apply economic evaluation methods for petroleum projects'
      ]),
      requirements: JSON.stringify([
        'Basic engineering mathematics knowledge',
        'Fundamental understanding of geology',
        'Access to computer with internet connection',
        'No prior petroleum engineering experience required'
      ]),
      rating_average: 4.7,
      rating_count: 124,
      enrollment_count: 89
    },
    {
      id: 'advanced-geology',
      title: 'Advanced Geological Analysis & Interpretation',
      subtitle: 'Master Advanced Geological Techniques',
      description: 'Advanced course covering sophisticated geological analysis techniques, seismic interpretation, and structural geology for petroleum exploration. Includes hands-on training with industry-standard software.',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop',
      instructor_id: users.find(u => u.role === 'RESEARCHER')?.id,
      instructor_name: 'Dr. Fatima Ali',
      category: 'Geology & Geophysics',
      price: 499.00,
      is_free: false,
      duration_hours: 60,
      duration_weeks: 10,
      level: 'ADVANCED',
      language: 'English',
      max_students: 30,
      is_published: true,
      is_featured: true,
      delivery_type: 'HYBRID',
      meeting_location: 'EPRI Main Campus - Geology Building',
      room_number: 'Room 201',
      building: 'Geology Building',
      address: '1 Ahmed El-Zomor Street, El Zohour Region, Nasr city, Cairo, Egypt',
      zoom_link: 'https://teams.microsoft.com/l/meetup-join/19%3ameeting',
      meeting_id: 'ADV-GEO-2024',
      meeting_passcode: 'Geology2024',
      platform: 'Microsoft Teams',
      start_date: new Date('2024-12-15T08:00:00Z'),
      end_date: new Date('2025-03-15T18:00:00Z'),
      schedule_info: 'Week 1-5: Online sessions (Mon & Wed 8:00-11:00 AM), Week 6-10: On-campus labs (Fri 9:00-17:00)',
      time_zone: 'Africa/Cairo',
      objectives: JSON.stringify([
        'Master advanced seismic interpretation techniques',
        'Perform complex structural geology analysis',
        'Use industry-standard geological software',
        'Integrate geological and geophysical data',
        'Develop prospect evaluation skills'
      ]),
      requirements: JSON.stringify([
        'Bachelor degree in Geology or related field',
        'Minimum 2 years of geological experience',
        'Basic knowledge of seismic interpretation',
        'Laptop with Windows 10 or higher',
        'Access to geological software (provided during course)'
      ]),
      rating_average: 4.9,
      rating_count: 67,
      enrollment_count: 28
    },
    {
      id: 'reservoir-simulation',
      title: 'Reservoir Simulation & Modeling',
      subtitle: 'Advanced Reservoir Engineering Techniques',
      description: 'Comprehensive course on reservoir simulation using industry-standard software. Learn to build, history match, and forecast reservoir performance using advanced simulation techniques.',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop',
      instructor_id: users.find(u => u.role === 'INSTRUCTOR')?.id,
      instructor_name: 'Prof. Mohamed Ibrahim',
      category: 'Reservoir Engineering',
      price: 699.00,
      is_free: false,
      duration_hours: 80,
      duration_weeks: 12,
      level: 'ADVANCED',
      language: 'English',
      max_students: 25,
      is_published: true,
      is_featured: true,
      delivery_type: 'OFFLINE',
      meeting_location: 'EPRI Research Center - Simulation Lab',
      room_number: 'Lab 105',
      building: 'Research Center Building B',
      address: '15 Research Avenue, New Administrative Capital, Cairo, Egypt',
      start_date: new Date('2025-01-15T09:00:00Z'),
      end_date: new Date('2025-04-15T17:00:00Z'),
      schedule_info: 'Monday to Wednesday, 9:00 AM - 1:00 PM, with additional lab sessions on Fridays',
      time_zone: 'Africa/Cairo',
      objectives: JSON.stringify([
        'Build complex reservoir simulation models',
        'Perform history matching and uncertainty analysis',
        'Master enhanced oil recovery simulation',
        'Optimize production strategies using simulation',
        'Integrate geological and engineering data'
      ]),
      requirements: JSON.stringify([
        'Masters degree in Petroleum Engineering or equivalent',
        'Minimum 5 years of reservoir engineering experience',
        'Experience with reservoir engineering software',
        'Strong background in mathematics and statistics',
        'Must attend all on-campus sessions'
      ]),
      rating_average: 4.8,
      rating_count: 43,
      enrollment_count: 24
    },
    {
      id: 'environmental-petroleum',
      title: 'Environmental Management in Petroleum Operations',
      subtitle: 'Sustainable Practices for Oil & Gas Industry',
      description: 'Learn about environmental regulations, impact assessment, and sustainable practices in petroleum operations. Covers both theoretical concepts and practical case studies.',
      image: 'https://images.unsplash.com/photo-1574263867128-cddc47ba885e?w=800&h=600&fit=crop',
      instructor_id: users.find(u => u.role === 'RESEARCHER')?.id,
      instructor_name: 'Dr. Fatima Ali',
      category: 'Environmental Studies',
      price: 399.00,
      is_free: false,
      duration_hours: 45,
      duration_weeks: 9,
      level: 'INTERMEDIATE',
      language: 'English',
      max_students: 50,
      is_published: true,
      is_featured: false,
      delivery_type: 'ONLINE',
      zoom_link: 'https://webex.cisco.com/meet/environment2024',
      meeting_id: 'ENV-PET-2024',
      meeting_passcode: 'Environment24',
      platform: 'Cisco Webex',
      start_date: new Date('2024-12-20T14:00:00Z'),
      end_date: new Date('2025-02-20T16:00:00Z'),
      schedule_info: 'Every Monday and Thursday, 2:00 PM - 4:30 PM UTC',
      time_zone: 'UTC',
      objectives: JSON.stringify([
        'Understand environmental regulations in petroleum industry',
        'Conduct environmental impact assessments',
        'Develop environmental management plans',
        'Implement sustainable practices in operations',
        'Manage environmental compliance and reporting'
      ]),
      requirements: JSON.stringify([
        'Bachelor degree in Engineering or Environmental Science',
        'Basic understanding of petroleum operations',
        'No prior environmental management experience required',
        'Reliable internet connection for online sessions'
      ]),
      rating_average: 4.5,
      rating_count: 92,
      enrollment_count: 47
    },
    {
      id: 'drilling-optimization',
      title: 'Drilling Engineering & Optimization',
      subtitle: 'Advanced Drilling Techniques and Best Practices',
      description: 'Comprehensive drilling engineering course covering well design, drilling fluid optimization, directional drilling, and wellbore stability. Includes practical drilling simulations.',
      image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=600&fit=crop',
      instructor_id: users.find(u => u.role === 'INSTRUCTOR')?.id,
      instructor_name: 'Prof. Mohamed Ibrahim',
      category: 'Drilling Engineering',
      price: 599.00,
      is_free: false,
      duration_hours: 70,
      duration_weeks: 10,
      level: 'INTERMEDIATE',
      language: 'English',
      max_students: 35,
      is_published: true,
      is_featured: true,
      delivery_type: 'HYBRID',
      meeting_location: 'EPRI Main Campus - Drilling Lab',
      room_number: 'Lab 301',
      building: 'Engineering Building',
      address: '1 Ahmed El-Zomor Street, El Zohour Region, Nasr city, Cairo, Egypt',
      zoom_link: 'https://zoom.us/j/987654321',
      meeting_id: '987 654 321',
      meeting_passcode: 'Drilling24',
      platform: 'Zoom',
      start_date: new Date('2025-01-10T08:00:00Z'),
      end_date: new Date('2025-03-20T17:00:00Z'),
      schedule_info: 'Weeks 1-6: Online theory (Tue & Thu 8:00-11:00 AM), Weeks 7-10: Hands-on labs (Sat 9:00-17:00)',
      time_zone: 'Africa/Cairo',
      objectives: JSON.stringify([
        'Design optimal drilling programs',
        'Optimize drilling fluid properties',
        'Plan and execute directional drilling',
        'Analyze wellbore stability issues',
        'Troubleshoot drilling problems'
      ]),
      requirements: JSON.stringify([
        'Bachelor degree in Petroleum or Mechanical Engineering',
        'Basic knowledge of drilling operations',
        'Experience with engineering calculations',
        'Must attend all laboratory sessions',
        'Safety training completion required'
      ]),
      rating_average: 4.6,
      rating_count: 78,
      enrollment_count: 33
    },
    {
      id: 'petroleum-economics',
      title: 'Petroleum Economics & Project Evaluation',
      subtitle: 'Financial Analysis for Oil & Gas Projects',
      description: 'Learn economic evaluation techniques for petroleum projects including risk analysis, investment decisions, and portfolio optimization. Essential for project managers and economists.',
      image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&h=600&fit=crop',
      instructor_id: users.find(u => u.role === 'ADMIN')?.id,
      instructor_name: 'Admin User',
      category: 'Economics & Finance',
      price: 449.00,
      is_free: false,
      duration_hours: 50,
      duration_weeks: 8,
      level: 'INTERMEDIATE',
      language: 'English',
      max_students: 40,
      is_published: true,
      is_featured: false,
      delivery_type: 'ONLINE',
      zoom_link: 'https://meet.google.com/abc-defg-hij',
      meeting_id: 'PET-ECON-2024',
      meeting_passcode: 'Economics24',
      platform: 'Google Meet',
      start_date: new Date('2025-02-01T10:00:00Z'),
      end_date: new Date('2025-03-30T12:00:00Z'),
      schedule_info: 'Every Tuesday, Wednesday, and Friday, 10:00 AM - 12:30 PM UTC',
      time_zone: 'UTC',
      objectives: JSON.stringify([
        'Master petroleum project economics',
        'Perform risk and sensitivity analysis',
        'Evaluate investment opportunities',
        'Understand fiscal systems and contracts',
        'Optimize project portfolios'
      ]),
      requirements: JSON.stringify([
        'Bachelor degree in Engineering, Economics, or Finance',
        'Basic understanding of petroleum industry',
        'Familiarity with Excel or similar spreadsheet software',
        'Calculator for financial calculations'
      ]),
      rating_average: 4.4,
      rating_count: 56,
      enrollment_count: 38
    },
    {
      id: 'introduction-geophysics',
      title: 'Introduction to Petroleum Geophysics',
      subtitle: 'Fundamentals of Seismic Exploration',
      description: 'Beginner-friendly introduction to geophysical methods used in petroleum exploration. Covers seismic data acquisition, processing, and basic interpretation techniques.',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop',
      instructor_id: users.find(u => u.role === 'RESEARCHER')?.id,
      instructor_name: 'Dr. Fatima Ali',
      category: 'Geology & Geophysics',
      price: 0.00,
      is_free: true,
      duration_hours: 25,
      duration_weeks: 5,
      level: 'BEGINNER',
      language: 'English',
      max_students: 150,
      is_published: true,
      is_featured: true,
      delivery_type: 'ONLINE',
      zoom_link: 'https://zoom.us/j/555666777',
      meeting_id: '555 666 777',
      meeting_passcode: 'GeoFree24',
      platform: 'Zoom',
      start_date: new Date('2024-11-25T15:00:00Z'),
      end_date: new Date('2024-12-30T17:00:00Z'),
      schedule_info: 'Every Monday and Wednesday, 3:00 PM - 5:30 PM UTC',
      time_zone: 'UTC',
      objectives: JSON.stringify([
        'Understand basic geophysical principles',
        'Learn seismic data acquisition methods',
        'Interpret basic seismic sections',
        'Recognize geological features in seismic data',
        'Apply geophysics in petroleum exploration'
      ]),
      requirements: JSON.stringify([
        'High school diploma or equivalent',
        'Basic understanding of physics and mathematics',
        'Interest in earth sciences',
        'No prior geophysics experience required'
      ]),
      rating_average: 4.3,
      rating_count: 203,
      enrollment_count: 142
    },
    {
      id: 'production-engineering',
      title: 'Production Engineering & Well Optimization',
      subtitle: 'Maximize Well Performance and Recovery',
      description: 'Advanced production engineering course covering well completion design, artificial lift systems, production optimization, and enhanced oil recovery techniques.',
      image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=600&fit=crop',
      instructor_id: users.find(u => u.role === 'INSTRUCTOR')?.id,
      instructor_name: 'Prof. Mohamed Ibrahim',
      category: 'Production Engineering',
      price: 549.00,
      is_free: false,
      duration_hours: 65,
      duration_weeks: 11,
      level: 'ADVANCED',
      language: 'English',
      max_students: 30,
      is_published: true,
      is_featured: false,
      delivery_type: 'OFFLINE',
      meeting_location: 'EPRI Research Center - Production Lab',
      room_number: 'Lab 203',
      building: 'Production Engineering Building',
      address: '15 Research Avenue, New Administrative Capital, Cairo, Egypt',
      start_date: new Date('2025-02-15T09:00:00Z'),
      end_date: new Date('2025-05-10T16:00:00Z'),
      schedule_info: 'Monday, Wednesday, Friday 9:00 AM - 1:00 PM, with field trips on selected Saturdays',
      time_zone: 'Africa/Cairo',
      objectives: JSON.stringify([
        'Design optimal well completion systems',
        'Select and optimize artificial lift methods',
        'Analyze well performance and decline curves',
        'Implement enhanced oil recovery techniques',
        'Manage production operations efficiently'
      ]),
      requirements: JSON.stringify([
        'Masters degree in Petroleum Engineering',
        'Minimum 3 years of production experience',
        'Knowledge of reservoir engineering principles',
        'Must attend all laboratory and field sessions',
        'Valid safety certification required'
      ]),
      rating_average: 4.7,
      rating_count: 39,
      enrollment_count: 29
    }
  ];

  // Create courses with comprehensive data
  const courses = await Promise.all(
    coursesData.map(courseData =>
      prisma.course.upsert({
        where: { id: courseData.id },
        update: {
          title: courseData.title,
          description: courseData.description,
          instructor_id: courseData.instructor_id || null,
          price: courseData.price,
          duration_hours: courseData.duration_hours,
          level: courseData.level,
          language: courseData.language,
          max_students: courseData.max_students,
          is_published: courseData.is_published,
          start_date: courseData.start_date,
          end_date: courseData.end_date
        },
        create: {
          id: courseData.id,
          title: courseData.title,
          description: courseData.description,
          instructor_id: courseData.instructor_id || null,
          price: courseData.price,
          duration_hours: courseData.duration_hours,
          level: courseData.level,
          language: courseData.language,
          max_students: courseData.max_students,
          is_published: courseData.is_published,
          start_date: courseData.start_date,
          end_date: courseData.end_date
        }
      })
    )
  );

  console.log(`✅ ${courses.length} courses created with comprehensive data:`);
  console.log(`   - Online courses: ${coursesData.filter(c => c.delivery_type === 'ONLINE').length}`);
  console.log(`   - Offline courses: ${coursesData.filter(c => c.delivery_type === 'OFFLINE').length}`);
  console.log(`   - Hybrid courses: ${coursesData.filter(c => c.delivery_type === 'HYBRID').length}`);
  console.log(`   - Free courses: ${coursesData.filter(c => c.is_free).length}`);
  console.log(`   - Featured courses: ${coursesData.filter(c => c.is_featured).length}`);

  // Create comprehensive lessons for courses
  const lessonsData = [
    // Petroleum Fundamentals Course Lessons
    {
      course_id: 'petroleum-fundamentals',
      id: 'pf-lesson-1',
      title: 'Introduction to Petroleum Engineering',
      description: 'Overview of petroleum engineering discipline, industry structure, and career opportunities',
      order_index: 1,
      duration_minutes: 45,
      type: 'video',
      video_type: 'youtube',
      video_id: 'dQw4w9WgXcQ',
      is_preview: true,
      content: JSON.stringify({
        learning_objectives: [
          'Understand the role of petroleum engineers',
          'Learn about oil and gas industry structure',
          'Explore career opportunities in petroleum engineering'
        ],
        key_topics: [
          'History of petroleum industry',
          'Types of petroleum engineers',
          'Industry value chain',
          'Current challenges and opportunities'
        ]
      }),
      notes: 'This introductory lesson provides a comprehensive overview of petroleum engineering and sets the foundation for the entire course.',
      attachments: JSON.stringify([
        { name: 'Course Syllabus', url: '/attachments/pf-syllabus.pdf', type: 'pdf' },
        { name: 'Industry Overview Slides', url: '/attachments/pf-industry-overview.pptx', type: 'powerpoint' }
      ])
    },
    {
      course_id: 'petroleum-fundamentals',
      id: 'pf-lesson-2',
      title: 'Geology for Petroleum Engineers',
      description: 'Essential geological concepts for understanding hydrocarbon formation and accumulation',
      order_index: 2,
      duration_minutes: 60,
      type: 'video',
      video_type: 'vimeo',
      video_id: '123456789',
      is_preview: false,
      content: JSON.stringify({
        learning_objectives: [
          'Understand rock types and their properties',
          'Learn about sedimentary environments',
          'Understand structural geology basics'
        ],
        key_topics: [
          'Rock cycle and rock types',
          'Sedimentary environments',
          'Structural geology',
          'Geological time scale'
        ]
      }),
      notes: 'Fundamental geological concepts that every petroleum engineer should understand for effective reservoir analysis.',
      attachments: JSON.stringify([
        { name: 'Geological Maps', url: '/attachments/pf-geo-maps.pdf', type: 'pdf' },
        { name: 'Rock Samples Images', url: '/attachments/pf-rock-samples.zip', type: 'archive' }
      ])
    },
    {
      course_id: 'petroleum-fundamentals',
      id: 'pf-lesson-3',
      title: 'Hydrocarbon Formation and Migration',
      description: 'Understanding how oil and gas are formed and migrate through rock formations',
      order_index: 3,
      duration_minutes: 50,
      type: 'video',
      video_type: 'direct',
      video_url: 'https://epri-media.s3.amazonaws.com/courses/hydrocarbon-formation.mp4',
      is_preview: false,
      content: JSON.stringify({
        learning_objectives: [
          'Understand hydrocarbon generation process',
          'Learn about primary and secondary migration',
          'Understand trapping mechanisms'
        ],
        key_topics: [
          'Organic matter and kerogen',
          'Thermal maturation',
          'Primary and secondary migration',
          'Trapping and accumulation'
        ]
      }),
      notes: 'Critical concepts for understanding where and why hydrocarbons accumulate in the subsurface.',
      attachments: JSON.stringify([
        { name: 'Migration Diagrams', url: '/attachments/pf-migration-diagrams.pdf', type: 'pdf' }
      ])
    },
    {
      course_id: 'petroleum-fundamentals',
      id: 'pf-lesson-4',
      title: 'Reservoir Rocks and Properties',
      description: 'Understanding reservoir rock properties that control hydrocarbon storage and flow',
      order_index: 4,
      duration_minutes: 55,
      type: 'video',
      video_type: 'youtube',
      video_id: 'reservoir123',
      is_preview: false,
      content: JSON.stringify({
        learning_objectives: [
          'Understand porosity and permeability concepts',
          'Learn about reservoir rock types',
          'Understand factors affecting reservoir quality'
        ],
        key_topics: [
          'Porosity types and measurement',
          'Permeability and its controls',
          'Reservoir rock types',
          'Rock-fluid interactions'
        ]
      }),
      quiz_data: JSON.stringify({
        questions: [
          {
            id: 'q1',
            question: 'What is the most important property for hydrocarbon storage?',
            type: 'multiple-choice',
            options: ['Porosity', 'Permeability', 'Density', 'Hardness'],
            correct_answer: 0
          },
          {
            id: 'q2',
            question: 'Which rock type typically makes the best reservoir?',
            type: 'multiple-choice',
            options: ['Shale', 'Sandstone', 'Granite', 'Slate'],
            correct_answer: 1
          }
        ]
      })
    },
    {
      course_id: 'petroleum-fundamentals',
      id: 'pf-lesson-5',
      title: 'Live Q&A: Fundamentals Review',
      description: 'Interactive session reviewing fundamental concepts with instructor',
      order_index: 5,
      duration_minutes: 90,
      type: 'live_session',
      is_recorded: true,
      live_session_url: 'https://zoom.us/j/123456789',
      session_date: '2024-12-08T09:00:00Z',
      video_type: 'zoom_recording',
      video_url: 'https://epri-recordings.com/pf-qa-session-1',
      content: JSON.stringify({
        learning_objectives: [
          'Clarify fundamental concepts',
          'Address student questions',
          'Reinforce key learning points'
        ],
        session_format: 'Interactive Q&A with polls and breakout discussions'
      })
    },
    // Advanced Geology Course Lessons
    {
      course_id: 'advanced-geology',
      id: 'ag-lesson-1',
      title: 'Advanced Seismic Interpretation Techniques',
      description: 'Master advanced seismic interpretation methods and software applications',
      order_index: 1,
      duration_minutes: 75,
      type: 'video',
      video_type: 'direct',
      video_url: 'https://epri-media.s3.amazonaws.com/courses/advanced-seismic.mp4',
      is_preview: true,
      content: JSON.stringify({
        learning_objectives: [
          'Master advanced seismic attributes',
          'Learn horizon picking techniques',
          'Understand velocity modeling'
        ],
        software_used: ['Petrel', 'Kingdom Suite', 'OpendTect'],
        key_topics: [
          'Seismic attributes and their applications',
          'Horizon interpretation workflows',
          'Velocity model building',
          'Structural interpretation techniques'
        ]
      }),
      attachments: JSON.stringify([
        { name: 'Seismic Data Exercise', url: '/attachments/ag-seismic-data.segy', type: 'data' },
        { name: 'Interpretation Guidelines', url: '/attachments/ag-interpretation-guide.pdf', type: 'pdf' }
      ])
    },
    {
      course_id: 'advanced-geology',
      id: 'ag-lesson-2',
      title: 'Structural Geology in Petroleum Exploration',
      description: 'Advanced structural analysis techniques for petroleum exploration',
      order_index: 2,
      duration_minutes: 80,
      type: 'video',
      video_type: 'vimeo',
      video_id: 'struct456',
      is_preview: false,
      content: JSON.stringify({
        learning_objectives: [
          'Understand complex structural geometries',
          'Learn fault analysis techniques',
          'Master fold interpretation methods'
        ],
        key_topics: [
          'Fault systems and their controls',
          'Fold mechanisms and styles',
          'Structural traps and their exploration',
          'Kinematic analysis methods'
        ]
      }),
      attachments: JSON.stringify([
        { name: 'Structural Maps', url: '/attachments/ag-structural-maps.pdf', type: 'pdf' },
        { name: 'Cross-Section Templates', url: '/attachments/ag-cross-sections.dwg', type: 'cad' }
      ])
    },
    // Reservoir Simulation Course Lessons
    {
      course_id: 'reservoir-simulation',
      id: 'rs-lesson-1',
      title: 'Reservoir Simulation Fundamentals',
      description: 'Introduction to reservoir simulation concepts and mathematical foundations',
      order_index: 1,
      duration_minutes: 90,
      type: 'video',
      video_type: 'direct',
      video_url: 'https://epri-media.s3.amazonaws.com/courses/sim-fundamentals.mp4',
      is_preview: true,
      content: JSON.stringify({
        learning_objectives: [
          'Understand simulation workflow',
          'Learn about grid systems',
          'Understand flow equations'
        ],
        software_used: ['Eclipse', 'CMG STARS', 'INTERSECT'],
        key_topics: [
          'Reservoir simulation workflow',
          'Grid construction and refinement',
          'Fluid flow equations',
          'Numerical methods overview'
        ]
      }),
      attachments: JSON.stringify([
        { name: 'Simulation Workflow Diagram', url: '/attachments/rs-workflow.pdf', type: 'pdf' },
        { name: 'Grid Construction Tutorial', url: '/attachments/rs-grid-tutorial.pdf', type: 'pdf' }
      ])
    },
    {
      course_id: 'reservoir-simulation',
      id: 'rs-lesson-2',
      title: 'History Matching Techniques',
      description: 'Advanced history matching methods and uncertainty quantification',
      order_index: 2,
      duration_minutes: 120,
      type: 'video',
      video_type: 'youtube',
      video_id: 'history789',
      is_preview: false,
      content: JSON.stringify({
        learning_objectives: [
          'Master history matching workflow',
          'Learn parameter estimation methods',
          'Understand uncertainty quantification'
        ],
        key_topics: [
          'History matching objectives',
          'Parameter sensitivity analysis',
          'Automated history matching',
          'Uncertainty workflows'
        ]
      }),
      quiz_data: JSON.stringify({
        questions: [
          {
            id: 'q1',
            question: 'What is the primary goal of history matching?',
            type: 'multiple-choice',
            options: [
              'Increase production',
              'Match observed field performance',
              'Reduce simulation time',
              'Simplify the model'
            ],
            correct_answer: 1
          }
        ]
      })
    },
    // Environmental Management Course Lessons
    {
      course_id: 'environmental-petroleum',
      id: 'ep-lesson-1',
      title: 'Environmental Regulations in Petroleum Industry',
      description: 'Comprehensive overview of environmental regulations affecting petroleum operations',
      order_index: 1,
      duration_minutes: 60,
      type: 'video',
      video_type: 'youtube',
      video_id: 'envregs123',
      is_preview: true,
      content: JSON.stringify({
        learning_objectives: [
          'Understand key environmental regulations',
          'Learn compliance requirements',
          'Understand penalty structures'
        ],
        key_topics: [
          'International environmental standards',
          'National regulatory frameworks',
          'Compliance monitoring requirements',
          'Penalty and enforcement mechanisms'
        ]
      }),
      attachments: JSON.stringify([
        { name: 'Regulatory Framework Summary', url: '/attachments/ep-regulations.pdf', type: 'pdf' },
        { name: 'Compliance Checklist', url: '/attachments/ep-compliance-checklist.xlsx', type: 'excel' }
      ])
    },
    {
      course_id: 'environmental-petroleum',
      id: 'ep-lesson-2',
      title: 'Environmental Impact Assessment Methods',
      description: 'Learn systematic approaches to conducting environmental impact assessments',
      order_index: 2,
      duration_minutes: 75,
      type: 'video',
      video_type: 'vimeo',
      video_id: 'eia456',
      is_preview: false,
      content: JSON.stringify({
        learning_objectives: [
          'Master EIA methodology',
          'Learn impact prediction techniques',
          'Understand mitigation planning'
        ],
        key_topics: [
          'EIA process and stages',
          'Baseline studies design',
          'Impact prediction methods',
          'Mitigation hierarchy'
        ]
      })
    },
    {
      course_id: 'environmental-petroleum',
      id: 'ep-lesson-3',
      title: 'Case Study: Offshore Oil Spill Response',
      description: 'Real-world case study of environmental emergency response and remediation',
      order_index: 3,
      duration_minutes: 90,
      type: 'article',
      content: JSON.stringify({
        learning_objectives: [
          'Analyze real spill response strategies',
          'Understand emergency response protocols',
          'Learn remediation effectiveness assessment'
        ],
        case_study: 'Detailed analysis of major offshore oil spill incident',
        key_lessons: [
          'Importance of preparedness',
          'Multi-stakeholder coordination',
          'Long-term monitoring requirements',
          'Lessons learned and improvements'
        ]
      }),
      article_content: 'This comprehensive case study examines the response to a major offshore oil spill, analyzing the technical, environmental, and social aspects of the incident...',
      attachments: JSON.stringify([
        { name: 'Case Study Full Report', url: '/attachments/ep-case-study.pdf', type: 'pdf' },
        { name: 'Response Timeline', url: '/attachments/ep-timeline.pdf', type: 'pdf' }
      ])
    },
    // Drilling Optimization Course Lessons
    {
      course_id: 'drilling-optimization',
      id: 'do-lesson-1',
      title: 'Well Design Fundamentals',
      description: 'Comprehensive well design principles and optimization strategies',
      order_index: 1,
      duration_minutes: 85,
      type: 'video',
      video_type: 'direct',
      video_url: 'https://epri-media.s3.amazonaws.com/courses/well-design.mp4',
      is_preview: true,
      content: JSON.stringify({
        learning_objectives: [
          'Master well design principles',
          'Learn trajectory optimization',
          'Understand casing program design'
        ],
        software_used: ['Landmark WellPlan', 'Halliburton COMPASS', 'Baker Hughes WellLink'],
        key_topics: [
          'Well trajectory design',
          'Casing program optimization',
          'Drilling fluid selection',
          'BHA design considerations'
        ]
      })
    },
    {
      course_id: 'drilling-optimization',
      id: 'do-lesson-2',
      title: 'Drilling Fluid Optimization Laboratory',
      description: 'Hands-on laboratory session for drilling fluid testing and optimization',
      order_index: 2,
      duration_minutes: 180,
      type: 'live_session',
      is_recorded: true,
      live_session_url: 'https://zoom.us/j/drilling-lab',
      session_date: '2025-01-25T08:00:00Z',
      video_type: 'zoom_recording',
      video_url: 'https://epri-recordings.com/do-lab-session',
      content: JSON.stringify({
        learning_objectives: [
          'Conduct mud testing procedures',
          'Optimize fluid properties',
          'Troubleshoot fluid problems'
        ],
        lab_equipment: [
          'Rheometer',
          'Mud balance',
          'Filter press',
          'HPHT aging cell'
        ],
        activities: [
          'Rheology measurements',
          'Filtration testing',
          'Contamination simulation',
          'Additive optimization'
        ]
      })
    },
    // Introduction to Geophysics Course Lessons (Free Course)
    {
      course_id: 'introduction-geophysics',
      id: 'ig-lesson-1',
      title: 'What is Geophysics?',
      description: 'Introduction to geophysical methods and their applications in petroleum exploration',
      order_index: 1,
      duration_minutes: 30,
      type: 'video',
      video_type: 'youtube',
      video_id: 'geophys101',
      is_preview: true,
      content: JSON.stringify({
        learning_objectives: [
          'Understand geophysics definition',
          'Learn about different geophysical methods',
          'Understand applications in petroleum industry'
        ],
        key_topics: [
          'Geophysics overview',
          'Seismic methods',
          'Gravity and magnetic methods',
          'Electrical methods'
        ]
      }),
      notes: 'This is a beginner-friendly introduction suitable for students with no prior geophysics background.'
    },
    {
      course_id: 'introduction-geophysics',
      id: 'ig-lesson-2',
      title: 'Seismic Waves and Wave Propagation',
      description: 'Understanding seismic wave types and how they travel through the Earth',
      order_index: 2,
      duration_minutes: 40,
      type: 'video',
      video_type: 'vimeo',
      video_id: 'waves123',
      is_preview: false,
      content: JSON.stringify({
        learning_objectives: [
          'Understand wave types',
          'Learn wave propagation principles',
          'Understand velocity variations'
        ],
        key_topics: [
          'P-waves and S-waves',
          'Wave propagation physics',
          'Velocity and density relationships',
          'Reflection and refraction'
        ]
      }),
      quiz_data: JSON.stringify({
        questions: [
          {
            id: 'q1',
            question: 'Which seismic wave type travels fastest?',
            type: 'multiple-choice',
            options: ['P-wave', 'S-wave', 'Surface wave', 'Love wave'],
            correct_answer: 0
          }
        ]
      })
    },
    {
      course_id: 'introduction-geophysics',
      id: 'ig-lesson-3',
      title: 'Basic Seismic Interpretation',
      description: 'Learn to identify basic geological features in seismic data',
      order_index: 3,
      duration_minutes: 45,
      type: 'video',
      video_type: 'direct',
      video_url: 'https://epri-media.s3.amazonaws.com/courses/basic-interpretation.mp4',
      is_preview: false,
      content: JSON.stringify({
        learning_objectives: [
          'Identify basic seismic features',
          'Understand reflection patterns',
          'Learn about seismic facies'
        ],
        key_topics: [
          'Reflection character',
          'Seismic facies analysis',
          'Structural features identification',
          'Stratigraphic interpretation basics'
        ]
      }),
      attachments: JSON.stringify([
        { name: 'Sample Seismic Section', url: '/attachments/ig-seismic-sample.pdf', type: 'pdf' },
        { name: 'Interpretation Exercise', url: '/attachments/ig-exercise.pdf', type: 'pdf' }
      ])
    }
  ];

  // Create lessons for courses
  for (const lessonData of lessonsData) {
    await prisma.lesson.upsert({
      where: { id: lessonData.id },
      update: {
        title: lessonData.title,
        description: lessonData.description,
        order_index: lessonData.order_index,
        duration: lessonData.duration_minutes,
        video_type: lessonData.video_type || 'youtube',
        video_id: lessonData.video_id || null,
        video_url: lessonData.video_url || null,
        is_preview: lessonData.is_preview || false,
        content: lessonData.content || null,
        notes: lessonData.notes || null,
        attachments: lessonData.attachments ? JSON.parse(lessonData.attachments) : null,
        quiz_data: lessonData.quiz_data ? JSON.parse(lessonData.quiz_data) : null,
        course_id: lessonData.course_id
      },
      create: {
        id: lessonData.id,
        title: lessonData.title,
        description: lessonData.description,
        order_index: lessonData.order_index,
        duration: lessonData.duration_minutes,
        video_type: lessonData.video_type || 'youtube',
        video_id: lessonData.video_id || null,
        video_url: lessonData.video_url || null,
        is_preview: lessonData.is_preview || false,
        content: lessonData.content || null,
        notes: lessonData.notes || null,
        attachments: lessonData.attachments ? JSON.parse(lessonData.attachments) : null,
        quiz_data: lessonData.quiz_data ? JSON.parse(lessonData.quiz_data) : null,
        course_id: lessonData.course_id
      }
    });
  }

  console.log(`✅ ${lessonsData.length} comprehensive lessons created for courses:`);
  console.log(`   - Video lessons: ${lessonsData.filter(l => l.type === 'video').length}`);
  console.log(`   - Live sessions: ${lessonsData.filter(l => l.type === 'live_session').length}`);
  console.log(`   - Articles: ${lessonsData.filter(l => l.type === 'article').length}`);
  console.log(`   - Lessons with quizzes: ${lessonsData.filter(l => l.quiz_data).length}`);
  console.log(`   - Preview lessons: ${lessonsData.filter(l => l.is_preview).length}`);

  // Create Service Center Heads
  const serviceCenterHeads = await Promise.all([
    prisma.serviceCenterHead.upsert({
      where: { id: 'ch-1' },
      update: {},
      create: {
        id: 'ch-1',
        name: 'Dr. Ahmed Hassan',
        title: 'Director of Petroleum Analysis Center',
        picture: '/dr-ahmed-hassan.jpg',
        bio: 'Dr. Ahmed Hassan is a leading expert in petroleum chemistry with over 20 years of experience in crude oil analysis and refining technology. He holds a Ph.D. in Petroleum Engineering and has published numerous research papers on petroleum characterization and quality control.',
        email: 'a.hassan@epri.edu',
        phone: '+20 2 1234 5678',
        expertise: JSON.stringify(['Petroleum Chemistry', 'Crude Oil Characterization', 'Refining Technology', 'Quality Control', 'Analytical Methods Development'])
      }
    }),
    prisma.serviceCenterHead.upsert({
      where: { id: 'ch-2' },
      update: {},
      create: {
        id: 'ch-2',
        name: 'Dr. Fatma El-Sayed',
        title: 'Head of Reservoir Engineering Department',
        picture: '/dr-fatma-elsayed.jpg',
        bio: 'Dr. Fatma El-Sayed is a renowned reservoir engineer with extensive experience in reservoir simulation and production optimization. She has worked on major oil and gas projects across the Middle East and holds a Ph.D. in Petroleum Engineering from a leading international university.',
        email: 'f.elsayed@epri.edu',
        phone: '+20 2 1234 5679',
        expertise: JSON.stringify(['Reservoir Simulation', 'Production Optimization', 'Enhanced Oil Recovery', 'Reservoir Characterization', 'Field Development Planning'])
      }
    }),
    prisma.serviceCenterHead.upsert({
      where: { id: 'ch-3' },
      update: {},
      create: {
        id: 'ch-3',
        name: 'Dr. Mohamed Ibrahim',
        title: 'Director of Environmental Studies Center',
        picture: '/dr-mohamed-ibrahim.jpg',
        bio: 'Dr. Mohamed Ibrahim is an environmental scientist specializing in petroleum-related environmental issues. With over 15 years of experience, he has led numerous environmental impact assessments and remediation projects for major oil and gas companies.',
        email: 'm.ibrahim@epri.edu',
        phone: '+20 2 1234 5680',
        expertise: JSON.stringify(['Environmental Impact Assessment', 'Contamination Remediation', 'Environmental Regulations', 'Sustainability Consulting', 'Air and Water Quality Management'])
      }
    }),
    prisma.serviceCenterHead.upsert({
      where: { id: 'ch-4' },
      update: {},
      create: {
        id: 'ch-4',
        name: 'Eng. Khaled Mahmoud',
        title: 'Head of Drilling Engineering Department',
        picture: '/eng-khaled-mahmoud.jpg',
        bio: 'Eng. Khaled Mahmoud is a senior drilling engineer with over 25 years of field experience in drilling operations across various geological formations. He has managed complex drilling projects and is an expert in drilling optimization and well control.',
        email: 'k.mahmoud@epri.edu',
        phone: '+20 2 1234 5681',
        expertise: JSON.stringify(['Drilling Engineering', 'Well Design', 'Drilling Optimization', 'Well Control', 'Directional Drilling'])
      }
    }),
    prisma.serviceCenterHead.upsert({
      where: { id: 'ch-5' },
      update: {},
      create: {
        id: 'ch-5',
        name: 'Dr. Laila Abdel-Rahman',
        title: 'Director of Materials Science Center',
        picture: '/dr-laila-abdelrahman.jpg',
        bio: 'Dr. Laila Abdel-Rahman is a materials scientist with expertise in corrosion engineering and failure analysis. She has conducted extensive research on corrosion prevention in petroleum environments and has published numerous papers in international journals.',
        email: 'l.abdelrahman@epri.edu',
        phone: '+20 2 1234 5682',
        expertise: JSON.stringify(['Corrosion Engineering', 'Materials Science', 'Failure Analysis', 'Metallurgy', 'Corrosion Prevention'])
      }
    })
  ]);

  console.log('✅ Service center heads created');

  // Create Services with Equipment
  const servicesData = [
    {
      id: '1',
      title: 'Petroleum Analysis & Testing',
      subtitle: 'Comprehensive crude oil and petroleum product analysis',
      description: 'Our state-of-the-art petroleum analysis laboratory provides comprehensive testing services for crude oil, refined products, and petrochemicals. We utilize advanced analytical techniques to ensure product quality, compliance with international standards, and optimization of refining processes.',
      image: '/petroleum-lab-testing.jpg',
      category: 'Laboratory Services',
      icon: '🔬',
      features: JSON.stringify([
        'Crude oil assay and characterization',
        'Petroleum product quality testing',
        'Fuel specifications analysis',
        'Contamination detection',
        'Octane and cetane number determination',
        'Viscosity and density measurements',
        'Sulfur content analysis',
        'Distillation curve analysis'
      ]),
      center_head_id: 'ch-1',
      duration: '2-5 business days',
      price: 500,
      is_free: false,
      equipment: [
        {
          id: 'eq-1',
          name: 'Gas Chromatography-Mass Spectrometry (GC-MS)',
          description: 'Advanced analytical instrument for identifying and quantifying chemical compounds in petroleum samples',
          image: '/gc-ms-equipment.jpg',
          specifications: JSON.stringify([
            'High-resolution mass spectrometer',
            'Temperature range: -60°C to 450°C',
            'Detection limit: ppb level',
            'Automated sample injection system'
          ])
        },
        {
          id: 'eq-2',
          name: 'Atomic Absorption Spectrophotometer',
          description: 'Precision instrument for determining metal content in petroleum products',
          image: '/spectrophotometer-equipment.jpg',
          specifications: JSON.stringify([
            'Multi-element analysis capability',
            'Flame and graphite furnace modes',
            'Detection range: ppm to ppb',
            'Automated sample changer'
          ])
        }
      ]
    },
    {
      id: '2',
      title: 'Reservoir Engineering Services',
      subtitle: 'Advanced reservoir characterization and simulation',
      description: 'Our reservoir engineering team provides comprehensive services for reservoir characterization, performance analysis, and production optimization. We utilize cutting-edge simulation software and analytical techniques to maximize hydrocarbon recovery and optimize field development strategies.',
      image: '/reservoir-engineering.jpg',
      category: 'Engineering Services',
      icon: '⚙️',
      features: JSON.stringify([
        'Reservoir characterization and modeling',
        'Production forecasting and optimization',
        'Enhanced oil recovery (EOR) studies',
        'Well performance analysis',
        'Pressure transient analysis',
        'Material balance calculations',
        'Decline curve analysis',
        'Economic evaluation'
      ]),
      center_head_id: 'ch-2',
      duration: '1-4 weeks',
      price: 2000,
      is_free: false,
      equipment: [
        {
          id: 'eq-4',
          name: 'Reservoir Simulation Workstation',
          description: 'High-performance computing system for complex reservoir simulations',
          image: '/simulation-workstation.jpg',
          specifications: JSON.stringify([
            'Multi-core processors (64 cores)',
            '512 GB RAM',
            'GPU acceleration support',
            'Commercial reservoir simulators (Eclipse, CMG)'
          ])
        }
      ]
    },
    {
      id: '3',
      title: 'Environmental Impact Assessment',
      subtitle: 'Comprehensive environmental studies for petroleum operations',
      description: 'Our environmental services team conducts thorough environmental impact assessments for petroleum exploration, production, and refining operations. We help companies comply with environmental regulations and implement sustainable practices.',
      image: '/environmental-assessment.jpg',
      category: 'Environmental Services',
      icon: '🌍',
      features: JSON.stringify([
        'Environmental impact assessment (EIA)',
        'Soil and water contamination analysis',
        'Air quality monitoring',
        'Waste management planning',
        'Remediation strategy development',
        'Regulatory compliance consulting',
        'Sustainability reporting',
        'Carbon footprint analysis'
      ]),
      center_head_id: 'ch-3',
      duration: '2-6 weeks',
      price: 3000,
      is_free: false,
      equipment: [
        {
          id: 'eq-6',
          name: 'Environmental Monitoring Station',
          description: 'Automated system for continuous environmental parameter monitoring',
          image: '/environmental-monitoring.jpg',
          specifications: JSON.stringify([
            'Air quality sensors (PM2.5, PM10, NOx, SOx)',
            'Water quality analyzers',
            'Meteorological sensors',
            'Real-time data logging and transmission'
          ])
        }
      ]
    }
  ];

  // Create services and their equipment
  for (const serviceData of servicesData) {
    const service = await prisma.service.upsert({
      where: { id: serviceData.id },
      update: {
        title: serviceData.title,
        subtitle: serviceData.subtitle,
        description: serviceData.description,
        image: serviceData.image,
        category: serviceData.category,
        icon: serviceData.icon,
        features: serviceData.features,
        center_head_id: serviceData.center_head_id,
        duration: serviceData.duration,
        price: serviceData.price,
        is_free: serviceData.is_free
      },
      create: {
        id: serviceData.id,
        title: serviceData.title,
        subtitle: serviceData.subtitle,
        description: serviceData.description,
        image: serviceData.image,
        category: serviceData.category,
        icon: serviceData.icon,
        features: serviceData.features,
        center_head_id: serviceData.center_head_id,
        duration: serviceData.duration,
        price: serviceData.price,
        is_free: serviceData.is_free
      }
    });

    // Create equipment for this service
    for (const equipmentData of serviceData.equipment) {
      await prisma.serviceEquipment.upsert({
        where: { id: equipmentData.id },
        update: {
          name: equipmentData.name,
          description: equipmentData.description,
          image: equipmentData.image,
          specifications: equipmentData.specifications,
          serviceId: service.id
        },
        create: {
          id: equipmentData.id,
          name: equipmentData.name,
          description: equipmentData.description,
          image: equipmentData.image,
          specifications: equipmentData.specifications,
          serviceId: service.id
        }
      });
    }
  }

  console.log('✅ Services and equipment created');

  // Create staff members
  const staffMembers = [
    {
      id: 'staff-1',
      name: 'Dr. Ahmed Hassan',
      title: 'Senior Petroleum Engineer',
      bio: 'Dr. Ahmed Hassan is a senior petroleum engineer with over 15 years of experience in reservoir analysis and drilling operations. He holds a PhD in Petroleum Engineering from Cairo University.',
      email: 'ahmed.hassan@epri.edu',
      phone: '+201234567801',
      picture: '/staff/ahmed-hassan.jpg'
    },
    {
      id: 'staff-2',
      name: 'Dr. Fatima Al-Rashid',
      title: 'Lead Geologist',
      bio: 'Dr. Fatima Al-Rashid specializes in sedimentology and structural geology with extensive field experience in the Middle East and North Africa region.',
      email: 'fatima.rashid@epri.edu',
      phone: '+201234567802',
      picture: '/staff/fatima-rashid.jpg'
    },
    {
      id: 'staff-3',
      name: 'Eng. Mohamed Gamal',
      title: 'Laboratory Manager',
      bio: 'Engineering Mohamed Gamal oversees laboratory operations and ensures quality control in all testing procedures. He has 10 years of experience in analytical chemistry.',
      email: 'mohamed.gamal@epri.edu',
      phone: '+201234567803',
      picture: '/staff/mohamed-gamal.jpg'
    },
    {
      id: 'staff-4',
      name: 'Dr. Layla Mahmoud',
      title: 'Environmental Specialist',
      bio: 'Dr. Layla Mahmoud leads environmental impact assessments and sustainability initiatives. She holds a PhD in Environmental Engineering.',
      email: 'layla.mahmoud@epri.edu',
      phone: '+201234567804',
      picture: '/staff/layla-mahmoud.jpg'
    },
    {
      id: 'staff-5',
      name: 'Eng. Omar Salah',
      title: 'Geophysics Technician',
      bio: 'Engineering Omar Salah specializes in seismic data acquisition and processing. He has extensive experience with modern geophysical equipment.',
      email: 'omar.salah@epri.edu',
      phone: '+201234567805',
      picture: '/staff/omar-salah.jpg'
    },
    {
      id: 'staff-6',
      name: 'Dr. Nadia Farouk',
      title: 'Research Director',
      bio: 'Dr. Nadia Farouk oversees research initiatives and collaborations. She has published extensively in petroleum geology and reservoir characterization.',
      email: 'nadia.farouk@epri.edu',
      phone: '+201234567806',
      picture: '/staff/nadia-farouk.jpg'
    }
  ];

  for (const staffData of staffMembers) {
    await prisma.staff.upsert({
      where: { id: staffData.id },
      update: {
        name: staffData.name,
        title: staffData.title,
        bio: staffData.bio,
        email: staffData.email,
        phone: staffData.phone,
        picture: staffData.picture
      },
      create: {
        id: staffData.id,
        name: staffData.name,
        title: staffData.title,
        bio: staffData.bio,
        email: staffData.email,
        phone: staffData.phone,
        picture: staffData.picture
      }
    });
  }

  console.log('✅ Staff members created');

  const serviceCentersData = [
    // Centers
    {
      id: 'center-asphalt-polymers',
      slug: 'asphalt-polymers',
      name: 'Asphalt & polymers',
      type: 'center',
      headline: 'Advanced asphalt and polymer research and development center',
      description: 'The Asphalt & Polymers Center specializes in the development, testing, and optimization of asphalt materials and polymer-based solutions for the petroleum and construction industries. We provide comprehensive research services, quality testing, and innovative product development.',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&h=800&fit=crop',
      banner_image: 'https://images.unsplash.com/photo-1569228037739-37f4c9e2ab89?w=1600&h=900&fit=crop',
      location: 'Nasr City, Cairo',
      contact_phone: '+(202)22747847',
      contact_email: 'asphalt.polymers@epri.edu.eg',
      equipments: [
        {
          name: 'Dynamic Shear Rheometer (DSR)',
          details: 'Advanced rheological testing equipment for asphalt binder characterization and performance grading.'
        },
        {
          name: 'Bending Beam Rheometer (BBR)',
          details: 'Low-temperature performance testing for asphalt binders and mixtures.'
        },
        {
          name: 'Polymer Testing Laboratory',
          details: 'Comprehensive polymer characterization including molecular weight, thermal properties, and mechanical testing.'
        }
      ],
      products: [
        {
          name: 'Modified Asphalt Binders',
          description: 'High-performance polymer-modified asphalt binders for various applications.'
        },
        {
          name: 'Polymer Additives',
          description: 'Specialized polymer additives for enhanced material properties.'
        }
      ],
      lab_methodology: 'Our laboratory follows ASTM and AASHTO standards for asphalt and polymer testing. We employ advanced analytical techniques including rheology, thermal analysis, and mechanical testing to ensure quality and performance.',
      work_volume: {
        totalIncomeRate: 12.5,
        currency: 'million EGP',
        dataPoints: [
          { label: '2021', value: 8.2 },
          { label: '2022', value: 10.1 },
          { label: '2023', value: 11.5 },
          { label: '2024', value: 12.5 }
        ]
      },
      company_activity: {
        totalProjects: 58,
        activityMix: [
          { label: 'Research & Development', value: 40 },
          { label: 'Quality Testing', value: 30 },
          { label: 'Product Development', value: 20 },
          { label: 'Consulting Services', value: 10 }
        ]
      },
      future_prospective: 'Expanding into sustainable asphalt technologies, developing bio-based polymers, and establishing partnerships with construction and infrastructure companies.',
      services: [
        {
          name: 'Asphalt Testing & Analysis',
          summary: 'Comprehensive testing services for asphalt binders, mixtures, and performance evaluation.'
        },
        {
          name: 'Polymer Research & Development',
          summary: 'Advanced R&D services for polymer-based materials and applications.'
        },
        {
          name: 'Material Characterization',
          summary: 'Detailed material analysis and characterization services.'
        }
      ],
      metrics: {
        accreditation: 'ISO/IEC 17025',
        activeProjects: 58,
        researchPublications: 24
      },
      is_featured: true,
      is_published: true,
      order_index: 1
    },
    {
      id: 'center-chemical-services',
      slug: 'chemical-services-development',
      name: 'Chemical Services and Development',
      type: 'center',
      headline: 'Comprehensive chemical services and product development',
      description: 'Providing advanced chemical analysis, development, and consulting services for the petroleum industry.',
      image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&h=800&fit=crop',
      banner_image: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=1600&h=900&fit=crop',
      location: 'Nasr City, Cairo',
      contact_phone: '+(202)22747848',
      contact_email: 'chemical.services@epri.edu.eg',
      equipments: [],
      products: [],
      lab_methodology: '',
      work_volume: {
        totalIncomeRate: 6.8,
        currency: 'million EGP',
        dataPoints: [
          { label: '2021', value: 4.5 },
          { label: '2022', value: 5.6 },
          { label: '2023', value: 6.2 },
          { label: '2024', value: 6.8 }
        ]
      },
      company_activity: {
        totalProjects: 35,
        activityMix: [
          { label: 'Chemical Analysis', value: 50 },
          { label: 'Product Development', value: 30 },
          { label: 'Consulting', value: 20 }
        ]
      },
      future_prospective: '',
      services: [],
      is_featured: false,
      is_published: true,
      order_index: 2
    },
    {
      id: 'center-core-analysis',
      slug: 'core-analysis',
      name: 'Core Analysis',
      type: 'center',
      headline: 'Specialized core analysis and reservoir characterization services',
      description: 'Advanced core analysis laboratory providing comprehensive reservoir rock characterization and fluid analysis.',
      image: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=1200&h=800&fit=crop',
      banner_image: 'https://images.unsplash.com/photo-1505731132164-cca90383e1af?w=1600&h=900&fit=crop',
      location: 'Nasr City, Cairo',
      contact_phone: '+(202)22747849',
      contact_email: 'core.analysis@epri.edu.eg',
      equipments: [],
      products: [],
      lab_methodology: '',
      work_volume: {
        totalIncomeRate: 9.2,
        currency: 'million EGP',
        dataPoints: [
          { label: '2021', value: 6.1 },
          { label: '2022', value: 7.5 },
          { label: '2023', value: 8.4 },
          { label: '2024', value: 9.2 }
        ]
      },
      company_activity: {
        totalProjects: 45,
        activityMix: [
          { label: 'Core Analysis', value: 60 },
          { label: 'Reservoir Studies', value: 25 },
          { label: 'Consulting', value: 15 }
        ]
      },
      future_prospective: '',
      services: [],
      is_featured: false,
      is_published: true,
      order_index: 3
    },
    {
      id: 'center-pvt-services',
      slug: 'pvt-services',
      name: 'PVT Services',
      type: 'center',
      headline: 'Pressure-Volume-Temperature analysis and fluid characterization',
      description: 'Comprehensive PVT analysis services for reservoir fluid characterization and production optimization.',
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=800&fit=crop',
      banner_image: 'https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=1600&h=900&fit=crop',
      location: 'Nasr City, Cairo',
      contact_phone: '+(202)22747850',
      contact_email: 'pvt.services@epri.edu.eg',
      equipments: [],
      products: [],
      lab_methodology: '',
      work_volume: {
        totalIncomeRate: 7.5,
        currency: 'million EGP',
        dataPoints: [
          { label: '2021', value: 5.2 },
          { label: '2022', value: 6.3 },
          { label: '2023', value: 7.0 },
          { label: '2024', value: 7.5 }
        ]
      },
      company_activity: {
        totalProjects: 38,
        activityMix: [
          { label: 'PVT Analysis', value: 55 },
          { label: 'Fluid Characterization', value: 30 },
          { label: 'Consulting', value: 15 }
        ]
      },
      future_prospective: '',
      services: [],
      is_featured: false,
      is_published: true,
      order_index: 4
    },
    {
      id: 'center-surfaces',
      slug: 'surfaces',
      name: 'Surfaces',
      type: 'center',
      headline: 'Surface chemistry and material surface analysis',
      description: 'Advanced surface analysis and characterization services for materials and coatings.',
      image: 'https://images.unsplash.com/photo-1514996937319-344454492b37?w=1200&h=800&fit=crop',
      banner_image: 'https://images.unsplash.com/photo-1503389152951-9f343605f61e?w=1600&h=900&fit=crop',
      location: 'Nasr City, Cairo',
      contact_phone: '+(202)22747851',
      contact_email: 'surfaces@epri.edu.eg',
      equipments: [],
      products: [],
      lab_methodology: '',
      work_volume: {
        totalIncomeRate: 5.3,
        currency: 'million EGP',
        dataPoints: [
          { label: '2021', value: 3.8 },
          { label: '2022', value: 4.5 },
          { label: '2023', value: 4.9 },
          { label: '2024', value: 5.3 }
        ]
      },
      company_activity: {
        totalProjects: 28,
        activityMix: [
          { label: 'Surface Analysis', value: 50 },
          { label: 'Coating Services', value: 30 },
          { label: 'Research', value: 20 }
        ]
      },
      future_prospective: '',
      services: [],
      is_featured: false,
      is_published: true,
      order_index: 5
    },
    {
      id: 'center-protection',
      slug: 'protection',
      name: 'Protection',
      type: 'center',
      headline: 'Corrosion protection and material protection services',
      description: 'Specialized services for corrosion prevention, material protection, and coating technologies.',
      image: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=1200&h=800&fit=crop',
      banner_image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1600&h=900&fit=crop',
      location: 'Nasr City, Cairo',
      contact_phone: '+(202)22747852',
      contact_email: 'protection@epri.edu.eg',
      equipments: [],
      products: [],
      lab_methodology: '',
      work_volume: {
        totalIncomeRate: 6.1,
        currency: 'million EGP',
        dataPoints: [
          { label: '2021', value: 4.2 },
          { label: '2022', value: 5.1 },
          { label: '2023', value: 5.7 },
          { label: '2024', value: 6.1 }
        ]
      },
      company_activity: {
        totalProjects: 32,
        activityMix: [
          { label: 'Corrosion Protection', value: 45 },
          { label: 'Coating Services', value: 35 },
          { label: 'Consulting', value: 20 }
        ]
      },
      future_prospective: '',
      services: [],
      is_featured: false,
      is_published: true,
      order_index: 6
    },
    {
      id: 'center-tanks-services',
      slug: 'tanks-services',
      name: 'Tanks Services',
      type: 'center',
      headline: 'Tank inspection, maintenance, and testing services',
      description: 'Comprehensive services for storage tank inspection, maintenance, and integrity assessment.',
      image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&h=800&fit=crop',
      banner_image: 'https://images.unsplash.com/photo-1569228037739-37f4c9e2ab89?w=1600&h=900&fit=crop',
      location: 'Nasr City, Cairo',
      contact_phone: '+(202)22747853',
      contact_email: 'tanks.services@epri.edu.eg',
      equipments: [],
      products: [],
      lab_methodology: '',
      work_volume: {
        totalIncomeRate: 8.7,
        currency: 'million EGP',
        dataPoints: [
          { label: '2021', value: 6.0 },
          { label: '2022', value: 7.3 },
          { label: '2023', value: 8.1 },
          { label: '2024', value: 8.7 }
        ]
      },
      company_activity: {
        totalProjects: 42,
        activityMix: [
          { label: 'Tank Inspection', value: 40 },
          { label: 'Maintenance Services', value: 35 },
          { label: 'Testing', value: 25 }
        ]
      },
      future_prospective: '',
      services: [],
      is_featured: false,
      is_published: true,
      order_index: 7
    },
    {
      id: 'center-technical-support',
      slug: 'technical-support-technology',
      name: 'Technical Support & technology',
      type: 'center',
      headline: 'Technical support and technology transfer services',
      description: 'Providing technical support, technology transfer, and innovation services to the petroleum industry.',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=800&fit=crop',
      banner_image: 'https://images.unsplash.com/photo-1505731132164-cca90383e1af?w=1600&h=900&fit=crop',
      location: 'Nasr City, Cairo',
      contact_phone: '+(202)22747854',
      contact_email: 'tech.support@epri.edu.eg',
      equipments: [],
      products: [],
      lab_methodology: '',
      work_volume: {
        totalIncomeRate: 4.9,
        currency: 'million EGP',
        dataPoints: [
          { label: '2021', value: 3.5 },
          { label: '2022', value: 4.1 },
          { label: '2023', value: 4.6 },
          { label: '2024', value: 4.9 }
        ]
      },
      company_activity: {
        totalProjects: 25,
        activityMix: [
          { label: 'Technical Support', value: 50 },
          { label: 'Technology Transfer', value: 30 },
          { label: 'Training', value: 20 }
        ]
      },
      future_prospective: '',
      services: [],
      is_featured: false,
      is_published: true,
      order_index: 8
    },
    // Units
    {
      id: 'unit-central-analytical-labs',
      slug: 'central-analytical-labs',
      name: 'Central Analytical labs',
      type: 'unit',
      headline: 'Centralized analytical laboratory services',
      description: 'Comprehensive analytical services providing chemical analysis, quality control, and research support.',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&h=800&fit=crop',
      banner_image: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=1600&h=900&fit=crop',
      location: 'Nasr City, Cairo',
      contact_phone: '+(202)22747855',
      contact_email: 'analytical.labs@epri.edu.eg',
      equipments: [],
      products: [],
      lab_methodology: '',
      work_volume: {
        totalIncomeRate: 10.2,
        currency: 'million EGP',
        dataPoints: [
          { label: '2021', value: 7.5 },
          { label: '2022', value: 8.8 },
          { label: '2023', value: 9.6 },
          { label: '2024', value: 10.2 }
        ]
      },
      company_activity: {
        totalProjects: 52,
        activityMix: [
          { label: 'Chemical Analysis', value: 45 },
          { label: 'Quality Control', value: 30 },
          { label: 'Research Support', value: 25 }
        ]
      },
      future_prospective: '',
      services: [],
      is_featured: false,
      is_published: true,
      order_index: 1
    },
    {
      id: 'unit-cathodic-protection',
      slug: 'cathodic-protection',
      name: 'Cathodic Protection',
      type: 'unit',
      headline: 'Cathodic protection systems and services',
      description: 'Specialized unit providing cathodic protection design, installation, and monitoring services.',
      image: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=1200&h=800&fit=crop',
      banner_image: 'https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=1600&h=900&fit=crop',
      location: 'Nasr City, Cairo',
      contact_phone: '+(202)22747856',
      contact_email: 'cathodic.protection@epri.edu.eg',
      equipments: [],
      products: [],
      lab_methodology: '',
      work_volume: {
        totalIncomeRate: 5.6,
        currency: 'million EGP',
        dataPoints: [
          { label: '2021', value: 3.9 },
          { label: '2022', value: 4.7 },
          { label: '2023', value: 5.2 },
          { label: '2024', value: 5.6 }
        ]
      },
      company_activity: {
        totalProjects: 30,
        activityMix: [
          { label: 'System Design', value: 40 },
          { label: 'Installation', value: 35 },
          { label: 'Monitoring', value: 25 }
        ]
      },
      future_prospective: '',
      services: [],
      is_featured: false,
      is_published: true,
      order_index: 2
    },
    {
      id: 'unit-earth-surveys',
      slug: 'earth-surveys-unit',
      name: 'Earth Surveys Unit',
      type: 'unit',
      headline: 'Geological and geophysical survey services',
      description: 'Comprehensive earth survey services including geological mapping, geophysical exploration, and site characterization.',
      image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=1200&h=800&fit=crop',
      banner_image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1600&h=900&fit=crop',
      location: 'Nasr City, Cairo',
      contact_phone: '+(202)22747857',
      contact_email: 'earth.surveys@epri.edu.eg',
      equipments: [],
      products: [],
      lab_methodology: '',
      work_volume: {
        totalIncomeRate: 7.8,
        currency: 'million EGP',
        dataPoints: [
          { label: '2021', value: 5.4 },
          { label: '2022', value: 6.5 },
          { label: '2023', value: 7.2 },
          { label: '2024', value: 7.8 }
        ]
      },
      company_activity: {
        totalProjects: 40,
        activityMix: [
          { label: 'Geological Surveys', value: 45 },
          { label: 'Geophysical Exploration', value: 35 },
          { label: 'Site Characterization', value: 20 }
        ]
      },
      future_prospective: '',
      services: [],
      is_featured: false,
      is_published: true,
      order_index: 3
    },
    {
      id: 'unit-eor-non-traditional',
      slug: 'enhanced-oil-recovery-non-traditional',
      name: 'Enhanced Oil Recovery by non-traditional ways',
      type: 'unit',
      headline: 'Innovative enhanced oil recovery technologies',
      description: 'Research and development unit focusing on non-traditional EOR methods and innovative recovery techniques.',
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=800&fit=crop',
      banner_image: 'https://images.unsplash.com/photo-1505731132164-cca90383e1af?w=1600&h=900&fit=crop',
      location: 'Nasr City, Cairo',
      contact_phone: '+(202)22747858',
      contact_email: 'eor.nontraditional@epri.edu.eg',
      equipments: [],
      products: [],
      lab_methodology: '',
      work_volume: {
        totalIncomeRate: 6.4,
        currency: 'million EGP',
        dataPoints: [
          { label: '2021', value: 4.3 },
          { label: '2022', value: 5.2 },
          { label: '2023', value: 5.9 },
          { label: '2024', value: 6.4 }
        ]
      },
      company_activity: {
        totalProjects: 33,
        activityMix: [
          { label: 'Research & Development', value: 50 },
          { label: 'Pilot Testing', value: 30 },
          { label: 'Field Implementation', value: 20 }
        ]
      },
      future_prospective: '',
      services: [],
      is_featured: false,
      is_published: true,
      order_index: 4
    },
    {
      id: 'unit-fuel-research',
      slug: 'fuel-research-fru',
      name: 'Fuel Research (FRU)',
      type: 'unit',
      headline: 'Fuel research and development unit',
      description: 'Specialized research unit dedicated to fuel analysis, development, and optimization.',
      image: 'https://images.unsplash.com/photo-1514996937319-344454492b37?w=1200&h=800&fit=crop',
      banner_image: 'https://images.unsplash.com/photo-1503389152951-9f343605f61e?w=1600&h=900&fit=crop',
      location: 'Nasr City, Cairo',
      contact_phone: '+(202)22747859',
      contact_email: 'fuel.research@epri.edu.eg',
      equipments: [],
      products: [],
      lab_methodology: '',
      work_volume: {
        totalIncomeRate: 8.1,
        currency: 'million EGP',
        dataPoints: [
          { label: '2021', value: 5.8 },
          { label: '2022', value: 6.9 },
          { label: '2023', value: 7.6 },
          { label: '2024', value: 8.1 }
        ]
      },
      company_activity: {
        totalProjects: 46,
        activityMix: [
          { label: 'Fuel Analysis', value: 40 },
          { label: 'Research & Development', value: 35 },
          { label: 'Quality Testing', value: 25 }
        ]
      },
      future_prospective: '',
      services: [],
      is_featured: false,
      is_published: true,
      order_index: 5
    },
    {
      id: 'unit-coal-quality-control',
      slug: 'quality-control-coal-analysis',
      name: 'QUALITY CONTROL UNIT FOR COAL ANALYSIS',
      type: 'unit',
      headline: 'Coal quality control and analysis services',
      description: 'Specialized unit providing comprehensive coal analysis and quality control services.',
      image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&h=800&fit=crop',
      banner_image: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=1600&h=900&fit=crop',
      location: 'Nasr City, Cairo',
      contact_phone: '+(202)22747860',
      contact_email: 'coal.quality@epri.edu.eg',
      equipments: [],
      products: [],
      lab_methodology: '',
      work_volume: {
        totalIncomeRate: 4.2,
        currency: 'million EGP',
        dataPoints: [
          { label: '2021', value: 3.0 },
          { label: '2022', value: 3.6 },
          { label: '2023', value: 3.9 },
          { label: '2024', value: 4.2 }
        ]
      },
      company_activity: {
        totalProjects: 22,
        activityMix: [
          { label: 'Coal Analysis', value: 55 },
          { label: 'Quality Control', value: 30 },
          { label: 'Testing Services', value: 15 }
        ]
      },
      future_prospective: '',
      services: [],
      is_featured: false,
      is_published: true,
      order_index: 6
    }
  ];

  for (const center of serviceCentersData) {
    const { id, slug, equipments: centerEquipments = [], ...centerData } = center;
    const upsertedCenter = await (prisma as any).serviceCenter.upsert({
      where: { slug },
      update: {
        ...centerData,
        slug
      },
      create: {
        id,
        slug,
        ...centerData
      }
    });

    await (prisma as any).serviceEquipment.deleteMany({
      where: { serviceCenterId: upsertedCenter.id }
    });

    if (centerEquipments.length > 0) {
      for (const equipmentEntry of centerEquipments) {
        const equipment =
          typeof equipmentEntry === 'object' && equipmentEntry !== null
            ? equipmentEntry
            : { name: String(equipmentEntry ?? 'Equipment'), details: null };

        await (prisma as any).serviceEquipment.create({
          data: {
            serviceCenterId: upsertedCenter.id,
            serviceId: null,
            name: equipment.name,
            description: (equipment as any).details ?? (equipment as any).description ?? null,
            image: (equipment as any).image ?? null,
            specifications: (equipment as any).specifications ?? null
          }
        });
      }
    }
  }

  console.log(`✅ Seeded ${serviceCentersData.length} service centers with analytics and tab content`);

  // Create comprehensive laboratories with relational data and Unsplash images
  const laboratoriesData = [
    {
      id: 'lab-sedimentology',
      name: 'Sedimentology & Stratigraphy Laboratory',
      description: 'Advanced sedimentological analysis and stratigraphic research facility specializing in sediment characterization, depositional environment interpretation, and reservoir quality assessment for petroleum exploration.',
      image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=600&fit=crop',
      head_name: 'Prof. Dr. Mostafa Gouda Mohamed',
      head_title: 'Head of Sedimentology Laboratory',
      head_academic_title: 'Prof. Dr.',
      head_picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      head_cv_url: '/cv/mostafa-gouda-cv.pdf',
      head_email: 'gouda250@yahoo.com',
      head_bio: 'Prof. Dr. Mostafa Gouda Mohamed is a distinguished sedimentologist with over 25 years of experience in petroleum geology. He has led numerous research projects on reservoir characterization and has published extensively in international journals.',
      address: '1 Ahmed El-Zomor Street, El Zohour Region, Nasr city, Cairo',
      phone: '+(202)22747847',
      alternative_phone: '+(202)22747433',
      fax: '+(202)22747444',
      email: 'sedimentology@epri.edu.eg',
      website: 'https://epri.edu.eg/sedimentology',
      established_year: 1985,
      facilities: 'State-of-the-art microscopy suite, sample preparation facilities, digital imaging systems, and environmental chambers for sediment analysis.',
      equipment_list: 'Polarizing microscopes, SEM, XRD equipment, grain size analyzers, porosity and permeability measurement systems',
      research_areas: 'Carbonate and clastic reservoir characterization, sequence stratigraphy, depositional environments, diagenetic processes',
      services_offered: 'Petrographic analysis, reservoir quality assessment, stratigraphic correlation, facies analysis, core description',
      staff_count: 12,
      students_count: 25,
      department_id: 'dept-sedimentology',
      section_id: sections.find(s => s.slug === 'exploration')?.id,
      building: 'Research Building A',
      floor: '3rd Floor',
      room_numbers: '301-305',
      is_active: true,
      is_featured: true,
      display_order: 1
    },
    {
      id: 'lab-paleontology',
      name: 'Micropaleontology & Biostratigraphy Laboratory',
      description: 'Specialized facility for micropaleontological and biostratigraphic analysis, providing age dating, paleoenvironmental interpretation, and correlation services for petroleum exploration.',
      image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&h=600&fit=crop',
      head_name: 'Dr. Sarah Ahmed Mahmoud',
      head_title: 'Head of Micropaleontology Laboratory',
      head_academic_title: 'Dr.',
      head_picture: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
      head_cv_url: '/cv/sarah-mahmoud-cv.pdf',
      head_email: 's.mahmoud@epri.edu.eg',
      head_bio: 'Dr. Sarah Ahmed Mahmoud is a renowned micropaleontologist specializing in foraminiferal biostratigraphy and paleoenvironmental reconstruction. She has extensive experience in age dating and correlation of petroleum-bearing formations.',
      address: '1 Ahmed El-Zomor Street, El Zohour Region, Nasr city, Cairo',
      phone: '+(202)22747850',
      alternative_phone: '+(202)22747851',
      fax: '+(202)22747852',
      email: 'paleontology@epri.edu.eg',
      website: 'https://epri.edu.eg/paleontology',
      established_year: 1988,
      facilities: 'Advanced microscopy laboratory, fossil preparation lab, digital imaging and analysis systems, reference collection storage',
      equipment_list: 'High-resolution microscopes, micropaleontological preparation equipment, fossil imaging systems, reference collections',
      research_areas: 'Foraminiferal biostratigraphy, paleoecology, paleoenvironmental reconstruction, sequence biostratigraphy',
      services_offered: 'Biostratigraphic age dating, paleoenvironmental analysis, fossil identification, biozonation studies',
      staff_count: 8,
      students_count: 15,
      department_id: 'dept-paleontology',
      section_id: sections.find(s => s.slug === 'exploration')?.id,
      building: 'Research Building A',
      floor: '2nd Floor',
      room_numbers: '201-204',
      is_active: true,
      is_featured: true,
      display_order: 2
    },
    {
      id: 'lab-geophysics',
      name: 'Geophysics & Well Logging Laboratory',
      description: 'Advanced geophysical research facility equipped with state-of-the-art instruments for seismic data processing, well log analysis, and geophysical modeling for petroleum exploration and reservoir characterization.',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop',
      head_name: 'Prof. Dr. Khaled Hassan Ali',
      head_title: 'Head of Geophysics Laboratory',
      head_academic_title: 'Prof. Dr.',
      head_picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
      head_cv_url: '/cv/khaled-ali-cv.pdf',
      head_email: 'k.ali@epri.edu.eg',
      head_bio: 'Prof. Dr. Khaled Hassan Ali is a leading geophysicist with expertise in seismic interpretation and reservoir geophysics. He has over 20 years of experience in petroleum exploration and has consulted for major international oil companies.',
      address: '1 Ahmed El-Zomor Street, El Zohour Region, Nasr city, Cairo',
      phone: '+(202)22747860',
      alternative_phone: '+(202)22747861',
      fax: '+(202)22747862',
      email: 'geophysics@epri.edu.eg',
      website: 'https://epri.edu.eg/geophysics',
      established_year: 1990,
      facilities: 'High-performance computing cluster, seismic interpretation workstations, well log analysis systems, gravity and magnetic processing labs',
      equipment_list: 'Seismic workstations, well log interpretation software, gravity meters, magnetometers, electrical resistivity equipment',
      research_areas: 'Seismic interpretation, reservoir geophysics, potential field methods, well log analysis, integrated geophysical studies',
      services_offered: 'Seismic data processing and interpretation, well log analysis, gravity and magnetic surveys, reservoir characterization',
      staff_count: 15,
      students_count: 30,
      department_id: 'dept-geophysics',
      section_id: sections.find(s => s.slug === 'exploration')?.id,
      building: 'Research Building B',
      floor: '1st Floor',
      room_numbers: '101-108',
      is_active: true,
      is_featured: true,
      display_order: 3
    },
    {
      id: 'lab-core-analysis',
      name: 'Core Analysis & Petrophysics Laboratory',
      description: 'Comprehensive core analysis services including porosity, permeability, saturation, and petrophysical property measurements for reservoir characterization and evaluation.',
      image: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&h=600&fit=crop',
      head_name: 'Dr. Amira Fouad Soliman',
      head_title: 'Head of Core Analysis Laboratory',
      head_academic_title: 'Dr.',
      head_picture: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&h=400&fit=crop&crop=face',
      head_cv_url: '/cv/amira-soliman-cv.pdf',
      head_email: 'a.soliman@epri.edu.eg',
      head_bio: 'Dr. Amira Fouad Soliman is a specialist in core analysis and petrophysics with extensive experience in reservoir property measurements. She has developed innovative techniques for unconventional reservoir analysis.',
      address: '1 Ahmed El-Zomor Street, El Zohour Region, Nasr city, Cairo',
      phone: '+(202)22747870',
      alternative_phone: '+(202)22747871',
      fax: '+(202)22747872',
      email: 'coreanalysis@epri.edu.eg',
      website: 'https://epri.edu.eg/coreanalysis',
      established_year: 1992,
      facilities: 'Core preparation facilities, automated core analysis systems, special core analysis equipment, CT scanning facility',
      equipment_list: 'Core gamma scanner, porosity-permeability analyzers, capillary pressure systems, CT scanner, NMR core analyzer',
      research_areas: 'Core analysis, petrophysics, reservoir characterization, rock mechanics, formation evaluation',
      services_offered: 'Routine and special core analysis, porosity and permeability measurements, capillary pressure analysis, rock mechanics testing',
      staff_count: 10,
      students_count: 20,
      department_id: 'dept-core-analysis',
      section_id: sections.find(s => s.slug === 'analysis-evaluation')?.id,
      building: 'Research Building C',
      floor: '1st Floor',
      room_numbers: '105-110',
      is_active: true,
      is_featured: true,
      display_order: 4
    },
    {
      id: 'lab-chemical-analysis',
      name: 'Petroleum Chemistry & Analysis Laboratory',
      description: 'State-of-the-art chemical analysis laboratory for petroleum products, crude oil characterization, and quality control testing using advanced analytical instrumentation.',
      image: 'https://images.unsplash.com/photo-1583912086296-89e4d36f5012?w=800&h=600&fit=crop',
      head_name: 'Prof. Dr. Mahmoud Ibrahim Hassan',
      head_title: 'Head of Chemistry Laboratory',
      head_academic_title: 'Prof. Dr.',
      head_picture: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face',
      head_cv_url: '/cv/mahmoud-hassan-cv.pdf',
      head_email: 'm.hassan@epri.edu.eg',
      head_bio: 'Prof. Dr. Mahmoud Ibrahim Hassan is a distinguished petroleum chemist with over 30 years of experience in crude oil analysis and petroleum product development. He has authored numerous publications on petroleum chemistry.',
      address: '1 Ahmed El-Zomor Street, El Zohour Region, Nasr city, Cairo',
      phone: '+(202)22747880',
      alternative_phone: '+(202)22747881',
      fax: '+(202)22747882',
      email: 'chemistry@epri.edu.eg',
      website: 'https://epri.edu.eg/chemistry',
      established_year: 1987,
      facilities: 'Advanced analytical chemistry laboratory, sample preparation facilities, fume hoods, and specialized storage for chemicals',
      equipment_list: 'GC-MS, HPLC, IR spectrometer, UV-Vis spectrophotometer, atomic absorption spectrometer, distillation apparatus',
      research_areas: 'Petroleum chemistry, crude oil characterization, fuel analysis, environmental chemistry, analytical method development',
      services_offered: 'Crude oil assays, petroleum product analysis, contamination testing, fuel quality assessment, chemical composition analysis',
      staff_count: 14,
      students_count: 28,
      department_id: 'dept-chemical-analysis',
      section_id: sections.find(s => s.slug === 'analysis-evaluation')?.id,
      building: 'Research Building C',
      floor: '2nd Floor',
      room_numbers: '201-208',
      is_active: true,
      is_featured: true,
      display_order: 5
    },
    {
      id: 'lab-environmental',
      name: 'Environmental Assessment & Monitoring Laboratory',
      description: 'Comprehensive environmental monitoring and assessment facility specializing in soil, water, and air quality analysis for petroleum industry environmental compliance.',
      image: 'https://images.unsplash.com/photo-1574263867128-cddc47ba885e?w=800&h=600&fit=crop',
      head_name: 'Dr. Nadia Mohamed Farouk',
      head_title: 'Head of Environmental Laboratory',
      head_academic_title: 'Dr.',
      head_picture: 'https://images.unsplash.com/photo-1594824730131-b0d5a8bd3d49?w=400&h=400&fit=crop&crop=face',
      head_cv_url: '/cv/nadia-farouk-cv.pdf',
      head_email: 'n.farouk@epri.edu.eg',
      head_bio: 'Dr. Nadia Mohamed Farouk is an environmental scientist specializing in petroleum-related environmental impact assessment and remediation. She has led numerous environmental projects for oil and gas companies.',
      address: '1 Ahmed El-Zomor Street, El Zohour Region, Nasr city, Cairo',
      phone: '+(202)22747890',
      alternative_phone: '+(202)22747891',
      fax: '+(202)22747892',
      email: 'environmental@epri.edu.eg',
      website: 'https://epri.edu.eg/environmental',
      established_year: 1995,
      facilities: 'Environmental analysis laboratory, field sampling equipment, air quality monitoring systems, water testing facilities',
      equipment_list: 'Environmental monitoring stations, water quality analyzers, soil contamination detectors, air quality sensors, GIS workstations',
      research_areas: 'Environmental impact assessment, contamination remediation, environmental monitoring, sustainability assessment, climate change studies',
      services_offered: 'Environmental impact assessment, soil and water contamination analysis, air quality monitoring, remediation planning',
      staff_count: 12,
      students_count: 22,
      department_id: 'dept-environmental',
      section_id: sections.find(s => s.slug === 'processes-design-develop')?.id,
      building: 'Environmental Building',
      floor: '1st Floor',
      room_numbers: '101-106',
      is_active: true,
      is_featured: true,
      display_order: 6
    },
    {
      id: 'lab-drilling',
      name: 'Drilling Fluids & Mud Testing Laboratory',
      description: 'Specialized laboratory for drilling fluid analysis, mud testing, and wellbore stability assessment to optimize drilling operations and ensure well integrity.',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop',
      head_name: 'Eng. Omar Salah Ahmed',
      head_title: 'Head of Drilling Laboratory',
      head_academic_title: 'Eng.',
      head_picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      head_cv_url: '/cv/omar-ahmed-cv.pdf',
      head_email: 'o.ahmed@epri.edu.eg',
      head_bio: 'Eng. Omar Salah Ahmed is a drilling engineer with over 15 years of experience in drilling operations and mud engineering. He has worked on challenging drilling projects across different geological formations.',
      address: '1 Ahmed El-Zomor Street, El Zohour Region, Nasr city, Cairo',
      phone: '+(202)22747900',
      alternative_phone: '+(202)22747901',
      fax: '+(202)22747902',
      email: 'drilling@epri.edu.eg',
      website: 'https://epri.edu.eg/drilling',
      established_year: 1993,
      facilities: 'Mud testing laboratory, rheometer station, filtration testing equipment, high-pressure high-temperature testing systems',
      equipment_list: 'Rheometers, mud balances, filtration equipment, HPHT aging cells, sand content analyzers, pH meters',
      research_areas: 'Drilling fluid optimization, wellbore stability, mud chemistry, drilling hydraulics, lost circulation materials',
      services_offered: 'Drilling fluid testing, mud optimization, wellbore stability analysis, drilling hydraulics calculations',
      staff_count: 8,
      students_count: 16,
      department_id: 'dept-drilling',
      section_id: sections.find(s => s.slug === 'exploration')?.id,
      building: 'Drilling Building',
      floor: '1st Floor',
      room_numbers: '101-104',
      is_active: true,
      is_featured: false,
      display_order: 7
    },
    {
      id: 'lab-corrosion',
      name: 'Corrosion & Materials Testing Laboratory',
      description: 'Advanced materials testing facility specializing in corrosion analysis, failure investigation, and materials evaluation for petroleum industry applications.',
      image: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=600&fit=crop',
      head_name: 'Dr. Layla Hassan Abdel-Rahman',
      head_title: 'Head of Materials Laboratory',
      head_academic_title: 'Dr.',
      head_picture: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&h=400&fit=crop&crop=face',
      head_cv_url: '/cv/layla-abdelrahman-cv.pdf',
      head_email: 'l.abdelrahman@epri.edu.eg',
      head_bio: 'Dr. Layla Hassan Abdel-Rahman is a materials scientist specializing in corrosion engineering and failure analysis. She has extensive experience in materials selection and corrosion prevention for harsh petroleum environments.',
      address: '1 Ahmed El-Zomor Street, El Zohour Region, Nasr city, Cairo',
      phone: '+(202)22747910',
      alternative_phone: '+(202)22747911',
      fax: '+(202)22747912',
      email: 'materials@epri.edu.eg',
      website: 'https://epri.edu.eg/materials',
      established_year: 1996,
      facilities: 'Corrosion testing chambers, materials characterization equipment, mechanical testing machines, failure analysis laboratory',
      equipment_list: 'Corrosion test cells, potentiostats, metallurgical microscopes, hardness testers, tensile testing machines, SEM-EDS',
      research_areas: 'Corrosion engineering, materials characterization, failure analysis, protective coatings, materials selection',
      services_offered: 'Corrosion testing, materials evaluation, failure analysis, coating assessment, materials selection consulting',
      staff_count: 9,
      students_count: 18,
      department_id: 'dept-corrosion',
      section_id: sections.find(s => s.slug === 'analysis-evaluation')?.id,
      building: 'Materials Building',
      floor: '1st Floor',
      room_numbers: '101-105',
      is_active: true,
      is_featured: false,
      display_order: 8
    }
  ];

  // TODO: Create laboratories after Prisma client is regenerated
  console.log(`⚠️  Laboratory creation skipped - will be added after schema migration`);

  // Update existing data with Unsplash images
  console.log('🔄 Updating existing data with Unsplash images...');

  // Update departments with Unsplash images
  const departmentImageUpdates = [
    { id: 'dept-sedimentology', image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=600&fit=crop' },
    { id: 'dept-paleontology', image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&h=600&fit=crop' },
    { id: 'dept-geophysics', image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop' },
    { id: 'dept-drilling', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop' },
    { id: 'dept-reservoir', image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop' },
    { id: 'dept-production', image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=600&fit=crop' },
    { id: 'dept-core-analysis', image: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&h=600&fit=crop' },
    { id: 'dept-chemical-analysis', image: 'https://images.unsplash.com/photo-1583912086296-89e4d36f5012?w=800&h=600&fit=crop' },
    { id: 'dept-spectroscopy', image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=600&fit=crop' },
    { id: 'dept-corrosion', image: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=600&fit=crop' },
    { id: 'dept-soil', image: 'https://images.unsplash.com/photo-1574263867128-cddc47ba885e?w=800&h=600&fit=crop' },
    { id: 'dept-mud', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop' },
    { id: 'dept-refining', image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=600&fit=crop' },
    { id: 'dept-distillation', image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=600&fit=crop' },
    { id: 'dept-applications', image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop' },
    { id: 'dept-lubricants', image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=600&fit=crop' },
    { id: 'dept-petrochemicals', image: 'https://images.unsplash.com/photo-1583912086296-89e4d36f5012?w=800&h=600&fit=crop' },
    { id: 'dept-polymers', image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=600&fit=crop' },
    { id: 'dept-process-design', image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop' },
    { id: 'dept-simulation', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop' },
    { id: 'dept-environmental', image: 'https://images.unsplash.com/photo-1574263867128-cddc47ba885e?w=800&h=600&fit=crop' }
  ];

  for (const update of departmentImageUpdates) {
    await prisma.department.update({
      where: { id: update.id },
      data: { image: update.image }
    }).catch(() => {
      // Skip if department doesn't exist
      console.log(`⚠️  Department ${update.id} not found, skipping image update`);
    });
  }

  // Update services with Unsplash images
  const serviceImageUpdates = [
    { id: '1', image: 'https://images.unsplash.com/photo-1583912086296-89e4d36f5012?w=800&h=600&fit=crop' },
    { id: '2', image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop' },
    { id: '3', image: 'https://images.unsplash.com/photo-1574263867128-cddc47ba885e?w=800&h=600&fit=crop' }
  ];

  for (const update of serviceImageUpdates) {
    await prisma.service.update({
      where: { id: update.id },
      data: { image: update.image }
    }).catch(() => {
      console.log(`⚠️  Service ${update.id} not found, skipping image update`);
    });
  }

  // Update equipment with Unsplash images
  const equipmentImageUpdates = [
    { id: 'eq-1', image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=600&fit=crop' },
    { id: 'eq-2', image: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&h=600&fit=crop' },
    { id: 'eq-4', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop' },
    { id: 'eq-6', image: 'https://images.unsplash.com/photo-1574263867128-cddc47ba885e?w=800&h=600&fit=crop' }
  ];

  for (const update of equipmentImageUpdates) {
    await prisma.serviceEquipment.update({
      where: { id: update.id },
      data: { image: update.image }
    }).catch(() => {
      console.log(`⚠️  Equipment ${update.id} not found, skipping image update`);
    });
  }

  // Note: Events don't have image field in the current schema, so skipping event image updates

  // Update staff members with Unsplash images
  const staffImageUpdates = [
    { id: 'staff-1', picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face' },
    { id: 'staff-2', picture: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face' },
    { id: 'staff-3', picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face' },
    { id: 'staff-4', picture: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&h=400&fit=crop&crop=face' },
    { id: 'staff-5', picture: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face' },
    { id: 'staff-6', picture: 'https://images.unsplash.com/photo-1594824730131-b0d5a8bd3d49?w=400&h=400&fit=crop&crop=face' }
  ];

  for (const update of staffImageUpdates) {
    await prisma.staff.update({
      where: { id: update.id },
      data: { picture: update.picture }
    }).catch(() => {
      console.log(`⚠️  Staff ${update.id} not found, skipping image update`);
    });
  }

  // Update service center heads with Unsplash images
  const centerHeadImageUpdates = [
    { id: 'ch-1', picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face' },
    { id: 'ch-2', picture: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face' },
    { id: 'ch-3', picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face' },
    { id: 'ch-4', picture: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face' },
    { id: 'ch-5', picture: 'https://images.unsplash.com/photo-1594824730131-b0d5a8bd3d49?w=400&h=400&fit=crop&crop=face' }
  ];

  for (const update of centerHeadImageUpdates) {
    await prisma.serviceCenterHead.update({
      where: { id: update.id },
      data: { picture: update.picture }
    }).catch(() => {
      console.log(`⚠️  Service center head ${update.id} not found, skipping image update`);
    });
  }

  // Update speakers with Unsplash images
  const speakerImageUpdates = [
    { id: 'dr-ahmed-hassan', picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face' },
    { id: 'dr-fatima-mahmoud', picture: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face' },
    { id: 'dr-mohamed-ali', picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face' }
  ];

  for (const update of speakerImageUpdates) {
    await prisma.speaker.update({
      where: { id: update.id },
      data: { picture: update.picture }
    }).catch(() => {
      console.log(`⚠️  Speaker ${update.id} not found, skipping image update`);
    });
  }

  console.log('✅ All existing data updated with Unsplash images');

  // Initialize Site Stats
  console.log('📊 Initializing site statistics...');
  const existingStats = await prisma.siteStats.findFirst();
  if (!existingStats) {
    await prisma.siteStats.create({
      data: {
        total_visits: 0,
        unique_sessions: 0
      }
    });
    console.log('✅ Site statistics initialized');
  } else {
    console.log('✅ Site statistics already exist');
  }

  console.log('🎉 Database seeding completed successfully with comprehensive relational data and Unsplash images!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
