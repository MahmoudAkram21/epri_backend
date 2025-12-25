import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create users for each role
  const hashedPassword = await bcrypt.hash("password123", 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@epri.edu" },
      update: {},
      create: {
        first_name: "Admin",
        last_name: "User",
        email: "admin@epri.edu",
        password_hash: hashedPassword,
        role: "ADMIN",
        is_verified: true,
        phone: "+201234567890",
      },
    }),
    prisma.user.upsert({
      where: { email: "student@epri.edu" },
      update: {},
      create: {
        first_name: "Ahmed",
        last_name: "Mohamed",
        email: "student@epri.edu",
        password_hash: hashedPassword,
        role: "GUEST",
        is_verified: true,
        phone: "+201234567891",
      },
    }),
    prisma.user.upsert({
      where: { email: "researcher@epri.edu" },
      update: {},
      create: {
        first_name: "Dr. Fatima",
        last_name: "Ali",
        email: "researcher@epri.edu",
        password_hash: hashedPassword,
        role: "INSTRUCTOR",
        is_verified: true,
        phone: "+201234567892",
      },
    }),
    prisma.user.upsert({
      where: { email: "instructor@epri.edu" },
      update: {},
      create: {
        first_name: "Prof. Mohamed",
        last_name: "Ibrahim",
        email: "instructor@epri.edu",
        password_hash: hashedPassword,
        role: "INSTRUCTOR",
        is_verified: true,
        phone: "+201234567893",
      },
    }),
    prisma.user.upsert({
      where: { email: "guest@epri.edu" },
      update: {},
      create: {
        first_name: "Guest",
        last_name: "User",
        email: "guest@epri.edu",
        password_hash: hashedPassword,
        role: "GUEST",
        is_verified: false,
        phone: "+201234567894",
      },
    }),
  ]);

  console.log("✅ Users created for all roles");
  console.log("   - Admin: admin@epri.edu");
  console.log("   - Student: student@epri.edu");
  console.log("   - Researcher: researcher@epri.edu");
  console.log("   - Instructor: instructor@epri.edu");
  console.log("   - Guest: guest@epri.edu");
  console.log("   All passwords: password123");

  // Create categories
  const categoryData = [
    {
      title: { en: "Petroleum Engineering", ar: "هندسة البترول" },
      description: {
        en: "Advanced petroleum engineering techniques and technologies",
        ar: "تقنيات وتكنولوجيات متقدمة في هندسة البترول",
      },
      color: "#3B82F6",
      icon: "⚙️",
    },
    {
      title: { en: "Geology & Geophysics", ar: "الجيولوجيا والجيوفيزياء" },
      description: {
        en: "Geological and geophysical research methods",
        ar: "طرق البحث الجيولوجية والجيوفيزيائية",
      },
      color: "#10B981",
      icon: "🌍",
    },
    {
      title: { en: "Environmental Studies", ar: "الدراسات البيئية" },
      description: {
        en: "Environmental impact assessment and sustainability",
        ar: "تقييم الأثر البيئي والاستدامة",
      },
      color: "#059669",
      icon: "🌱",
    },
    {
      title: { en: "Research & Development", ar: "البحث والتطوير" },
      description: {
        en: "Cutting-edge research and development projects",
        ar: "مشاريع بحثية وتطويرية متطورة",
      },
      color: "#8B5CF6",
      icon: "🔬",
    },
  ];

  const categories = await Promise.all(
    categoryData.map(async (catData) => {
      // Try to find existing category by matching the English title in JSON
      const allCategories = await prisma.category.findMany();
      const existing = allCategories.find((cat: any) => {
        const title = cat.title as any;
        return title?.en === (catData.title as any).en;
      });

      if (existing) {
        return existing;
      }

      return prisma.category.create({
        data: catData,
      });
    })
  );

  console.log("✅ Categories created");

  // Create addresses
  const addresses = await Promise.all([
    prisma.address.upsert({
      where: { id: "main-campus" },
      update: {},
      create: {
        id: "main-campus",
        title: "EPRI Main Campus",
        line_1: "1 Ahmed El-Zomor Street",
        line_2: "Nasr City",
        city: "Cairo",
        state: "Cairo",
        country: "Egypt",
        postal_code: "11765",
        map_link: "https://maps.google.com/?q=EPRI+Cairo",
        latitude: 30.0444,
        longitude: 31.2357,
      },
    }),
    prisma.address.upsert({
      where: { id: "research-center" },
      update: {},
      create: {
        id: "research-center",
        title: "EPRI Research Center",
        line_1: "15 Research Avenue",
        line_2: "New Administrative Capital",
        city: "Cairo",
        state: "Cairo",
        country: "Egypt",
        postal_code: "11835",
        map_link: "https://maps.google.com/?q=EPRI+Research+Center",
        latitude: 30.0281,
        longitude: 31.4999,
      },
    }),
  ]);

  console.log("✅ Addresses created");

  // Create speakers
  const speakers = await Promise.all([
    prisma.speaker.upsert({
      where: { id: "dr-ahmed-hassan" },
      update: {},
      create: {
        id: "dr-ahmed-hassan",
        name: "Dr. Ahmed Hassan",
        title: "Senior Petroleum Engineer",
        bio: "Expert in reservoir engineering with 20+ years of experience in the oil and gas industry.",
        picture: "/speakers/dr-ahmed-hassan.jpg",
        topics: JSON.stringify([
          "Reservoir Engineering",
          "Enhanced Oil Recovery",
          "Well Testing",
        ]),
        expertise: "Petroleum Engineering",
        institution: "Egyptian Petroleum Research Institute",
        linkedin: "https://linkedin.com/in/ahmed-hassan",
        twitter: "https://twitter.com/ahmed_hassan",
      },
    }),
    prisma.speaker.upsert({
      where: { id: "dr-fatima-mahmoud" },
      update: {},
      create: {
        id: "dr-fatima-mahmoud",
        name: "Dr. Fatima Mahmoud",
        title: "Chief Geologist",
        bio: "Leading expert in geological modeling and seismic interpretation.",
        picture: "/speakers/dr-fatima-mahmoud.jpg",
        topics: JSON.stringify([
          "Geological Modeling",
          "Seismic Interpretation",
          "Exploration Geology",
        ]),
        expertise: "Geology & Geophysics",
        institution: "Egyptian Petroleum Research Institute",
        linkedin: "https://linkedin.com/in/fatima-mahmoud",
        twitter: "https://twitter.com/fatima_mahmoud",
      },
    }),
    prisma.speaker.upsert({
      where: { id: "dr-mohamed-ali" },
      update: {},
      create: {
        id: "dr-mohamed-ali",
        name: "Dr. Mohamed Ali",
        title: "Environmental Consultant",
        bio: "Specialist in environmental impact assessment and sustainable energy practices.",
        picture: "/speakers/dr-mohamed-ali.jpg",
        topics: JSON.stringify([
          "Environmental Impact Assessment",
          "Sustainable Energy",
          "Climate Change",
        ]),
        expertise: "Environmental Studies",
        institution: "Egyptian Petroleum Research Institute",
        linkedin: "https://linkedin.com/in/mohamed-ali",
        twitter: "https://twitter.com/mohamed_ali",
      },
    }),
  ]);

  console.log("✅ Speakers created");

  // Create Department Sections
  const sections = await Promise.all([
    prisma.departmentSection.upsert({
      where: { slug: "exploration" },
      update: {},
      create: { name: "Exploration", slug: "exploration", order_index: 1 },
    }),
    prisma.departmentSection.upsert({
      where: { slug: "production" },
      update: {},
      create: { name: "Production", slug: "production", order_index: 2 },
    }),
    prisma.departmentSection.upsert({
      where: { slug: "analysis-evaluation" },
      update: {},
      create: {
        name: "Analysis & Evaluation",
        slug: "analysis-evaluation",
        order_index: 3,
      },
    }),
    prisma.departmentSection.upsert({
      where: { slug: "refining" },
      update: {},
      create: { name: "Refining", slug: "refining", order_index: 4 },
    }),
    prisma.departmentSection.upsert({
      where: { slug: "petroleum-applications" },
      update: {},
      create: {
        name: "Petroleum Applications",
        slug: "petroleum-applications",
        order_index: 5,
      },
    }),
    prisma.departmentSection.upsert({
      where: { slug: "petrochemicals" },
      update: {},
      create: {
        name: "Petrochemicals",
        slug: "petrochemicals",
        order_index: 6,
      },
    }),
    prisma.departmentSection.upsert({
      where: { slug: "processes-design-develop" },
      update: {},
      create: {
        name: "Processes Design & Develop",
        slug: "processes-design-develop",
        order_index: 7,
      },
    }),
  ]);

  console.log("✅ Department sections created");

  // Create comprehensive departments and assign to appropriate sections
  const departmentsData = [
    // Exploration Section
    {
      id: "dept-sedimentology",
      name: "Sedimentology Laboratory",
      description:
        "Advanced sedimentological analysis and research facility specializing in sediment characterization, depositional environment interpretation, and reservoir quality assessment.",
      image: "/petroleum-lab-testing.jpg",
      icon: "🪨",
      section: "exploration",
    },
    {
      id: "dept-paleontology",
      name: "Paleontology Laboratory",
      description:
        "Specialized facility for micropaleontological and biostratigraphic analysis, providing age dating, paleoenvironmental interpretation, and correlation services for petroleum exploration.",
      image: "/petroleum-lab-testing.jpg",
      icon: "🦴",
      section: "exploration",
    },
    {
      id: "dept-geophysics",
      name: "Geophysics Laboratory",
      description:
        "Advanced geophysical research facility equipped with state-of-the-art instruments for seismic data processing, well log analysis, and geophysical modeling for petroleum exploration and reservoir characterization.",
      image: "/geophysical-survey.jpg",
      icon: "📊",
      section: "exploration",
    },
    {
      id: "dept-drilling",
      name: "Drilling Engineering",
      description:
        "Specialized in drilling fluid analysis, wellbore stability assessment, and drilling optimization for petroleum exploration and production.",
      image: "/drilling-engineering.jpg",
      icon: "⛏️",
      section: "exploration",
    },
    // Production Section
    {
      id: "dept-reservoir",
      name: "Reservoir Engineering",
      description:
        "Expertise in reservoir characterization, production optimization, and enhanced oil recovery techniques for maximizing hydrocarbon recovery.",
      image: "/reservoir-engineering.jpg",
      icon: "🛢️",
      section: "production",
    },
    {
      id: "dept-production",
      name: "Production Technology",
      description:
        "Advanced production engineering services including well completion design, production optimization, and artificial lift systems.",
      image: "/petroleum-lab-testing.jpg",
      icon: "⚙️",
      section: "production",
    },
    // Analysis & Evaluation Section
    {
      id: "dept-core-analysis",
      name: "Core Analysis Laboratory",
      description:
        "Comprehensive core analysis services including porosity, permeability, saturation, and petrophysical property measurements.",
      image: "/core-analysis-equipment.jpg",
      icon: "🔬",
      section: "analysis-evaluation",
    },
    {
      id: "dept-chemical-analysis",
      name: "Chemical Analysis Laboratory",
      description:
        "State-of-the-art equipment for chemical analysis, composition determination, and quality control of petroleum products.",
      image: "/petroleum-lab-testing.jpg",
      icon: "🧪",
      section: "analysis-evaluation",
    },
    {
      id: "dept-spectroscopy",
      name: "Spectroscopy Laboratory",
      description:
        "Advanced spectroscopic analysis using GC-MS, IR spectroscopy, and other analytical techniques for petroleum product characterization.",
      image: "/gc-ms-equipment.jpg",
      icon: "📡",
      section: "analysis-evaluation",
    },
    {
      id: "dept-corrosion",
      name: "Corrosion Testing Laboratory",
      description:
        "Specialized corrosion testing and evaluation services for materials used in petroleum production and refining operations.",
      image: "/corrosion-testing.jpg",
      icon: "⚗️",
      section: "analysis-evaluation",
    },
    {
      id: "dept-soil",
      name: "Soil Analysis Laboratory",
      description:
        "Complete facility for soil contamination assessment, environmental monitoring, and remediation evaluation.",
      image: "/soil-analysis-lab.jpg",
      icon: "🌍",
      section: "analysis-evaluation",
    },
    {
      id: "dept-mud",
      name: "Mud Testing Laboratory",
      description:
        "Complete facility for drilling fluid analysis and testing, including rheology measurements and filtration testing.",
      image: "/mud-testing-lab.jpg",
      icon: "🧪",
      section: "analysis-evaluation",
    },
    // Refining Section
    {
      id: "dept-refining",
      name: "Refining Technology",
      description:
        "Advanced refining processes, catalyst development, and optimization of petroleum refining operations for improved product quality and yield.",
      image: "/spectrophotometer-equipment.jpg",
      icon: "⚗️",
      section: "refining",
    },
    {
      id: "dept-distillation",
      name: "Distillation & Separation",
      description:
        "Specialized in distillation processes, separation technologies, and fractionation for petroleum refining.",
      image: "/petroleum-lab-testing.jpg",
      icon: "🔬",
      section: "refining",
    },
    // Petroleum Applications Section
    {
      id: "dept-applications",
      name: "Petroleum Applications Research",
      description:
        "Development and testing of petroleum-based products, lubricants, and specialty chemicals for various industrial applications.",
      image: "/petroleum-lab-testing.jpg",
      icon: "🔧",
      section: "petroleum-applications",
    },
    {
      id: "dept-lubricants",
      name: "Lubricants Development",
      description:
        "Research and development of advanced lubricants, greases, and specialty oils for automotive and industrial applications.",
      image: "/petroleum-lab-testing.jpg",
      icon: "⚙️",
      section: "petroleum-applications",
    },
    // Petrochemicals Section
    {
      id: "dept-petrochemicals",
      name: "Petrochemicals Research",
      description:
        "Research and development in petrochemical processes, polymer synthesis, and specialty chemical production from petroleum feedstocks.",
      image: "/petroleum-lab-testing.jpg",
      icon: "🧬",
      section: "petrochemicals",
    },
    {
      id: "dept-polymers",
      name: "Polymers & Plastics",
      description:
        "Advanced polymer research, plastic development, and materials engineering for various industrial and commercial applications.",
      image: "/petroleum-lab-testing.jpg",
      icon: "🔬",
      section: "petrochemicals",
    },
    // Processes Design & Develop Section
    {
      id: "dept-process-design",
      name: "Process Design & Development",
      description:
        "Engineering design and development of petroleum processing facilities, including feasibility studies and process optimization.",
      image: "/simulation-workstation.jpg",
      icon: "📐",
      section: "processes-design-develop",
    },
    {
      id: "dept-simulation",
      name: "Process Simulation",
      description:
        "Computer-aided process simulation, modeling, and optimization for petroleum and petrochemical operations.",
      image: "/simulation-workstation.jpg",
      icon: "💻",
      section: "processes-design-develop",
    },
    {
      id: "dept-environmental",
      name: "Environmental Assessment",
      description:
        "Environmental impact assessment, monitoring, and sustainable practices for petroleum operations.",
      image: "/environmental-assessment.jpg",
      icon: "🌱",
      section: "processes-design-develop",
    },
  ];

  // Map section slugs to section IDs
  const sectionMap = new Map<string, string>();
  sections.forEach((section) => {
    sectionMap.set(section.slug, section.id);
  });

  // Gallery images for departments
  const departmentGalleries: Record<string, string[]> = {
    "dept-sedimentology": [
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1505731132164-cca90383e1af?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
    ],
    "dept-paleontology": [
      "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1514996937319-344454492b37?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1503389152951-9f343605f61e?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=600&fit=crop",
    ],
    "dept-geophysics": [
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1569228037739-37f4c9e2ab89?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=800&h=600&fit=crop",
    ],
    "dept-drilling": [
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1569228037739-37f4c9e2ab89?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1505731132164-cca90383e1af?w=800&h=600&fit=crop",
    ],
    "dept-reservoir": [
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1514996937319-344454492b37?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1503389152951-9f343605f61e?w=800&h=600&fit=crop",
    ],
    "dept-production": [
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&h=600&fit=crop",
    ],
    "dept-core-analysis": [
      "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1505731132164-cca90383e1af?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=800&h=600&fit=crop",
    ],
    "dept-chemical-analysis": [
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&h=600&fit=crop",
    ],
    "dept-spectroscopy": [
      "https://images.unsplash.com/photo-1514996937319-344454492b37?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1503389152951-9f343605f61e?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
    ],
    "dept-corrosion": [
      "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1514996937319-344454492b37?w=800&h=600&fit=crop",
    ],
    "dept-soil": [
      "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1505731132164-cca90383e1af?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
    ],
    "dept-mud": [
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1505731132164-cca90383e1af?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=600&fit=crop",
    ],
    "dept-refining": [
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1514996937319-344454492b37?w=800&h=600&fit=crop",
    ],
    "dept-distillation": [
      "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1505731132164-cca90383e1af?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=800&h=600&fit=crop",
    ],
    "dept-applications": [
      "https://images.unsplash.com/photo-1514996937319-344454492b37?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1503389152951-9f343605f61e?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
    ],
    "dept-lubricants": [
      "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1514996937319-344454492b37?w=800&h=600&fit=crop",
    ],
    "dept-petrochemicals": [
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&h=600&fit=crop",
    ],
    "dept-polymers": [
      "https://images.unsplash.com/photo-1514996937319-344454492b37?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1503389152951-9f343605f61e?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
    ],
    "dept-process-design": [
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1569228037739-37f4c9e2ab89?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1505731132164-cca90383e1af?w=800&h=600&fit=crop",
    ],
    "dept-simulation": [
      "https://images.unsplash.com/photo-1505731132164-cca90383e1af?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1514996937319-344454492b37?w=800&h=600&fit=crop",
    ],
    "dept-environmental": [
      "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1505731132164-cca90383e1af?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
    ],
  };

  // Create departments
  const departments = await Promise.all(
    departmentsData.map((dept) => {
      const gallery = departmentGalleries[dept.id];
      return prisma.department.upsert({
        where: { id: dept.id },
        update: {
          name: dept.name,
          description: dept.description,
          image: dept.image,
          icon: dept.icon,
          section_id: sectionMap.get(dept.section) || null,
          ...(gallery ? { gallery } : {}),
        },
        create: {
          id: dept.id,
          name: dept.name,
          description: dept.description,
          image: dept.image,
          icon: dept.icon,
          section_id: sectionMap.get(dept.section) || null,
          ...(gallery ? { gallery } : {}),
        },
      });
    })
  );

  console.log(`✅ ${departments.length} departments created/updated`);

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@epri.edu" },
    update: {},
    create: {
      first_name: "Admin",
      last_name: "User",
      email: "admin@epri.edu",
      password_hash: adminPassword,
      role: "ADMIN",
      is_verified: true,
    },
  });

  console.log("✅ Admin user created");

  // Create Department Manager users for each department
  const departmentManagersData = [
    {
      department_id: "dept-sedimentology",
      email: "dept.sedimentology@epri.edu",
      first_name: "Dr. Samira",
      last_name: "El-Naggar",
      phone: "+201234567900",
    },
    {
      department_id: "dept-paleontology",
      email: "dept.paleontology@epri.edu",
      first_name: "Dr. Yasmine",
      last_name: "Farid",
      phone: "+201234567901",
    },
    {
      department_id: "dept-geophysics",
      email: "dept.geophysics@epri.edu",
      first_name: "Prof. Dr. Magdy",
      last_name: "El-Sayed",
      phone: "+201234567902",
    },
    {
      department_id: "dept-drilling",
      email: "dept.drilling@epri.edu",
      first_name: "Eng. Khaled",
      last_name: "Mahmoud",
      phone: "+201234567903",
    },
    {
      department_id: "dept-reservoir",
      email: "dept.reservoir@epri.edu",
      first_name: "Prof. Dr. Ahmed",
      last_name: "El-Mahdy",
      phone: "+201234567904",
    },
    {
      department_id: "dept-production",
      email: "dept.production@epri.edu",
      first_name: "Eng. Mahmoud",
      last_name: "El-Sherif",
      phone: "+201234567905",
    },
    {
      department_id: "dept-core-analysis",
      email: "dept.core-analysis@epri.edu",
      first_name: "Dr. Amira",
      last_name: "Fouad",
      phone: "+201234567906",
    },
    {
      department_id: "dept-chemical-analysis",
      email: "dept.chemical-analysis@epri.edu",
      first_name: "Dr. Rania",
      last_name: "El-Khatib",
      phone: "+201234567907",
    },
    {
      department_id: "dept-spectroscopy",
      email: "dept.spectroscopy@epri.edu",
      first_name: "Dr. Hala",
      last_name: "Kamel",
      phone: "+201234567908",
    },
    {
      department_id: "dept-corrosion",
      email: "dept.corrosion@epri.edu",
      first_name: "Dr. Mohamed",
      last_name: "El-Badry",
      phone: "+201234567909",
    },
    {
      department_id: "dept-soil",
      email: "dept.soil@epri.edu",
      first_name: "Dr. Magdy",
      last_name: "Hassan",
      phone: "+201234567910",
    },
    {
      department_id: "dept-mud",
      email: "dept.mud@epri.edu",
      first_name: "Dr. Wael",
      last_name: "El-Kady",
      phone: "+201234567911",
    },
    {
      department_id: "dept-refining",
      email: "dept.refining@epri.edu",
      first_name: "Prof. Dr. Samir",
      last_name: "El-Gamal",
      phone: "+201234567912",
    },
    {
      department_id: "dept-distillation",
      email: "dept.distillation@epri.edu",
      first_name: "Dr. Amr",
      last_name: "El-Sawy",
      phone: "+201234567913",
    },
    {
      department_id: "dept-applications",
      email: "dept.applications@epri.edu",
      first_name: "Dr. Sherine",
      last_name: "El-Mahdy",
      phone: "+201234567914",
    },
    {
      department_id: "dept-lubricants",
      email: "dept.lubricants@epri.edu",
      first_name: "Dr. Hossam",
      last_name: "El-Din",
      phone: "+201234567915",
    },
    {
      department_id: "dept-petrochemicals",
      email: "dept.petrochemicals@epri.edu",
      first_name: "Prof. Dr. Magdy",
      last_name: "El-Shazly",
      phone: "+201234567916",
    },
    {
      department_id: "dept-polymers",
      email: "dept.polymers@epri.edu",
      first_name: "Dr. Tarek",
      last_name: "El-Shazly",
      phone: "+201234567917",
    },
    {
      department_id: "dept-process-design",
      email: "dept.process-design@epri.edu",
      first_name: "Prof. Dr. Samy",
      last_name: "El-Mahdy",
      phone: "+201234567918",
    },
    {
      department_id: "dept-simulation",
      email: "dept.simulation@epri.edu",
      first_name: "Dr. Karim",
      last_name: "El-Mahdy",
      phone: "+201234567919",
    },
    {
      department_id: "dept-environmental",
      email: "dept.environmental@epri.edu",
      first_name: "Dr. Mohamed",
      last_name: "El-Mahdy",
      phone: "+201234567920",
    },
  ];

  const departmentManagers = await Promise.all(
    departmentManagersData.map((manager) =>
      prisma.user.upsert({
        where: { email: manager.email },
        update: {
          department_id: manager.department_id,
          role: "DEPARTMENT_MANAGER",
        },
        create: {
          first_name: manager.first_name,
          last_name: manager.last_name,
          email: manager.email,
          password_hash: hashedPassword,
          role: "DEPARTMENT_MANAGER",
          department_id: manager.department_id,
          is_verified: true,
          phone: manager.phone,
        },
      })
    )
  );

  console.log(
    `✅ ${departmentManagers.length} department manager users created/updated`
  );
  console.log("   All department managers password: password123");

  // Create sample events
  const events = await Promise.all([
    prisma.event.upsert({
      where: { id: "petroleum-conference-2024" },
      update: {},
      create: {
        id: "petroleum-conference-2024",
        title: "International Petroleum Engineering Conference 2024",
        description:
          "Join us for the premier petroleum engineering conference featuring cutting-edge research and industry innovations.",
        start_date: new Date("2024-12-15T09:00:00Z"),
        end_date: new Date("2024-12-17T17:00:00Z"),
        price: 250.0,
        capacity: 300,
        status: "PUBLISHED",
        featured: true,
        registration_open: true,
        address_id: addresses[0].id,
      },
    }),
    prisma.event.upsert({
      where: { id: "geology-workshop-2024" },
      update: {},
      create: {
        id: "geology-workshop-2024",
        title: "Advanced Geological Modeling Workshop",
        description:
          "Hands-on workshop on modern geological modeling techniques and software applications.",
        start_date: new Date("2024-11-20T10:00:00Z"),
        end_date: new Date("2024-11-22T16:00:00Z"),
        price: 150.0,
        capacity: 50,
        status: "PUBLISHED",
        featured: false,
        registration_open: true,
        address_id: addresses[1].id,
      },
    }),
    prisma.event.upsert({
      where: { id: "environmental-seminar-2024" },
      update: {},
      create: {
        id: "environmental-seminar-2024",
        title: "Environmental Impact Assessment Seminar",
        description:
          "Comprehensive seminar on environmental impact assessment methodologies and best practices.",
        start_date: new Date("2024-10-25T14:00:00Z"),
        end_date: new Date("2024-10-25T18:00:00Z"),
        price: 75.0,
        capacity: 100,
        status: "PUBLISHED",
        featured: false,
        registration_open: true,
        address_id: addresses[0].id,
      },
    }),
  ]);

  console.log("✅ Events created");

  // Connect events to categories
  if (categories.length >= 4 && events.length >= 3) {
    await Promise.all([
      // Petroleum Conference - Petroleum Engineering & R&D
      prisma.eventCategory.createMany({
        data: [
          { event_id: events[0]!.id, category_id: categories[0]!.id },
          { event_id: events[0]!.id, category_id: categories[3]!.id },
        ],
        skipDuplicates: true,
      }),
      // Geology Workshop - Geology & Geophysics
      prisma.eventCategory.createMany({
        data: [{ event_id: events[1]!.id, category_id: categories[1]!.id }],
        skipDuplicates: true,
      }),
      // Environmental Seminar - Environmental Studies
      prisma.eventCategory.createMany({
        data: [{ event_id: events[2]!.id, category_id: categories[2]!.id }],
        skipDuplicates: true,
      }),
    ]);
  }

  // Connect speakers to events
  await Promise.all([
    // Connect speakers to petroleum conference
    prisma.speaker.update({
      where: { id: speakers[0].id },
      data: {
        events: {
          connect: { id: events[0].id },
        },
      },
    }),
    // Connect speakers to geology workshop
    prisma.speaker.update({
      where: { id: speakers[1].id },
      data: {
        events: {
          connect: { id: events[1].id },
        },
      },
    }),
    // Connect speakers to environmental seminar
    prisma.speaker.update({
      where: { id: speakers[2].id },
      data: {
        events: {
          connect: { id: events[2].id },
        },
      },
    }),
  ]);

  console.log("✅ Event relationships created");

  // Create comprehensive course seeds with different delivery types
  // Helper function to convert string to Json format
  const toJson = (en: string, ar?: string) => ({ en, ar: ar || en });

  const coursesData = [
    {
      id: "petroleum-fundamentals",
      title: "Petroleum Engineering Fundamentals",
      subtitle: "Introduction to Oil & Gas Industry",
      description:
        "Comprehensive introduction to petroleum engineering principles, reservoir mechanics, drilling operations, and production optimization. This course covers the fundamental concepts every petroleum engineer should know.",
      image:
        "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
      instructor_id: users.find((u) => u.role === "INSTRUCTOR")?.id,
      instructor_name: toJson("Prof. Mohamed Ibrahim", "أ.د. محمد إبراهيم"),
      category: toJson("Petroleum Engineering", "هندسة البترول"),
      price: 299.0,
      is_free: false,
      duration_hours: 40,
      duration_weeks: 8,
      level: toJson("BEGINNER", "مبتدئ"),
      language: toJson("English", "الإنجليزية"),
      max_students: 100,
      is_published: true,
      is_featured: true,
      delivery_type: "ONLINE",
      zoom_link: "https://zoom.us/j/123456789",
      meeting_id: "123 456 789",
      meeting_passcode: "EPRI2024",
      platform: "Zoom",
      start_date: new Date("2024-12-01T09:00:00Z"),
      end_date: new Date("2025-02-28T17:00:00Z"),
      schedule_info: "Every Tuesday and Thursday, 9:00 AM - 12:00 PM UTC",
      time_zone: "UTC",
      objectives: JSON.stringify([
        "Understand fundamental petroleum engineering concepts",
        "Learn about reservoir characterization and evaluation",
        "Master drilling and completion techniques",
        "Analyze production optimization strategies",
        "Apply economic evaluation methods for petroleum projects",
      ]),
      requirements: JSON.stringify([
        "Basic engineering mathematics knowledge",
        "Fundamental understanding of geology",
        "Access to computer with internet connection",
        "No prior petroleum engineering experience required",
      ]),
      rating_average: 4.7,
      rating_count: 124,
      enrollment_count: 89,
    },
    {
      id: "advanced-geology",
      title: "Advanced Geological Analysis & Interpretation",
      subtitle: "Master Advanced Geological Techniques",
      description:
        "Advanced course covering sophisticated geological analysis techniques, seismic interpretation, and structural geology for petroleum exploration. Includes hands-on training with industry-standard software.",
      image:
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop",
      instructor_id: users.find((u) => u.role === "INSTRUCTOR")?.id,
      instructor_name: "Dr. Fatima Ali",
      category: toJson("Geology & Geophysics", "الجيولوجيا والجيوفيزياء"),
      price: 499.0,
      is_free: false,
      duration_hours: 60,
      duration_weeks: 10,
      level: toJson("ADVANCED", "متقدم"),
      language: toJson("English", "الإنجليزية"),
      max_students: 30,
      is_published: true,
      is_featured: true,
      delivery_type: "HYBRID",
      meeting_location: toJson(
        "EPRI Main Campus - Geology Building",
        "الحرم الرئيسي لـ EPRI - مبنى الجيولوجيا"
      ),
      room_number: "Room 201",
      building: "Geology Building",
      address:
        "1 Ahmed El-Zomor Street, El Zohour Region, Nasr city, Cairo, Egypt",
      zoom_link: "https://teams.microsoft.com/l/meetup-join/19%3ameeting",
      meeting_id: "ADV-GEO-2024",
      meeting_passcode: "Geology2024",
      platform: "Microsoft Teams",
      start_date: new Date("2024-12-15T08:00:00Z"),
      end_date: new Date("2025-03-15T18:00:00Z"),
      schedule_info:
        "Week 1-5: Online sessions (Mon & Wed 8:00-11:00 AM), Week 6-10: On-campus labs (Fri 9:00-17:00)",
      time_zone: "Africa/Cairo",
      objectives: JSON.stringify([
        "Master advanced seismic interpretation techniques",
        "Perform complex structural geology analysis",
        "Use industry-standard geological software",
        "Integrate geological and geophysical data",
        "Develop prospect evaluation skills",
      ]),
      requirements: JSON.stringify([
        "Bachelor degree in Geology or related field",
        "Minimum 2 years of geological experience",
        "Basic knowledge of seismic interpretation",
        "Laptop with Windows 10 or higher",
        "Access to geological software (provided during course)",
      ]),
      rating_average: 4.9,
      rating_count: 67,
      enrollment_count: 28,
    },
    {
      id: "reservoir-simulation",
      title: "Reservoir Simulation & Modeling",
      subtitle: "Advanced Reservoir Engineering Techniques",
      description:
        "Comprehensive course on reservoir simulation using industry-standard software. Learn to build, history match, and forecast reservoir performance using advanced simulation techniques.",
      image:
        "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
      instructor_id: users.find((u) => u.role === "INSTRUCTOR")?.id,
      instructor_name: "Prof. Mohamed Ibrahim",
      category: "Reservoir Engineering",
      price: 699.0,
      is_free: false,
      duration_hours: 80,
      duration_weeks: 12,
      level: "ADVANCED",
      language: "English",
      max_students: 25,
      is_published: true,
      is_featured: true,
      delivery_type: "OFFLINE",
      meeting_location: "EPRI Research Center - Simulation Lab",
      room_number: "Lab 105",
      building: "Research Center Building B",
      address: "15 Research Avenue, New Administrative Capital, Cairo, Egypt",
      start_date: new Date("2025-01-15T09:00:00Z"),
      end_date: new Date("2025-04-15T17:00:00Z"),
      schedule_info:
        "Monday to Wednesday, 9:00 AM - 1:00 PM, with additional lab sessions on Fridays",
      time_zone: "Africa/Cairo",
      objectives: JSON.stringify([
        "Build complex reservoir simulation models",
        "Perform history matching and uncertainty analysis",
        "Master enhanced oil recovery simulation",
        "Optimize production strategies using simulation",
        "Integrate geological and engineering data",
      ]),
      requirements: JSON.stringify([
        "Masters degree in Petroleum Engineering or equivalent",
        "Minimum 5 years of reservoir engineering experience",
        "Experience with reservoir engineering software",
        "Strong background in mathematics and statistics",
        "Must attend all on-campus sessions",
      ]),
      rating_average: 4.8,
      rating_count: 43,
      enrollment_count: 24,
    },
    {
      id: "environmental-petroleum",
      title: "Environmental Management in Petroleum Operations",
      subtitle: "Sustainable Practices for Oil & Gas Industry",
      description:
        "Learn about environmental regulations, impact assessment, and sustainable practices in petroleum operations. Covers both theoretical concepts and practical case studies.",
      image:
        "https://images.unsplash.com/photo-1574263867128-cddc47ba885e?w=800&h=600&fit=crop",
      instructor_id: users.find((u) => u.role === "INSTRUCTOR")?.id,
      instructor_name: "Dr. Fatima Ali",
      category: toJson("Environmental Studies", "الدراسات البيئية"),
      price: 399.0,
      is_free: false,
      duration_hours: 45,
      duration_weeks: 9,
      level: toJson("INTERMEDIATE", "متوسط"),
      language: toJson("English", "الإنجليزية"),
      max_students: 50,
      is_published: true,
      is_featured: false,
      delivery_type: "ONLINE",
      zoom_link: "https://webex.cisco.com/meet/environment2024",
      meeting_id: "ENV-PET-2024",
      meeting_passcode: "Environment24",
      platform: "Cisco Webex",
      start_date: new Date("2024-12-20T14:00:00Z"),
      end_date: new Date("2025-02-20T16:00:00Z"),
      schedule_info: "Every Monday and Thursday, 2:00 PM - 4:30 PM UTC",
      time_zone: "UTC",
      objectives: JSON.stringify([
        "Understand environmental regulations in petroleum industry",
        "Conduct environmental impact assessments",
        "Develop environmental management plans",
        "Implement sustainable practices in operations",
        "Manage environmental compliance and reporting",
      ]),
      requirements: JSON.stringify([
        "Bachelor degree in Engineering or Environmental Science",
        "Basic understanding of petroleum operations",
        "No prior environmental management experience required",
        "Reliable internet connection for online sessions",
      ]),
      rating_average: 4.5,
      rating_count: 92,
      enrollment_count: 47,
    },
    {
      id: "drilling-optimization",
      title: "Drilling Engineering & Optimization",
      subtitle: "Advanced Drilling Techniques and Best Practices",
      description:
        "Comprehensive drilling engineering course covering well design, drilling fluid optimization, directional drilling, and wellbore stability. Includes practical drilling simulations.",
      image:
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=600&fit=crop",
      instructor_id: users.find((u) => u.role === "INSTRUCTOR")?.id,
      instructor_name: "Prof. Mohamed Ibrahim",
      category: "Drilling Engineering",
      price: 599.0,
      is_free: false,
      duration_hours: 70,
      duration_weeks: 10,
      level: "INTERMEDIATE",
      language: "English",
      max_students: 35,
      is_published: true,
      is_featured: true,
      delivery_type: "HYBRID",
      meeting_location: "EPRI Main Campus - Drilling Lab",
      room_number: "Lab 301",
      building: "Engineering Building",
      address:
        "1 Ahmed El-Zomor Street, El Zohour Region, Nasr city, Cairo, Egypt",
      zoom_link: "https://zoom.us/j/987654321",
      meeting_id: "987 654 321",
      meeting_passcode: "Drilling24",
      platform: "Zoom",
      start_date: new Date("2025-01-10T08:00:00Z"),
      end_date: new Date("2025-03-20T17:00:00Z"),
      schedule_info:
        "Weeks 1-6: Online theory (Tue & Thu 8:00-11:00 AM), Weeks 7-10: Hands-on labs (Sat 9:00-17:00)",
      time_zone: "Africa/Cairo",
      objectives: JSON.stringify([
        "Design optimal drilling programs",
        "Optimize drilling fluid properties",
        "Plan and execute directional drilling",
        "Analyze wellbore stability issues",
        "Troubleshoot drilling problems",
      ]),
      requirements: JSON.stringify([
        "Bachelor degree in Petroleum or Mechanical Engineering",
        "Basic knowledge of drilling operations",
        "Experience with engineering calculations",
        "Must attend all laboratory sessions",
        "Safety training completion required",
      ]),
      rating_average: 4.6,
      rating_count: 78,
      enrollment_count: 33,
    },
    {
      id: "petroleum-economics",
      title: "Petroleum Economics & Project Evaluation",
      subtitle: "Financial Analysis for Oil & Gas Projects",
      description:
        "Learn economic evaluation techniques for petroleum projects including risk analysis, investment decisions, and portfolio optimization. Essential for project managers and economists.",
      image:
        "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&h=600&fit=crop",
      instructor_id: users.find((u) => u.role === "ADMIN")?.id,
      instructor_name: toJson("Admin User", "مستخدم الإدارة"),
      category: toJson("Economics & Finance", "الاقتصاد والمالية"),
      price: 449.0,
      is_free: false,
      duration_hours: 50,
      duration_weeks: 8,
      level: toJson("INTERMEDIATE", "متوسط"),
      language: toJson("English", "الإنجليزية"),
      max_students: 40,
      is_published: true,
      is_featured: false,
      delivery_type: "ONLINE",
      zoom_link: "https://meet.google.com/abc-defg-hij",
      meeting_id: "PET-ECON-2024",
      meeting_passcode: "Economics24",
      platform: "Google Meet",
      start_date: new Date("2025-02-01T10:00:00Z"),
      end_date: new Date("2025-03-30T12:00:00Z"),
      schedule_info:
        "Every Tuesday, Wednesday, and Friday, 10:00 AM - 12:30 PM UTC",
      time_zone: "UTC",
      objectives: JSON.stringify([
        "Master petroleum project economics",
        "Perform risk and sensitivity analysis",
        "Evaluate investment opportunities",
        "Understand fiscal systems and contracts",
        "Optimize project portfolios",
      ]),
      requirements: JSON.stringify([
        "Bachelor degree in Engineering, Economics, or Finance",
        "Basic understanding of petroleum industry",
        "Familiarity with Excel or similar spreadsheet software",
        "Calculator for financial calculations",
      ]),
      rating_average: 4.4,
      rating_count: 56,
      enrollment_count: 38,
    },
    {
      id: "introduction-geophysics",
      title: "Introduction to Petroleum Geophysics",
      subtitle: "Fundamentals of Seismic Exploration",
      description:
        "Beginner-friendly introduction to geophysical methods used in petroleum exploration. Covers seismic data acquisition, processing, and basic interpretation techniques.",
      image:
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop",
      instructor_id: users.find((u) => u.role === "INSTRUCTOR")?.id,
      instructor_name: "Dr. Fatima Ali",
      category: "Geology & Geophysics",
      price: 0.0,
      is_free: true,
      duration_hours: 25,
      duration_weeks: 5,
      level: "BEGINNER",
      language: "English",
      max_students: 150,
      is_published: true,
      is_featured: true,
      delivery_type: "ONLINE",
      zoom_link: "https://zoom.us/j/555666777",
      meeting_id: "555 666 777",
      meeting_passcode: "GeoFree24",
      platform: "Zoom",
      start_date: new Date("2024-11-25T15:00:00Z"),
      end_date: new Date("2024-12-30T17:00:00Z"),
      schedule_info: "Every Monday and Wednesday, 3:00 PM - 5:30 PM UTC",
      time_zone: "UTC",
      objectives: JSON.stringify([
        "Understand basic geophysical principles",
        "Learn seismic data acquisition methods",
        "Interpret basic seismic sections",
        "Recognize geological features in seismic data",
        "Apply geophysics in petroleum exploration",
      ]),
      requirements: JSON.stringify([
        "High school diploma or equivalent",
        "Basic understanding of physics and mathematics",
        "Interest in earth sciences",
        "No prior geophysics experience required",
      ]),
      rating_average: 4.3,
      rating_count: 203,
      enrollment_count: 142,
    },
    {
      id: "production-engineering",
      title: "Production Engineering & Well Optimization",
      subtitle: "Maximize Well Performance and Recovery",
      description:
        "Advanced production engineering course covering well completion design, artificial lift systems, production optimization, and enhanced oil recovery techniques.",
      image:
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=600&fit=crop",
      instructor_id: users.find((u) => u.role === "INSTRUCTOR")?.id,
      instructor_name: "Prof. Mohamed Ibrahim",
      category: "Production Engineering",
      price: 549.0,
      is_free: false,
      duration_hours: 65,
      duration_weeks: 11,
      level: "ADVANCED",
      language: "English",
      max_students: 30,
      is_published: true,
      is_featured: false,
      delivery_type: "OFFLINE",
      meeting_location: "EPRI Research Center - Production Lab",
      room_number: "Lab 203",
      building: "Production Engineering Building",
      address: "15 Research Avenue, New Administrative Capital, Cairo, Egypt",
      start_date: new Date("2025-02-15T09:00:00Z"),
      end_date: new Date("2025-05-10T16:00:00Z"),
      schedule_info:
        "Monday, Wednesday, Friday 9:00 AM - 1:00 PM, with field trips on selected Saturdays",
      time_zone: "Africa/Cairo",
      objectives: JSON.stringify([
        "Design optimal well completion systems",
        "Select and optimize artificial lift methods",
        "Analyze well performance and decline curves",
        "Implement enhanced oil recovery techniques",
        "Manage production operations efficiently",
      ]),
      requirements: JSON.stringify([
        "Masters degree in Petroleum Engineering",
        "Minimum 3 years of production experience",
        "Knowledge of reservoir engineering principles",
        "Must attend all laboratory and field sessions",
        "Valid safety certification required",
      ]),
      rating_average: 4.7,
      rating_count: 39,
      enrollment_count: 29,
    },
  ];

  // Create courses with comprehensive data
  const courses = await Promise.all(
    coursesData.map((courseData) =>
      prisma.course.upsert({
        where: { id: courseData.id },
        update: {
          title: courseData.title,
          description: courseData.description,
          instructor_id: courseData.instructor_id || null,
          instructor_name: courseData.instructor_name
            ? typeof courseData.instructor_name === "string"
              ? toJson(courseData.instructor_name, courseData.instructor_name)
              : courseData.instructor_name
            : Prisma.JsonNull,
          category:
            typeof courseData.category === "string"
              ? toJson(courseData.category, courseData.category)
              : courseData.category || toJson("General", "عام"),
          price: courseData.price,
          duration_hours: courseData.duration_hours,
          level:
            typeof courseData.level === "string"
              ? toJson(courseData.level, courseData.level)
              : courseData.level || toJson("BEGINNER", "مبتدئ"),
          language:
            typeof courseData.language === "string"
              ? toJson(courseData.language, courseData.language)
              : courseData.language || toJson("English", "الإنجليزية"),
          max_students: courseData.max_students,
          is_published: courseData.is_published,
          start_date: courseData.start_date,
          end_date: courseData.end_date,
          meeting_location: (courseData as any).meeting_location
            ? typeof (courseData as any).meeting_location === "string"
              ? toJson(
                (courseData as any).meeting_location,
                (courseData as any).meeting_location
              )
              : (courseData as any).meeting_location
            : null,
          schedule_info: (courseData as any).schedule_info
            ? typeof (courseData as any).schedule_info === "string"
              ? toJson(
                (courseData as any).schedule_info,
                (courseData as any).schedule_info
              )
              : (courseData as any).schedule_info
            : null,
        },
        create: {
          id: courseData.id,
          title: courseData.title,
          description: courseData.description,
          instructor_id: courseData.instructor_id || null,
          instructor_name: courseData.instructor_name
            ? typeof courseData.instructor_name === "string"
              ? toJson(courseData.instructor_name, courseData.instructor_name)
              : courseData.instructor_name
            : Prisma.JsonNull,
          category:
            typeof courseData.category === "string"
              ? toJson(courseData.category, courseData.category)
              : courseData.category || toJson("General", "عام"),
          price: courseData.price,
          duration_hours: courseData.duration_hours,
          level:
            typeof courseData.level === "string"
              ? toJson(courseData.level, courseData.level)
              : courseData.level || toJson("BEGINNER", "مبتدئ"),
          language:
            typeof courseData.language === "string"
              ? toJson(courseData.language, courseData.language)
              : courseData.language || toJson("English", "الإنجليزية"),
          max_students: courseData.max_students,
          is_published: courseData.is_published,
          start_date: courseData.start_date,
          end_date: courseData.end_date,
          meeting_location: (courseData as any).meeting_location
            ? typeof (courseData as any).meeting_location === "string"
              ? toJson(
                (courseData as any).meeting_location,
                (courseData as any).meeting_location
              )
              : (courseData as any).meeting_location
            : null,
          schedule_info: (courseData as any).schedule_info
            ? typeof (courseData as any).schedule_info === "string"
              ? toJson(
                (courseData as any).schedule_info,
                (courseData as any).schedule_info
              )
              : (courseData as any).schedule_info
            : null,
        },
      })
    )
  );

  console.log(`✅ ${courses.length} courses created with comprehensive data:`);
  console.log(
    `   - Online courses: ${coursesData.filter((c) => c.delivery_type === "ONLINE").length}`
  );
  console.log(
    `   - Offline courses: ${coursesData.filter((c) => c.delivery_type === "OFFLINE").length}`
  );

  // Create department-specific courses assigned to departments
  const departmentCoursesData = [
    {
      id: "dept-course-sedimentology",
      title: {
        en: "Sedimentology and Reservoir Characterization",
        ar: "علم الرواسب وتوصيف الخزانات",
      },
      subtitle: {
        en: "Advanced sedimentological analysis techniques",
        ar: "تقنيات متقدمة لتحليل الرواسب",
      },
      description: {
        en: "Comprehensive course on sedimentological analysis, depositional environment interpretation, and reservoir quality assessment for petroleum exploration.",
        ar: "دورة شاملة حول تحليل الرواسب وتفسير بيئات الترسيب وتقييم جودة الخزانات لاستكشاف البترول.",
      },
      department_id: "dept-sedimentology",
      instructor_id: departmentManagers.find(
        (m) => m.department_id === "dept-sedimentology"
      )?.id,
      category: toJson("Geology", "الجيولوجيا"),
      price: 350.0,
      is_free: false,
      duration_hours: 45,
      duration_weeks: 6,
      level: toJson("INTERMEDIATE", "متوسط"),
      language: toJson("English", "الإنجليزية"),
      max_students: 25,
      is_published: true,
      is_featured: false,
      delivery_type: "HYBRID",
      start_date: new Date("2025-01-15T09:00:00Z"),
      end_date: new Date("2025-03-15T17:00:00Z"),
    },
    {
      id: "dept-course-paleontology",
      title: {
        en: "Micropaleontology and Biostratigraphy",
        ar: "الميكروباليونتولوجيا والبيوستراتيجرافيا",
      },
      subtitle: {
        en: "Age dating and correlation techniques",
        ar: "تقنيات تحديد العمر والارتباط",
      },
      description: {
        en: "Learn micropaleontological analysis, biostratigraphic age dating, and paleoenvironmental interpretation for petroleum exploration.",
        ar: "تعلم تحليل الميكروباليونتولوجيا وتحديد العمر البيوستراتيجرافي وتفسير البيئة القديمة لاستكشاف البترول.",
      },
      department_id: "dept-paleontology",
      instructor_id: departmentManagers.find(
        (m) => m.department_id === "dept-paleontology"
      )?.id,
      category: "Geology",
      price: 400.0,
      is_free: false,
      duration_hours: 50,
      duration_weeks: 8,
      level: "ADVANCED",
      language: "English",
      max_students: 20,
      is_published: true,
      is_featured: false,
      delivery_type: "OFFLINE",
      meeting_location: "EPRI Main Campus",
      room_number: "Lab 105",
      building: "Geology Building",
      start_date: new Date("2025-02-01T08:00:00Z"),
      end_date: new Date("2025-04-30T17:00:00Z"),
    },
    {
      id: "dept-course-geophysics",
      title: {
        en: "Seismic Interpretation and Well Log Analysis",
        ar: "تفسير الزلازل وتحليل سجلات الآبار",
      },
      subtitle: {
        en: "Advanced geophysical techniques",
        ar: "تقنيات جيوفيزيائية متقدمة",
      },
      description: {
        en: "Master seismic interpretation, well log analysis, and geophysical modeling for reservoir characterization and petroleum exploration.",
        ar: "إتقان تفسير الزلازل وتحليل سجلات الآبار والنمذجة الجيوفيزيائية لتوصيف الخزانات واستكشاف البترول.",
      },
      department_id: "dept-geophysics",
      instructor_id: departmentManagers.find(
        (m) => m.department_id === "dept-geophysics"
      )?.id,
      category: "Geophysics",
      price: 450.0,
      is_free: false,
      duration_hours: 60,
      duration_weeks: 10,
      level: "ADVANCED",
      language: "English",
      max_students: 30,
      is_published: true,
      is_featured: true,
      delivery_type: "ONLINE",
      zoom_link: "https://zoom.us/j/geophysics2025",
      platform: "Zoom",
      start_date: new Date("2025-01-20T10:00:00Z"),
      end_date: new Date("2025-04-20T18:00:00Z"),
    },
    {
      id: "dept-course-drilling",
      title: {
        en: "Drilling Engineering and Well Control",
        ar: "هندسة الحفر والتحكم في الآبار",
      },
      subtitle: {
        en: "Drilling operations and safety",
        ar: "عمليات الحفر والسلامة",
      },
      description: {
        en: "Comprehensive course on drilling fluid analysis, wellbore stability, drilling optimization, and well control procedures.",
        ar: "دورة شاملة حول تحليل سوائل الحفر واستقرار جدار البئر وتحسين الحفر وإجراءات التحكم في الآبار.",
      },
      department_id: "dept-drilling",
      instructor_id: departmentManagers.find(
        (m) => m.department_id === "dept-drilling"
      )?.id,
      category: "Drilling Engineering",
      price: 500.0,
      is_free: false,
      duration_hours: 55,
      duration_weeks: 9,
      level: "INTERMEDIATE",
      language: "English",
      max_students: 35,
      is_published: true,
      is_featured: false,
      delivery_type: "HYBRID",
      start_date: new Date("2025-02-10T09:00:00Z"),
      end_date: new Date("2025-05-10T17:00:00Z"),
    },
    {
      id: "dept-course-reservoir",
      title: {
        en: "Reservoir Engineering and Simulation",
        ar: "هندسة الخزانات والمحاكاة",
      },
      subtitle: {
        en: "Reservoir management and optimization",
        ar: "إدارة الخزانات والتحسين",
      },
      description: {
        en: "Learn reservoir simulation, production optimization, enhanced oil recovery techniques, and reservoir management strategies.",
        ar: "تعلم محاكاة الخزانات وتحسين الإنتاج وتقنيات الاستخلاص المعزز للنفط واستراتيجيات إدارة الخزانات.",
      },
      department_id: "dept-reservoir",
      instructor_id: departmentManagers.find(
        (m) => m.department_id === "dept-reservoir"
      )?.id,
      category: "Reservoir Engineering",
      price: 550.0,
      is_free: false,
      duration_hours: 65,
      duration_weeks: 12,
      level: "ADVANCED",
      language: "English",
      max_students: 25,
      is_published: true,
      is_featured: true,
      delivery_type: "ONLINE",
      zoom_link: "https://zoom.us/j/reservoir2025",
      platform: "Zoom",
      start_date: new Date("2025-01-25T08:00:00Z"),
      end_date: new Date("2025-05-25T18:00:00Z"),
    },
    {
      id: "dept-course-core-analysis",
      title: {
        en: "Core Analysis and Petrophysics",
        ar: "تحليل اللب والفيزياء الصخرية",
      },
      subtitle: {
        en: "Rock properties and formation evaluation",
        ar: "خصائص الصخور وتقييم التكوين",
      },
      description: {
        en: "Comprehensive training on routine and special core analysis, petrophysical property measurements, and formation evaluation techniques.",
        ar: "تدريب شامل على تحليل اللب الروتيني والخاص وقياسات الخصائص الفيزيائية الصخرية وتقنيات تقييم التكوين.",
      },
      department_id: "dept-core-analysis",
      instructor_id: departmentManagers.find(
        (m) => m.department_id === "dept-core-analysis"
      )?.id,
      category: "Analysis",
      price: 420.0,
      is_free: false,
      duration_hours: 48,
      duration_weeks: 7,
      level: "INTERMEDIATE",
      language: "English",
      max_students: 20,
      is_published: true,
      is_featured: false,
      delivery_type: "OFFLINE",
      meeting_location: "EPRI Main Campus",
      room_number: "Lab 203",
      building: "Analysis Building",
      start_date: new Date("2025-02-15T09:00:00Z"),
      end_date: new Date("2025-04-15T17:00:00Z"),
    },
    {
      id: "dept-course-chemical-analysis",
      title: {
        en: "Petroleum Product Analysis and Quality Control",
        ar: "تحليل منتجات البترول وضبط الجودة",
      },
      subtitle: {
        en: "Chemical analysis techniques",
        ar: "تقنيات التحليل الكيميائي",
      },
      description: {
        en: "Learn petroleum product analysis, quality control procedures, composition analysis, and testing protocols for petroleum products.",
        ar: "تعلم تحليل منتجات البترول وإجراءات ضبط الجودة وتحليل التركيب وبروتوكولات الاختبار لمنتجات البترول.",
      },
      department_id: "dept-chemical-analysis",
      instructor_id: departmentManagers.find(
        (m) => m.department_id === "dept-chemical-analysis"
      )?.id,
      category: "Chemical Analysis",
      price: 380.0,
      is_free: false,
      duration_hours: 42,
      duration_weeks: 6,
      level: "INTERMEDIATE",
      language: "English",
      max_students: 30,
      is_published: true,
      is_featured: false,
      delivery_type: "HYBRID",
      start_date: new Date("2025-02-20T10:00:00Z"),
      end_date: new Date("2025-04-20T18:00:00Z"),
    },
    {
      id: "dept-course-refining",
      title: { en: "Petroleum Refining Processes", ar: "عمليات تكرير البترول" },
      subtitle: {
        en: "Refining technology and optimization",
        ar: "تكنولوجيا التكرير والتحسين",
      },
      description: {
        en: "Comprehensive course on petroleum refining processes, catalyst development, process optimization, and product quality assurance.",
        ar: "دورة شاملة حول عمليات تكرير البترول وتطوير المحفزات وتحسين العمليات وضمان جودة المنتجات.",
      },
      department_id: "dept-refining",
      instructor_id: departmentManagers.find(
        (m) => m.department_id === "dept-refining"
      )?.id,
      category: "Refining",
      price: 480.0,
      is_free: false,
      duration_hours: 52,
      duration_weeks: 8,
      level: "ADVANCED",
      language: "English",
      max_students: 28,
      is_published: true,
      is_featured: true,
      delivery_type: "ONLINE",
      zoom_link: "https://zoom.us/j/refining2025",
      platform: "Zoom",
      start_date: new Date("2025-01-30T09:00:00Z"),
      end_date: new Date("2025-04-30T17:00:00Z"),
    },
  ];

  const departmentCourses = await Promise.all(
    departmentCoursesData.map((courseData) =>
      prisma.course.upsert({
        where: { id: courseData.id },
        update: {
          title: courseData.title,
          subtitle: courseData.subtitle,
          description: courseData.description,
          department_id: courseData.department_id,
          instructor_id: courseData.instructor_id || null,
          category:
            typeof courseData.category === "string"
              ? toJson(courseData.category, courseData.category)
              : courseData.category || toJson("General", "عام"),
          price: courseData.price,
          duration_hours: courseData.duration_hours,
          duration_weeks: courseData.duration_weeks,
          level:
            typeof courseData.level === "string"
              ? toJson(courseData.level, courseData.level)
              : courseData.level || toJson("BEGINNER", "مبتدئ"),
          language:
            typeof courseData.language === "string"
              ? toJson(courseData.language, courseData.language)
              : courseData.language || toJson("English", "الإنجليزية"),
          max_students: courseData.max_students,
          is_published: courseData.is_published,
          is_featured: courseData.is_featured,
          delivery_type: courseData.delivery_type as any,
          meeting_location: (courseData as any).meeting_location
            ? typeof (courseData as any).meeting_location === "string"
              ? toJson(
                (courseData as any).meeting_location,
                (courseData as any).meeting_location
              )
              : (courseData as any).meeting_location
            : null,
          room_number: courseData.room_number || null,
          building: courseData.building || null,
          zoom_link: courseData.zoom_link || null,
          platform: courseData.platform || null,
          start_date: courseData.start_date,
          end_date: courseData.end_date,
        },
        create: {
          id: courseData.id,
          title: courseData.title,
          subtitle: courseData.subtitle,
          description: courseData.description,
          department_id: courseData.department_id,
          instructor_id: courseData.instructor_id || null,
          instructor_name: (courseData as any).instructor_name
            ? typeof (courseData as any).instructor_name === "string"
              ? toJson(
                (courseData as any).instructor_name,
                (courseData as any).instructor_name
              )
              : (courseData as any).instructor_name
            : null,
          category:
            typeof courseData.category === "string"
              ? toJson(courseData.category, courseData.category)
              : courseData.category || toJson("General", "عام"),
          price: courseData.price,
          duration_hours: courseData.duration_hours,
          duration_weeks: courseData.duration_weeks,
          level:
            typeof courseData.level === "string"
              ? toJson(courseData.level, courseData.level)
              : courseData.level || toJson("BEGINNER", "مبتدئ"),
          language:
            typeof courseData.language === "string"
              ? toJson(courseData.language, courseData.language)
              : courseData.language || toJson("English", "الإنجليزية"),
          max_students: courseData.max_students,
          is_published: courseData.is_published,
          is_featured: courseData.is_featured,
          delivery_type: courseData.delivery_type as any,
          meeting_location: (courseData as any).meeting_location
            ? typeof (courseData as any).meeting_location === "string"
              ? toJson(
                (courseData as any).meeting_location,
                (courseData as any).meeting_location
              )
              : (courseData as any).meeting_location
            : null,
          room_number: courseData.room_number || null,
          building: courseData.building || null,
          zoom_link: courseData.zoom_link || null,
          platform: courseData.platform || null,
          start_date: courseData.start_date,
          end_date: courseData.end_date,
          schedule_info: (courseData as any).schedule_info
            ? typeof (courseData as any).schedule_info === "string"
              ? toJson(
                (courseData as any).schedule_info,
                (courseData as any).schedule_info
              )
              : (courseData as any).schedule_info
            : null,
        },
      })
    )
  );

  console.log(
    `✅ ${departmentCourses.length} department-specific courses created:`
  );
  console.log(
    `   - Courses assigned to departments for department managers to manage`
  );
  console.log(
    `   - Hybrid courses: ${coursesData.filter((c) => c.delivery_type === "HYBRID").length}`
  );
  console.log(
    `   - Free courses: ${coursesData.filter((c) => c.is_free).length}`
  );
  console.log(
    `   - Featured courses: ${coursesData.filter((c) => c.is_featured).length}`
  );

  // Create comprehensive lessons for courses
  const lessonsData = [
    // Petroleum Fundamentals Course Lessons
    {
      course_id: "petroleum-fundamentals",
      id: "pf-lesson-1",
      title: "Introduction to Petroleum Engineering",
      description:
        "Overview of petroleum engineering discipline, industry structure, and career opportunities",
      order_index: 1,
      duration_minutes: 45,
      type: "video",
      video_type: "youtube",
      video_id: "dQw4w9WgXcQ",
      is_preview: true,
      content: JSON.stringify({
        learning_objectives: [
          "Understand the role of petroleum engineers",
          "Learn about oil and gas industry structure",
          "Explore career opportunities in petroleum engineering",
        ],
        key_topics: [
          "History of petroleum industry",
          "Types of petroleum engineers",
          "Industry value chain",
          "Current challenges and opportunities",
        ],
      }),
      notes:
        "This introductory lesson provides a comprehensive overview of petroleum engineering and sets the foundation for the entire course.",
      attachments: JSON.stringify([
        {
          name: "Course Syllabus",
          url: "/attachments/pf-syllabus.pdf",
          type: "pdf",
        },
        {
          name: "Industry Overview Slides",
          url: "/attachments/pf-industry-overview.pptx",
          type: "powerpoint",
        },
      ]),
    },
    {
      course_id: "petroleum-fundamentals",
      id: "pf-lesson-2",
      title: "Geology for Petroleum Engineers",
      description:
        "Essential geological concepts for understanding hydrocarbon formation and accumulation",
      order_index: 2,
      duration_minutes: 60,
      type: "video",
      video_type: "vimeo",
      video_id: "123456789",
      is_preview: false,
      content: JSON.stringify({
        learning_objectives: [
          "Understand rock types and their properties",
          "Learn about sedimentary environments",
          "Understand structural geology basics",
        ],
        key_topics: [
          "Rock cycle and rock types",
          "Sedimentary environments",
          "Structural geology",
          "Geological time scale",
        ],
      }),
      notes:
        "Fundamental geological concepts that every petroleum engineer should understand for effective reservoir analysis.",
      attachments: JSON.stringify([
        {
          name: "Geological Maps",
          url: "/attachments/pf-geo-maps.pdf",
          type: "pdf",
        },
        {
          name: "Rock Samples Images",
          url: "/attachments/pf-rock-samples.zip",
          type: "archive",
        },
      ]),
    },
    {
      course_id: "petroleum-fundamentals",
      id: "pf-lesson-3",
      title: "Hydrocarbon Formation and Migration",
      description:
        "Understanding how oil and gas are formed and migrate through rock formations",
      order_index: 3,
      duration_minutes: 50,
      type: "video",
      video_type: "direct",
      video_url:
        "https://epri-media.s3.amazonaws.com/courses/hydrocarbon-formation.mp4",
      is_preview: false,
      content: JSON.stringify({
        learning_objectives: [
          "Understand hydrocarbon generation process",
          "Learn about primary and secondary migration",
          "Understand trapping mechanisms",
        ],
        key_topics: [
          "Organic matter and kerogen",
          "Thermal maturation",
          "Primary and secondary migration",
          "Trapping and accumulation",
        ],
      }),
      notes:
        "Critical concepts for understanding where and why hydrocarbons accumulate in the subsurface.",
      attachments: JSON.stringify([
        {
          name: "Migration Diagrams",
          url: "/attachments/pf-migration-diagrams.pdf",
          type: "pdf",
        },
      ]),
    },
    {
      course_id: "petroleum-fundamentals",
      id: "pf-lesson-4",
      title: "Reservoir Rocks and Properties",
      description:
        "Understanding reservoir rock properties that control hydrocarbon storage and flow",
      order_index: 4,
      duration_minutes: 55,
      type: "video",
      video_type: "youtube",
      video_id: "reservoir123",
      is_preview: false,
      content: JSON.stringify({
        learning_objectives: [
          "Understand porosity and permeability concepts",
          "Learn about reservoir rock types",
          "Understand factors affecting reservoir quality",
        ],
        key_topics: [
          "Porosity types and measurement",
          "Permeability and its controls",
          "Reservoir rock types",
          "Rock-fluid interactions",
        ],
      }),
      quiz_data: JSON.stringify({
        questions: [
          {
            id: "q1",
            question:
              "What is the most important property for hydrocarbon storage?",
            type: "multiple-choice",
            options: ["Porosity", "Permeability", "Density", "Hardness"],
            correct_answer: 0,
          },
          {
            id: "q2",
            question: "Which rock type typically makes the best reservoir?",
            type: "multiple-choice",
            options: ["Shale", "Sandstone", "Granite", "Slate"],
            correct_answer: 1,
          },
        ],
      }),
    },
    {
      course_id: "petroleum-fundamentals",
      id: "pf-lesson-5",
      title: "Live Q&A: Fundamentals Review",
      description:
        "Interactive session reviewing fundamental concepts with instructor",
      order_index: 5,
      duration_minutes: 90,
      type: "live_session",
      is_recorded: true,
      live_session_url: "https://zoom.us/j/123456789",
      session_date: "2024-12-08T09:00:00Z",
      video_type: "zoom_recording",
      video_url: "https://epri-recordings.com/pf-qa-session-1",
      content: JSON.stringify({
        learning_objectives: [
          "Clarify fundamental concepts",
          "Address student questions",
          "Reinforce key learning points",
        ],
        session_format: "Interactive Q&A with polls and breakout discussions",
      }),
    },
    // Advanced Geology Course Lessons
    {
      course_id: "advanced-geology",
      id: "ag-lesson-1",
      title: "Advanced Seismic Interpretation Techniques",
      description:
        "Master advanced seismic interpretation methods and software applications",
      order_index: 1,
      duration_minutes: 75,
      type: "video",
      video_type: "direct",
      video_url:
        "https://epri-media.s3.amazonaws.com/courses/advanced-seismic.mp4",
      is_preview: true,
      content: JSON.stringify({
        learning_objectives: [
          "Master advanced seismic attributes",
          "Learn horizon picking techniques",
          "Understand velocity modeling",
        ],
        software_used: ["Petrel", "Kingdom Suite", "OpendTect"],
        key_topics: [
          "Seismic attributes and their applications",
          "Horizon interpretation workflows",
          "Velocity model building",
          "Structural interpretation techniques",
        ],
      }),
      attachments: JSON.stringify([
        {
          name: "Seismic Data Exercise",
          url: "/attachments/ag-seismic-data.segy",
          type: "data",
        },
        {
          name: "Interpretation Guidelines",
          url: "/attachments/ag-interpretation-guide.pdf",
          type: "pdf",
        },
      ]),
    },
    {
      course_id: "advanced-geology",
      id: "ag-lesson-2",
      title: "Structural Geology in Petroleum Exploration",
      description:
        "Advanced structural analysis techniques for petroleum exploration",
      order_index: 2,
      duration_minutes: 80,
      type: "video",
      video_type: "vimeo",
      video_id: "struct456",
      is_preview: false,
      content: JSON.stringify({
        learning_objectives: [
          "Understand complex structural geometries",
          "Learn fault analysis techniques",
          "Master fold interpretation methods",
        ],
        key_topics: [
          "Fault systems and their controls",
          "Fold mechanisms and styles",
          "Structural traps and their exploration",
          "Kinematic analysis methods",
        ],
      }),
      attachments: JSON.stringify([
        {
          name: "Structural Maps",
          url: "/attachments/ag-structural-maps.pdf",
          type: "pdf",
        },
        {
          name: "Cross-Section Templates",
          url: "/attachments/ag-cross-sections.dwg",
          type: "cad",
        },
      ]),
    },
    // Reservoir Simulation Course Lessons
    {
      course_id: "reservoir-simulation",
      id: "rs-lesson-1",
      title: "Reservoir Simulation Fundamentals",
      description:
        "Introduction to reservoir simulation concepts and mathematical foundations",
      order_index: 1,
      duration_minutes: 90,
      type: "video",
      video_type: "direct",
      video_url:
        "https://epri-media.s3.amazonaws.com/courses/sim-fundamentals.mp4",
      is_preview: true,
      content: JSON.stringify({
        learning_objectives: [
          "Understand simulation workflow",
          "Learn about grid systems",
          "Understand flow equations",
        ],
        software_used: ["Eclipse", "CMG STARS", "INTERSECT"],
        key_topics: [
          "Reservoir simulation workflow",
          "Grid construction and refinement",
          "Fluid flow equations",
          "Numerical methods overview",
        ],
      }),
      attachments: JSON.stringify([
        {
          name: "Simulation Workflow Diagram",
          url: "/attachments/rs-workflow.pdf",
          type: "pdf",
        },
        {
          name: "Grid Construction Tutorial",
          url: "/attachments/rs-grid-tutorial.pdf",
          type: "pdf",
        },
      ]),
    },
    {
      course_id: "reservoir-simulation",
      id: "rs-lesson-2",
      title: "History Matching Techniques",
      description:
        "Advanced history matching methods and uncertainty quantification",
      order_index: 2,
      duration_minutes: 120,
      type: "video",
      video_type: "youtube",
      video_id: "history789",
      is_preview: false,
      content: JSON.stringify({
        learning_objectives: [
          "Master history matching workflow",
          "Learn parameter estimation methods",
          "Understand uncertainty quantification",
        ],
        key_topics: [
          "History matching objectives",
          "Parameter sensitivity analysis",
          "Automated history matching",
          "Uncertainty workflows",
        ],
      }),
      quiz_data: JSON.stringify({
        questions: [
          {
            id: "q1",
            question: "What is the primary goal of history matching?",
            type: "multiple-choice",
            options: [
              "Increase production",
              "Match observed field performance",
              "Reduce simulation time",
              "Simplify the model",
            ],
            correct_answer: 1,
          },
        ],
      }),
    },
    // Environmental Management Course Lessons
    {
      course_id: "environmental-petroleum",
      id: "ep-lesson-1",
      title: "Environmental Regulations in Petroleum Industry",
      description:
        "Comprehensive overview of environmental regulations affecting petroleum operations",
      order_index: 1,
      duration_minutes: 60,
      type: "video",
      video_type: "youtube",
      video_id: "envregs123",
      is_preview: true,
      content: JSON.stringify({
        learning_objectives: [
          "Understand key environmental regulations",
          "Learn compliance requirements",
          "Understand penalty structures",
        ],
        key_topics: [
          "International environmental standards",
          "National regulatory frameworks",
          "Compliance monitoring requirements",
          "Penalty and enforcement mechanisms",
        ],
      }),
      attachments: JSON.stringify([
        {
          name: "Regulatory Framework Summary",
          url: "/attachments/ep-regulations.pdf",
          type: "pdf",
        },
        {
          name: "Compliance Checklist",
          url: "/attachments/ep-compliance-checklist.xlsx",
          type: "excel",
        },
      ]),
    },
    {
      course_id: "environmental-petroleum",
      id: "ep-lesson-2",
      title: "Environmental Impact Assessment Methods",
      description:
        "Learn systematic approaches to conducting environmental impact assessments",
      order_index: 2,
      duration_minutes: 75,
      type: "video",
      video_type: "vimeo",
      video_id: "eia456",
      is_preview: false,
      content: JSON.stringify({
        learning_objectives: [
          "Master EIA methodology",
          "Learn impact prediction techniques",
          "Understand mitigation planning",
        ],
        key_topics: [
          "EIA process and stages",
          "Baseline studies design",
          "Impact prediction methods",
          "Mitigation hierarchy",
        ],
      }),
    },
    {
      course_id: "environmental-petroleum",
      id: "ep-lesson-3",
      title: "Case Study: Offshore Oil Spill Response",
      description:
        "Real-world case study of environmental emergency response and remediation",
      order_index: 3,
      duration_minutes: 90,
      type: "article",
      content: JSON.stringify({
        learning_objectives: [
          "Analyze real spill response strategies",
          "Understand emergency response protocols",
          "Learn remediation effectiveness assessment",
        ],
        case_study: "Detailed analysis of major offshore oil spill incident",
        key_lessons: [
          "Importance of preparedness",
          "Multi-stakeholder coordination",
          "Long-term monitoring requirements",
          "Lessons learned and improvements",
        ],
      }),
      article_content:
        "This comprehensive case study examines the response to a major offshore oil spill, analyzing the technical, environmental, and social aspects of the incident...",
      attachments: JSON.stringify([
        {
          name: "Case Study Full Report",
          url: "/attachments/ep-case-study.pdf",
          type: "pdf",
        },
        {
          name: "Response Timeline",
          url: "/attachments/ep-timeline.pdf",
          type: "pdf",
        },
      ]),
    },
    // Drilling Optimization Course Lessons
    {
      course_id: "drilling-optimization",
      id: "do-lesson-1",
      title: "Well Design Fundamentals",
      description:
        "Comprehensive well design principles and optimization strategies",
      order_index: 1,
      duration_minutes: 85,
      type: "video",
      video_type: "direct",
      video_url: "https://epri-media.s3.amazonaws.com/courses/well-design.mp4",
      is_preview: true,
      content: JSON.stringify({
        learning_objectives: [
          "Master well design principles",
          "Learn trajectory optimization",
          "Understand casing program design",
        ],
        software_used: [
          "Landmark WellPlan",
          "Halliburton COMPASS",
          "Baker Hughes WellLink",
        ],
        key_topics: [
          "Well trajectory design",
          "Casing program optimization",
          "Drilling fluid selection",
          "BHA design considerations",
        ],
      }),
    },
    {
      course_id: "drilling-optimization",
      id: "do-lesson-2",
      title: "Drilling Fluid Optimization Laboratory",
      description:
        "Hands-on laboratory session for drilling fluid testing and optimization",
      order_index: 2,
      duration_minutes: 180,
      type: "live_session",
      is_recorded: true,
      live_session_url: "https://zoom.us/j/drilling-lab",
      session_date: "2025-01-25T08:00:00Z",
      video_type: "zoom_recording",
      video_url: "https://epri-recordings.com/do-lab-session",
      content: JSON.stringify({
        learning_objectives: [
          "Conduct mud testing procedures",
          "Optimize fluid properties",
          "Troubleshoot fluid problems",
        ],
        lab_equipment: [
          "Rheometer",
          "Mud balance",
          "Filter press",
          "HPHT aging cell",
        ],
        activities: [
          "Rheology measurements",
          "Filtration testing",
          "Contamination simulation",
          "Additive optimization",
        ],
      }),
    },
    // Introduction to Geophysics Course Lessons (Free Course)
    {
      course_id: "introduction-geophysics",
      id: "ig-lesson-1",
      title: "What is Geophysics?",
      description:
        "Introduction to geophysical methods and their applications in petroleum exploration",
      order_index: 1,
      duration_minutes: 30,
      type: "video",
      video_type: "youtube",
      video_id: "geophys101",
      is_preview: true,
      content: JSON.stringify({
        learning_objectives: [
          "Understand geophysics definition",
          "Learn about different geophysical methods",
          "Understand applications in petroleum industry",
        ],
        key_topics: [
          "Geophysics overview",
          "Seismic methods",
          "Gravity and magnetic methods",
          "Electrical methods",
        ],
      }),
      notes:
        "This is a beginner-friendly introduction suitable for students with no prior geophysics background.",
    },
    {
      course_id: "introduction-geophysics",
      id: "ig-lesson-2",
      title: "Seismic Waves and Wave Propagation",
      description:
        "Understanding seismic wave types and how they travel through the Earth",
      order_index: 2,
      duration_minutes: 40,
      type: "video",
      video_type: "vimeo",
      video_id: "waves123",
      is_preview: false,
      content: JSON.stringify({
        learning_objectives: [
          "Understand wave types",
          "Learn wave propagation principles",
          "Understand velocity variations",
        ],
        key_topics: [
          "P-waves and S-waves",
          "Wave propagation physics",
          "Velocity and density relationships",
          "Reflection and refraction",
        ],
      }),
      quiz_data: JSON.stringify({
        questions: [
          {
            id: "q1",
            question: "Which seismic wave type travels fastest?",
            type: "multiple-choice",
            options: ["P-wave", "S-wave", "Surface wave", "Love wave"],
            correct_answer: 0,
          },
        ],
      }),
    },
    {
      course_id: "introduction-geophysics",
      id: "ig-lesson-3",
      title: "Basic Seismic Interpretation",
      description:
        "Learn to identify basic geological features in seismic data",
      order_index: 3,
      duration_minutes: 45,
      type: "video",
      video_type: "direct",
      video_url:
        "https://epri-media.s3.amazonaws.com/courses/basic-interpretation.mp4",
      is_preview: false,
      content: JSON.stringify({
        learning_objectives: [
          "Identify basic seismic features",
          "Understand reflection patterns",
          "Learn about seismic facies",
        ],
        key_topics: [
          "Reflection character",
          "Seismic facies analysis",
          "Structural features identification",
          "Stratigraphic interpretation basics",
        ],
      }),
      attachments: JSON.stringify([
        {
          name: "Sample Seismic Section",
          url: "/attachments/ig-seismic-sample.pdf",
          type: "pdf",
        },
        {
          name: "Interpretation Exercise",
          url: "/attachments/ig-exercise.pdf",
          type: "pdf",
        },
      ]),
    },
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
        video_type: lessonData.video_type || "youtube",
        video_id: lessonData.video_id || null,
        video_url: lessonData.video_url || null,
        is_preview: lessonData.is_preview || false,
        content: lessonData.content
          ? typeof lessonData.content === "string"
            ? JSON.parse(lessonData.content)
            : lessonData.content
          : null,
        notes: (lessonData as any).notes
          ? typeof (lessonData as any).notes === "string"
            ? toJson((lessonData as any).notes, (lessonData as any).notes)
            : (lessonData as any).notes
          : null,
        attachments: lessonData.attachments
          ? JSON.parse(lessonData.attachments)
          : null,
        quiz_data: lessonData.quiz_data
          ? JSON.parse(lessonData.quiz_data)
          : null,
        course_id: lessonData.course_id,
      },
      create: {
        id: lessonData.id,
        title: lessonData.title,
        description: lessonData.description,
        order_index: lessonData.order_index,
        duration: lessonData.duration_minutes,
        video_type: lessonData.video_type || "youtube",
        video_id: lessonData.video_id || null,
        video_url: lessonData.video_url || null,
        is_preview: lessonData.is_preview || false,
        content: lessonData.content
          ? typeof lessonData.content === "string"
            ? JSON.parse(lessonData.content)
            : lessonData.content
          : null,
        notes: (lessonData as any).notes
          ? typeof (lessonData as any).notes === "string"
            ? toJson((lessonData as any).notes, (lessonData as any).notes)
            : (lessonData as any).notes
          : null,
        attachments: lessonData.attachments
          ? JSON.parse(lessonData.attachments)
          : null,
        quiz_data: lessonData.quiz_data
          ? JSON.parse(lessonData.quiz_data)
          : null,
        course_id: lessonData.course_id,
      },
    });
  }

  console.log(
    `✅ ${lessonsData.length} comprehensive lessons created for courses:`
  );
  console.log(
    `   - Video lessons: ${lessonsData.filter((l) => l.type === "video").length}`
  );
  console.log(
    `   - Live sessions: ${lessonsData.filter((l) => l.type === "live_session").length}`
  );
  console.log(
    `   - Articles: ${lessonsData.filter((l) => l.type === "article").length}`
  );
  console.log(
    `   - Lessons with quizzes: ${lessonsData.filter((l) => l.quiz_data).length}`
  );
  console.log(
    `   - Preview lessons: ${lessonsData.filter((l) => l.is_preview).length}`
  );

  // Create Service Center Heads
  const serviceCenterHeads = await Promise.all([
    prisma.serviceCenterHead.upsert({
      where: { id: "ch-1" },
      update: {},
      create: {
        id: "ch-1",
        name: "Dr. Ahmed Hassan",
        title: "Director of Petroleum Analysis Center",
        picture: "/dr-ahmed-hassan.jpg",
        bio: "Dr. Ahmed Hassan is a leading expert in petroleum chemistry with over 20 years of experience in crude oil analysis and refining technology. He holds a Ph.D. in Petroleum Engineering and has published numerous research papers on petroleum characterization and quality control.",
        email: "a.hassan@epri.edu",
        phone: "+20 2 1234 5678",
        expertise: JSON.stringify([
          "Petroleum Chemistry",
          "Crude Oil Characterization",
          "Refining Technology",
          "Quality Control",
          "Analytical Methods Development",
        ]),
      },
    }),
    prisma.serviceCenterHead.upsert({
      where: { id: "ch-2" },
      update: {},
      create: {
        id: "ch-2",
        name: "Dr. Fatma El-Sayed",
        title: "Head of Reservoir Engineering Department",
        picture: "/dr-fatma-elsayed.jpg",
        bio: "Dr. Fatma El-Sayed is a renowned reservoir engineer with extensive experience in reservoir simulation and production optimization. She has worked on major oil and gas projects across the Middle East and holds a Ph.D. in Petroleum Engineering from a leading international university.",
        email: "f.elsayed@epri.edu",
        phone: "+20 2 1234 5679",
        expertise: JSON.stringify([
          "Reservoir Simulation",
          "Production Optimization",
          "Enhanced Oil Recovery",
          "Reservoir Characterization",
          "Field Development Planning",
        ]),
      },
    }),
    prisma.serviceCenterHead.upsert({
      where: { id: "ch-3" },
      update: {},
      create: {
        id: "ch-3",
        name: "Dr. Mohamed Ibrahim",
        title: "Director of Environmental Studies Center",
        picture: "/dr-mohamed-ibrahim.jpg",
        bio: "Dr. Mohamed Ibrahim is an environmental scientist specializing in petroleum-related environmental issues. With over 15 years of experience, he has led numerous environmental impact assessments and remediation projects for major oil and gas companies.",
        email: "m.ibrahim@epri.edu",
        phone: "+20 2 1234 5680",
        expertise: JSON.stringify([
          "Environmental Impact Assessment",
          "Contamination Remediation",
          "Environmental Regulations",
          "Sustainability Consulting",
          "Air and Water Quality Management",
        ]),
      },
    }),
    prisma.serviceCenterHead.upsert({
      where: { id: "ch-4" },
      update: {},
      create: {
        id: "ch-4",
        name: "Eng. Khaled Mahmoud",
        title: "Head of Drilling Engineering Department",
        picture: "/eng-khaled-mahmoud.jpg",
        bio: "Eng. Khaled Mahmoud is a senior drilling engineer with over 25 years of field experience in drilling operations across various geological formations. He has managed complex drilling projects and is an expert in drilling optimization and well control.",
        email: "k.mahmoud@epri.edu",
        phone: "+20 2 1234 5681",
        expertise: JSON.stringify([
          "Drilling Engineering",
          "Well Design",
          "Drilling Optimization",
          "Well Control",
          "Directional Drilling",
        ]),
      },
    }),
    prisma.serviceCenterHead.upsert({
      where: { id: "ch-5" },
      update: {},
      create: {
        id: "ch-5",
        name: "Dr. Laila Abdel-Rahman",
        title: "Director of Materials Science Center",
        picture: "/dr-laila-abdelrahman.jpg",
        bio: "Dr. Laila Abdel-Rahman is a materials scientist with expertise in corrosion engineering and failure analysis. She has conducted extensive research on corrosion prevention in petroleum environments and has published numerous papers in international journals.",
        email: "l.abdelrahman@epri.edu",
        phone: "+20 2 1234 5682",
        expertise: JSON.stringify([
          "Corrosion Engineering",
          "Materials Science",
          "Failure Analysis",
          "Metallurgy",
          "Corrosion Prevention",
        ]),
      },
    }),
  ]);

  console.log("✅ Service center heads created");

  // Create Services with Equipment
  const servicesData = [
    {
      id: "1",
      title: "Petroleum Analysis & Testing",
      subtitle: "Comprehensive crude oil and petroleum product analysis",
      description:
        "Our state-of-the-art petroleum analysis laboratory provides comprehensive testing services for crude oil, refined products, and petrochemicals. We utilize advanced analytical techniques to ensure product quality, compliance with international standards, and optimization of refining processes.",
      image: "/petroleum-lab-testing.jpg",
      category: "Laboratory Services",
      icon: "🔬",
      features: JSON.stringify([
        "Crude oil assay and characterization",
        "Petroleum product quality testing",
        "Fuel specifications analysis",
        "Contamination detection",
        "Octane and cetane number determination",
        "Viscosity and density measurements",
        "Sulfur content analysis",
        "Distillation curve analysis",
      ]),
      center_head_id: "ch-1",
      duration: "2-5 business days",
      price: 500,
      is_free: false,
      equipment: [
        {
          id: "eq-1",
          name: "Gas Chromatography-Mass Spectrometry (GC-MS)",
          description:
            "Advanced analytical instrument for identifying and quantifying chemical compounds in petroleum samples",
          image: "/gc-ms-equipment.jpg",
          specifications: JSON.stringify([
            "High-resolution mass spectrometer",
            "Temperature range: -60°C to 450°C",
            "Detection limit: ppb level",
            "Automated sample injection system",
          ]),
        },
        {
          id: "eq-2",
          name: "Atomic Absorption Spectrophotometer",
          description:
            "Precision instrument for determining metal content in petroleum products",
          image: "/spectrophotometer-equipment.jpg",
          specifications: JSON.stringify([
            "Multi-element analysis capability",
            "Flame and graphite furnace modes",
            "Detection range: ppm to ppb",
            "Automated sample changer",
          ]),
        },
      ],
    },
    {
      id: "2",
      title: "Reservoir Engineering Services",
      subtitle: "Advanced reservoir characterization and simulation",
      description:
        "Our reservoir engineering team provides comprehensive services for reservoir characterization, performance analysis, and production optimization. We utilize cutting-edge simulation software and analytical techniques to maximize hydrocarbon recovery and optimize field development strategies.",
      image: "/reservoir-engineering.jpg",
      category: "Engineering Services",
      icon: "⚙️",
      features: JSON.stringify([
        "Reservoir characterization and modeling",
        "Production forecasting and optimization",
        "Enhanced oil recovery (EOR) studies",
        "Well performance analysis",
        "Pressure transient analysis",
        "Material balance calculations",
        "Decline curve analysis",
        "Economic evaluation",
      ]),
      center_head_id: "ch-2",
      duration: "1-4 weeks",
      price: 2000,
      is_free: false,
      equipment: [
        {
          id: "eq-4",
          name: "Reservoir Simulation Workstation",
          description:
            "High-performance computing system for complex reservoir simulations",
          image: "/simulation-workstation.jpg",
          specifications: JSON.stringify([
            "Multi-core processors (64 cores)",
            "512 GB RAM",
            "GPU acceleration support",
            "Commercial reservoir simulators (Eclipse, CMG)",
          ]),
        },
      ],
    },
    {
      id: "3",
      title: "Environmental Impact Assessment",
      subtitle: "Comprehensive environmental studies for petroleum operations",
      description:
        "Our environmental services team conducts thorough environmental impact assessments for petroleum exploration, production, and refining operations. We help companies comply with environmental regulations and implement sustainable practices.",
      image: "/environmental-assessment.jpg",
      category: "Environmental Services",
      icon: "🌍",
      features: JSON.stringify([
        "Environmental impact assessment (EIA)",
        "Soil and water contamination analysis",
        "Air quality monitoring",
        "Waste management planning",
        "Remediation strategy development",
        "Regulatory compliance consulting",
        "Sustainability reporting",
        "Carbon footprint analysis",
      ]),
      center_head_id: "ch-3",
      duration: "2-6 weeks",
      price: 3000,
      is_free: false,
      equipment: [
        {
          id: "eq-6",
          name: "Environmental Monitoring Station",
          description:
            "Automated system for continuous environmental parameter monitoring",
          image: "/environmental-monitoring.jpg",
          specifications: JSON.stringify([
            "Air quality sensors (PM2.5, PM10, NOx, SOx)",
            "Water quality analyzers",
            "Meteorological sensors",
            "Real-time data logging and transmission",
          ]),
        },
      ],
    },
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
        is_free: serviceData.is_free,
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
        is_free: serviceData.is_free,
      },
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
          serviceId: service.id,
        },
        create: {
          id: equipmentData.id,
          name: equipmentData.name,
          description: equipmentData.description,
          image: equipmentData.image,
          specifications: equipmentData.specifications,
          serviceId: service.id,
        },
      });
    }
  }

  console.log("✅ Services and equipment created");

  // Create staff members
  const staffMembers = [
    {
      id: "staff-1",
      name: "Dr. Ahmed Hassan",
      title: "Senior Petroleum Engineer",
      bio: "Dr. Ahmed Hassan is a senior petroleum engineer with over 15 years of experience in reservoir analysis and drilling operations. He holds a PhD in Petroleum Engineering from Cairo University.",
      email: "ahmed.hassan@epri.edu",
      phone: "+201234567801",
      picture: "/staff/ahmed-hassan.jpg",
    },
    {
      id: "staff-2",
      name: "Dr. Fatima Al-Rashid",
      title: "Lead Geologist",
      bio: "Dr. Fatima Al-Rashid specializes in sedimentology and structural geology with extensive field experience in the Middle East and North Africa region.",
      email: "fatima.rashid@epri.edu",
      phone: "+201234567802",
      picture: "/staff/fatima-rashid.jpg",
    },
    {
      id: "staff-3",
      name: "Eng. Mohamed Gamal",
      title: "Laboratory Manager",
      bio: "Engineering Mohamed Gamal oversees laboratory operations and ensures quality control in all testing procedures. He has 10 years of experience in analytical chemistry.",
      email: "mohamed.gamal@epri.edu",
      phone: "+201234567803",
      picture: "/staff/mohamed-gamal.jpg",
    },
    {
      id: "staff-4",
      name: "Dr. Layla Mahmoud",
      title: "Environmental Specialist",
      bio: "Dr. Layla Mahmoud leads environmental impact assessments and sustainability initiatives. She holds a PhD in Environmental Engineering.",
      email: "layla.mahmoud@epri.edu",
      phone: "+201234567804",
      picture: "/staff/layla-mahmoud.jpg",
    },
    {
      id: "staff-5",
      name: "Eng. Omar Salah",
      title: "Geophysics Technician",
      bio: "Engineering Omar Salah specializes in seismic data acquisition and processing. He has extensive experience with modern geophysical equipment.",
      email: "omar.salah@epri.edu",
      phone: "+201234567805",
      picture: "/staff/omar-salah.jpg",
    },
    {
      id: "staff-6",
      name: "Dr. Nadia Farouk",
      title: "Research Director",
      bio: "Dr. Nadia Farouk oversees research initiatives and collaborations. She has published extensively in petroleum geology and reservoir characterization.",
      email: "nadia.farouk@epri.edu",
      phone: "+201234567806",
      picture: "/staff/nadia-farouk.jpg",
    },
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
        picture: staffData.picture,
      },
      create: {
        id: staffData.id,
        name: staffData.name,
        title: staffData.title,
        bio: staffData.bio,
        email: staffData.email,
        phone: staffData.phone,
        picture: staffData.picture,
      },
    });
  }

  console.log("✅ Staff members created");

  // Create additional staff members for all departments
  const additionalStaffMembers = [
    // Sedimentology Laboratory Staff
    {
      id: "staff-sed-1",
      name: "Dr. Samira El-Naggar",
      title: "Senior Sedimentologist",
      academic_position: "Dr.",
      bio: "Dr. Samira El-Naggar specializes in carbonate sedimentology and reservoir characterization with 20 years of experience.",
      email: "s.el-naggar@epri.edu",
      phone: "+201234567807",
      picture: "/staff/samira-el-naggar.jpg",
    },
    {
      id: "staff-sed-2",
      name: "Eng. Tarek Abdel-Fattah",
      title: "Petrographic Analyst",
      academic_position: "Eng.",
      bio: "Eng. Tarek Abdel-Fattah is an expert in thin section analysis and petrographic characterization.",
      email: "t.abdel-fattah@epri.edu",
      phone: "+201234567808",
      picture: "/staff/tarek-abdel-fattah.jpg",
    },
    {
      id: "staff-sed-3",
      name: "Dr. Mona Ibrahim",
      title: "Reservoir Geologist",
      academic_position: "Dr.",
      bio: "Dr. Mona Ibrahim focuses on clastic reservoir systems and depositional environment analysis.",
      email: "m.ibrahim@epri.edu",
      phone: "+201234567809",
      picture: "/staff/mona-ibrahim.jpg",
    },
    {
      id: "staff-sed-4",
      name: "Eng. Hossam Ali",
      title: "Core Analysis Specialist",
      academic_position: "Eng.",
      bio: "Eng. Hossam Ali manages core analysis operations and quality control procedures.",
      email: "h.ali@epri.edu",
      phone: "+201234567810",
      picture: "/staff/hossam-ali.jpg",
    },

    // Paleontology Laboratory Staff
    {
      id: "staff-pal-1",
      name: "Dr. Yasmine Farid",
      title: "Micropaleontologist",
      academic_position: "Dr.",
      bio: "Dr. Yasmine Farid specializes in foraminiferal biostratigraphy and paleoenvironmental reconstruction.",
      email: "y.farid@epri.edu",
      phone: "+201234567811",
      picture: "/staff/yasmine-farid.jpg",
    },
    {
      id: "staff-pal-2",
      name: "Eng. Karim Mohamed",
      title: "Fossil Preparation Specialist",
      academic_position: "Eng.",
      bio: "Eng. Karim Mohamed is an expert in fossil preparation and micropaleontological sample processing.",
      email: "k.mohamed@epri.edu",
      phone: "+201234567812",
      picture: "/staff/karim-mohamed.jpg",
    },
    {
      id: "staff-pal-3",
      name: "Dr. Rania Hassan",
      title: "Biostratigrapher",
      academic_position: "Dr.",
      bio: "Dr. Rania Hassan conducts biostratigraphic age dating and correlation studies.",
      email: "r.hassan@epri.edu",
      phone: "+201234567813",
      picture: "/staff/rania-hassan.jpg",
    },
    {
      id: "staff-pal-4",
      name: "Eng. Amr Salah",
      title: "Paleoecology Analyst",
      academic_position: "Eng.",
      bio: "Eng. Amr Salah specializes in paleoecological interpretation and environmental reconstruction.",
      email: "a.salah@epri.edu",
      phone: "+201234567814",
      picture: "/staff/amr-salah.jpg",
    },

    // Geophysics Laboratory Staff
    {
      id: "staff-geo-1",
      name: "Prof. Dr. Magdy El-Sayed",
      title: "Senior Geophysicist",
      academic_position: "Prof. Dr.",
      bio: "Prof. Dr. Magdy El-Sayed is a leading expert in seismic interpretation and reservoir geophysics.",
      email: "m.el-sayed@epri.edu",
      phone: "+201234567815",
      picture: "/staff/magdy-el-sayed.jpg",
    },
    {
      id: "staff-geo-2",
      name: "Dr. Noha Abdel-Rahman",
      title: "Seismic Interpreter",
      academic_position: "Dr.",
      bio: "Dr. Noha Abdel-Rahman specializes in 3D seismic interpretation and attribute analysis.",
      email: "n.abdel-rahman@epri.edu",
      phone: "+201234567816",
      picture: "/staff/noha-abdel-rahman.jpg",
    },
    {
      id: "staff-geo-3",
      name: "Eng. Waleed Fathy",
      title: "Well Log Analyst",
      academic_position: "Eng.",
      bio: "Eng. Waleed Fathy is an expert in well log interpretation and petrophysical analysis.",
      email: "w.fathy@epri.edu",
      phone: "+201234567817",
      picture: "/staff/waleed-fathy.jpg",
    },
    {
      id: "staff-geo-4",
      name: "Dr. Dalia Mostafa",
      title: "Gravity & Magnetic Specialist",
      academic_position: "Dr.",
      bio: "Dr. Dalia Mostafa conducts gravity and magnetic surveys for petroleum exploration.",
      email: "d.mostafa@epri.edu",
      phone: "+201234567818",
      picture: "/staff/dalia-mostafa.jpg",
    },
    {
      id: "staff-geo-5",
      name: "Eng. Sherif Kamel",
      title: "Geophysical Data Processor",
      academic_position: "Eng.",
      bio: "Eng. Sherif Kamel processes and analyzes geophysical data using advanced software tools.",
      email: "s.kamel@epri.edu",
      phone: "+201234567819",
      picture: "/staff/sherif-kamel.jpg",
    },

    // Drilling Engineering Staff
    {
      id: "staff-drill-1",
      name: "Eng. Khaled Mahmoud",
      title: "Senior Drilling Engineer",
      academic_position: "Eng.",
      bio: "Eng. Khaled Mahmoud has 25 years of experience in drilling operations and well design.",
      email: "k.mahmoud@epri.edu",
      phone: "+201234567820",
      picture: "/staff/khaled-mahmoud.jpg",
    },
    {
      id: "staff-drill-2",
      name: "Dr. Amira Soliman",
      title: "Drilling Fluid Specialist",
      academic_position: "Dr.",
      bio: "Dr. Amira Soliman specializes in drilling fluid design and optimization.",
      email: "a.soliman@epri.edu",
      phone: "+201234567821",
      picture: "/staff/amira-soliman.jpg",
    },
    {
      id: "staff-drill-3",
      name: "Eng. Mohamed Ashraf",
      title: "Well Control Engineer",
      academic_position: "Eng.",
      bio: "Eng. Mohamed Ashraf is an expert in well control and blowout prevention.",
      email: "m.ashraf@epri.edu",
      phone: "+201234567822",
      picture: "/staff/mohamed-ashraf.jpg",
    },
    {
      id: "staff-drill-4",
      name: "Dr. Heba Ali",
      title: "Directional Drilling Expert",
      academic_position: "Dr.",
      bio: "Dr. Heba Ali specializes in directional drilling and well trajectory optimization.",
      email: "h.ali@epri.edu",
      phone: "+201234567823",
      picture: "/staff/heba-ali.jpg",
    },

    // Reservoir Engineering Staff
    {
      id: "staff-res-1",
      name: "Prof. Dr. Ahmed El-Mahdy",
      title: "Reservoir Engineer",
      academic_position: "Prof. Dr.",
      bio: "Prof. Dr. Ahmed El-Mahdy is a leading expert in reservoir simulation and production optimization.",
      email: "a.el-mahdy@epri.edu",
      phone: "+201234567824",
      picture: "/staff/ahmed-el-mahdy.jpg",
    },
    {
      id: "staff-res-2",
      name: "Dr. Sanaa Mohamed",
      title: "Enhanced Oil Recovery Specialist",
      academic_position: "Dr.",
      bio: "Dr. Sanaa Mohamed specializes in EOR techniques and reservoir management.",
      email: "s.mohamed@epri.edu",
      phone: "+201234567825",
      picture: "/staff/sanaa-mohamed.jpg",
    },
    {
      id: "staff-res-3",
      name: "Eng. Osama Hassan",
      title: "Reservoir Modeler",
      academic_position: "Eng.",
      bio: "Eng. Osama Hassan builds and maintains reservoir simulation models.",
      email: "o.hassan@epri.edu",
      phone: "+201234567826",
      picture: "/staff/osama-hassan.jpg",
    },
    {
      id: "staff-res-4",
      name: "Dr. Laila Farouk",
      title: "Production Optimization Engineer",
      academic_position: "Dr.",
      bio: "Dr. Laila Farouk optimizes production strategies and well performance.",
      email: "l.farouk@epri.edu",
      phone: "+201234567827",
      picture: "/staff/laila-farouk.jpg",
    },

    // Production Technology Staff
    {
      id: "staff-prod-1",
      name: "Eng. Mahmoud El-Sherif",
      title: "Production Engineer",
      academic_position: "Eng.",
      bio: "Eng. Mahmoud El-Sherif designs well completions and production systems.",
      email: "m.el-sherif@epri.edu",
      phone: "+201234567828",
      picture: "/staff/mahmoud-el-sherif.jpg",
    },
    {
      id: "staff-prod-2",
      name: "Dr. Nermeen Ibrahim",
      title: "Artificial Lift Specialist",
      academic_position: "Dr.",
      bio: "Dr. Nermeen Ibrahim specializes in artificial lift systems and optimization.",
      email: "n.ibrahim@epri.edu",
      phone: "+201234567829",
      picture: "/staff/nermeen-ibrahim.jpg",
    },
    {
      id: "staff-prod-3",
      name: "Eng. Youssef Ali",
      title: "Well Completion Engineer",
      academic_position: "Eng.",
      bio: "Eng. Youssef Ali designs and implements well completion strategies.",
      email: "y.ali@epri.edu",
      phone: "+201234567830",
      picture: "/staff/youssef-ali.jpg",
    },
    {
      id: "staff-prod-4",
      name: "Dr. Reham Fahmy",
      title: "Production Systems Analyst",
      academic_position: "Dr.",
      bio: "Dr. Reham Fahmy analyzes production systems and flow assurance.",
      email: "r.fahmy@epri.edu",
      phone: "+201234567831",
      picture: "/staff/reham-fahmy.jpg",
    },

    // Core Analysis Laboratory Staff
    {
      id: "staff-core-1",
      name: "Dr. Amira Fouad",
      title: "Core Analysis Specialist",
      academic_position: "Dr.",
      bio: "Dr. Amira Fouad specializes in routine and special core analysis.",
      email: "a.fouad@epri.edu",
      phone: "+201234567832",
      picture: "/staff/amira-fouad.jpg",
    },
    {
      id: "staff-core-2",
      name: "Eng. Tamer Mohamed",
      title: "Petrophysicist",
      academic_position: "Eng.",
      bio: "Eng. Tamer Mohamed conducts petrophysical property measurements and analysis.",
      email: "t.mohamed@epri.edu",
      phone: "+201234567833",
      picture: "/staff/tamer-mohamed.jpg",
    },
    {
      id: "staff-core-3",
      name: "Dr. Dina Samir",
      title: "Rock Mechanics Expert",
      academic_position: "Dr.",
      bio: "Dr. Dina Samir specializes in rock mechanics and formation evaluation.",
      email: "d.samir@epri.edu",
      phone: "+201234567834",
      picture: "/staff/dina-samir.jpg",
    },
    {
      id: "staff-core-4",
      name: "Eng. Hazem El-Gamal",
      title: "CT Scanning Specialist",
      academic_position: "Eng.",
      bio: "Eng. Hazem El-Gamal operates CT scanning equipment for core analysis.",
      email: "h.el-gamal@epri.edu",
      phone: "+201234567835",
      picture: "/staff/hazem-el-gamal.jpg",
    },

    // Chemical Analysis Laboratory Staff
    {
      id: "staff-chem-1",
      name: "Dr. Rania El-Khatib",
      title: "Analytical Chemist",
      academic_position: "Dr.",
      bio: "Dr. Rania El-Khatib specializes in petroleum product analysis and quality control.",
      email: "r.el-khatib@epri.edu",
      phone: "+201234567836",
      picture: "/staff/rania-el-khatib.jpg",
    },
    {
      id: "staff-chem-2",
      name: "Eng. Ashraf Saad",
      title: "Quality Control Manager",
      academic_position: "Eng.",
      bio: "Eng. Ashraf Saad manages quality control procedures and testing protocols.",
      email: "a.saad@epri.edu",
      phone: "+201234567837",
      picture: "/staff/ashraf-saad.jpg",
    },
    {
      id: "staff-chem-3",
      name: "Dr. Marwa Abdel-Aziz",
      title: "Composition Analyst",
      academic_position: "Dr.",
      bio: "Dr. Marwa Abdel-Aziz analyzes petroleum composition and properties.",
      email: "m.abdel-aziz@epri.edu",
      phone: "+201234567838",
      picture: "/staff/marwa-abdel-aziz.jpg",
    },
    {
      id: "staff-chem-4",
      name: "Eng. Mostafa El-Sayed",
      title: "Laboratory Technician",
      academic_position: "Eng.",
      bio: "Eng. Mostafa El-Sayed performs routine chemical analysis and testing.",
      email: "m.el-sayed@epri.edu",
      phone: "+201234567839",
      picture: "/staff/mostafa-el-sayed.jpg",
    },

    // Spectroscopy Laboratory Staff
    {
      id: "staff-spec-1",
      name: "Dr. Hala Kamel",
      title: "Spectroscopist",
      academic_position: "Dr.",
      bio: "Dr. Hala Kamel specializes in GC-MS and IR spectroscopy analysis.",
      email: "h.kamel@epri.edu",
      phone: "+201234567840",
      picture: "/staff/hala-kamel.jpg",
    },
    {
      id: "staff-spec-2",
      name: "Eng. Khaled Farid",
      title: "GC-MS Operator",
      academic_position: "Eng.",
      bio: "Eng. Khaled Farid operates and maintains GC-MS equipment.",
      email: "k.farid@epri.edu",
      phone: "+201234567841",
      picture: "/staff/khaled-farid.jpg",
    },
    {
      id: "staff-spec-3",
      name: "Dr. Nada Hassan",
      title: "Molecular Analysis Specialist",
      academic_position: "Dr.",
      bio: "Dr. Nada Hassan conducts molecular characterization of petroleum products.",
      email: "n.hassan@epri.edu",
      phone: "+201234567842",
      picture: "/staff/nada-hassan.jpg",
    },
    {
      id: "staff-spec-4",
      name: "Eng. Sameh Ibrahim",
      title: "Instrumentation Engineer",
      academic_position: "Eng.",
      bio: "Eng. Sameh Ibrahim maintains and calibrates spectroscopic instruments.",
      email: "s.ibrahim@epri.edu",
      phone: "+201234567843",
      picture: "/staff/sameh-ibrahim.jpg",
    },

    // Corrosion Testing Laboratory Staff
    {
      id: "staff-corr-1",
      name: "Dr. Mohamed El-Badry",
      title: "Corrosion Engineer",
      academic_position: "Dr.",
      bio: "Dr. Mohamed El-Badry specializes in corrosion testing and material evaluation.",
      email: "m.el-badry@epri.edu",
      phone: "+201234567844",
      picture: "/staff/mohamed-el-badry.jpg",
    },
    {
      id: "staff-corr-2",
      name: "Eng. Sara Mahmoud",
      title: "Materials Testing Specialist",
      academic_position: "Eng.",
      bio: "Eng. Sara Mahmoud conducts materials testing and corrosion evaluation.",
      email: "s.mahmoud@epri.edu",
      phone: "+201234567845",
      picture: "/staff/sara-mahmoud.jpg",
    },
    {
      id: "staff-corr-3",
      name: "Dr. Ahmed Fawzy",
      title: "Electrochemical Analyst",
      academic_position: "Dr.",
      bio: "Dr. Ahmed Fawzy specializes in electrochemical corrosion testing methods.",
      email: "a.fawzy@epri.edu",
      phone: "+201234567846",
      picture: "/staff/ahmed-fawzy.jpg",
    },
    {
      id: "staff-corr-4",
      name: "Eng. Dina El-Shamy",
      title: "Protective Coating Expert",
      academic_position: "Eng.",
      bio: "Eng. Dina El-Shamy evaluates protective coatings and corrosion inhibitors.",
      email: "d.el-shamy@epri.edu",
      phone: "+201234567847",
      picture: "/staff/dina-el-shamy.jpg",
    },

    // Soil Analysis Laboratory Staff
    {
      id: "staff-soil-1",
      name: "Dr. Magdy Hassan",
      title: "Environmental Geologist",
      academic_position: "Dr.",
      bio: "Dr. Magdy Hassan specializes in soil contamination assessment and remediation.",
      email: "m.hassan@epri.edu",
      phone: "+201234567848",
      picture: "/staff/magdy-hassan.jpg",
    },
    {
      id: "staff-soil-2",
      name: "Eng. Noha El-Said",
      title: "Soil Testing Specialist",
      academic_position: "Eng.",
      bio: "Eng. Noha El-Said conducts soil analysis and environmental monitoring.",
      email: "n.el-said@epri.edu",
      phone: "+201234567849",
      picture: "/staff/noha-el-said.jpg",
    },
    {
      id: "staff-soil-3",
      name: "Dr. Karim Abdel-Moneim",
      title: "Remediation Engineer",
      academic_position: "Dr.",
      bio: "Dr. Karim Abdel-Moneim designs and implements soil remediation strategies.",
      email: "k.abdel-moneim@epri.edu",
      phone: "+201234567850",
      picture: "/staff/karim-abdel-moneim.jpg",
    },
    {
      id: "staff-soil-4",
      name: "Eng. Salma Mostafa",
      title: "Environmental Analyst",
      academic_position: "Eng.",
      bio: "Eng. Salma Mostafa performs environmental analysis and contamination assessment.",
      email: "s.mostafa@epri.edu",
      phone: "+201234567851",
      picture: "/staff/salma-mostafa.jpg",
    },

    // Mud Testing Laboratory Staff
    {
      id: "staff-mud-1",
      name: "Dr. Wael El-Kady",
      title: "Drilling Fluid Engineer",
      academic_position: "Dr.",
      bio: "Dr. Wael El-Kady specializes in drilling fluid analysis and testing.",
      email: "w.el-kady@epri.edu",
      phone: "+201234567852",
      picture: "/staff/wael-el-kady.jpg",
    },
    {
      id: "staff-mud-2",
      name: "Eng. Rana Fahmy",
      title: "Rheology Specialist",
      academic_position: "Eng.",
      bio: "Eng. Rana Fahmy conducts rheological measurements and fluid testing.",
      email: "r.fahmy@epri.edu",
      phone: "+201234567853",
      picture: "/staff/rana-fahmy.jpg",
    },
    {
      id: "staff-mud-3",
      name: "Dr. Tarek El-Sherbiny",
      title: "Filtration Testing Expert",
      academic_position: "Dr.",
      bio: "Dr. Tarek El-Sherbiny specializes in filtration testing and fluid loss control.",
      email: "t.el-sherbiny@epri.edu",
      phone: "+201234567854",
      picture: "/staff/tarek-el-sherbiny.jpg",
    },
    {
      id: "staff-mud-4",
      name: "Eng. Heba El-Masry",
      title: "Mud Testing Technician",
      academic_position: "Eng.",
      bio: "Eng. Heba El-Masry performs routine mud testing and quality control.",
      email: "h.el-masry@epri.edu",
      phone: "+201234567855",
      picture: "/staff/heba-el-masry.jpg",
    },

    // Refining Technology Staff
    {
      id: "staff-ref-1",
      name: "Prof. Dr. Samir El-Gamal",
      title: "Refining Engineer",
      academic_position: "Prof. Dr.",
      bio: "Prof. Dr. Samir El-Gamal is a leading expert in petroleum refining processes.",
      email: "s.el-gamal@epri.edu",
      phone: "+201234567856",
      picture: "/staff/samir-el-gamal.jpg",
    },
    {
      id: "staff-ref-2",
      name: "Dr. Mona El-Shahat",
      title: "Catalyst Specialist",
      academic_position: "Dr.",
      bio: "Dr. Mona El-Shahat develops and tests refining catalysts.",
      email: "m.el-shahat@epri.edu",
      phone: "+201234567857",
      picture: "/staff/mona-el-shahat.jpg",
    },
    {
      id: "staff-ref-3",
      name: "Eng. Hany Abdel-Rahman",
      title: "Process Optimization Engineer",
      academic_position: "Eng.",
      bio: "Eng. Hany Abdel-Rahman optimizes refining processes and operations.",
      email: "h.abdel-rahman@epri.edu",
      phone: "+201234567858",
      picture: "/staff/hany-abdel-rahman.jpg",
    },
    {
      id: "staff-ref-4",
      name: "Dr. Yasmine El-Khouly",
      title: "Product Quality Analyst",
      academic_position: "Dr.",
      bio: "Dr. Yasmine El-Khouly ensures product quality and compliance with standards.",
      email: "y.el-khouly@epri.edu",
      phone: "+201234567859",
      picture: "/staff/yasmine-el-khouly.jpg",
    },

    // Distillation & Separation Staff
    {
      id: "staff-dist-1",
      name: "Dr. Amr El-Sawy",
      title: "Separation Technology Expert",
      academic_position: "Dr.",
      bio: "Dr. Amr El-Sawy specializes in distillation and separation processes.",
      email: "a.el-sawy@epri.edu",
      phone: "+201234567860",
      picture: "/staff/amr-el-sawy.jpg",
    },
    {
      id: "staff-dist-2",
      name: "Eng. Lina Fahmy",
      title: "Fractionation Specialist",
      academic_position: "Eng.",
      bio: "Eng. Lina Fahmy designs and operates fractionation systems.",
      email: "l.fahmy@epri.edu",
      phone: "+201234567861",
      picture: "/staff/lina-fahmy.jpg",
    },
    {
      id: "staff-dist-3",
      name: "Dr. Omar El-Hadidy",
      title: "Process Design Engineer",
      academic_position: "Dr.",
      bio: "Dr. Omar El-Hadidy designs distillation processes and equipment.",
      email: "o.el-hadidy@epri.edu",
      phone: "+201234567862",
      picture: "/staff/omar-el-hadidy.jpg",
    },
    {
      id: "staff-dist-4",
      name: "Eng. Nour El-Din",
      title: "Separation Systems Operator",
      academic_position: "Eng.",
      bio: "Eng. Nour El-Din operates and maintains separation equipment.",
      email: "n.el-din@epri.edu",
      phone: "+201234567863",
      picture: "/staff/nour-el-din.jpg",
    },

    // Petroleum Applications Research Staff
    {
      id: "staff-app-1",
      name: "Dr. Sherine El-Mahdy",
      title: "Applications Research Director",
      academic_position: "Dr.",
      bio: "Dr. Sherine El-Mahdy leads research in petroleum-based product applications.",
      email: "s.el-mahdy@epri.edu",
      phone: "+201234567864",
      picture: "/staff/sherine-el-mahdy.jpg",
    },
    {
      id: "staff-app-2",
      name: "Eng. Mohamed El-Saadany",
      title: "Product Development Engineer",
      academic_position: "Eng.",
      bio: "Eng. Mohamed El-Saadany develops new petroleum-based products.",
      email: "m.el-saadany@epri.edu",
      phone: "+201234567865",
      picture: "/staff/mohamed-el-saadany.jpg",
    },
    {
      id: "staff-app-3",
      name: "Dr. Rania El-Shazly",
      title: "Specialty Chemicals Researcher",
      academic_position: "Dr.",
      bio: "Dr. Rania El-Shazly researches specialty chemicals from petroleum feedstocks.",
      email: "r.el-shazly@epri.edu",
      phone: "+201234567866",
      picture: "/staff/rania-el-shazly.jpg",
    },
    {
      id: "staff-app-4",
      name: "Eng. Tamer El-Khatib",
      title: "Testing & Evaluation Specialist",
      academic_position: "Eng.",
      bio: "Eng. Tamer El-Khatib tests and evaluates petroleum product performance.",
      email: "t.el-khatib@epri.edu",
      phone: "+201234567867",
      picture: "/staff/tamer-el-khatib.jpg",
    },

    // Lubricants Development Staff
    {
      id: "staff-lub-1",
      name: "Dr. Hossam El-Din",
      title: "Lubricants Engineer",
      academic_position: "Dr.",
      bio: "Dr. Hossam El-Din develops advanced lubricants and greases.",
      email: "h.el-din@epri.edu",
      phone: "+201234567868",
      picture: "/staff/hossam-el-din.jpg",
    },
    {
      id: "staff-lub-2",
      name: "Eng. Dina El-Mahdy",
      title: "Formulation Specialist",
      academic_position: "Eng.",
      bio: "Eng. Dina El-Mahdy formulates lubricant blends and additives.",
      email: "d.el-mahdy@epri.edu",
      phone: "+201234567869",
      picture: "/staff/dina-el-mahdy.jpg",
    },
    {
      id: "staff-lub-3",
      name: "Dr. Khaled El-Sayed",
      title: "Performance Testing Engineer",
      academic_position: "Dr.",
      bio: "Dr. Khaled El-Sayed tests lubricant performance and properties.",
      email: "k.el-sayed@epri.edu",
      phone: "+201234567870",
      picture: "/staff/khaled-el-sayed.jpg",
    },
    {
      id: "staff-lub-4",
      name: "Eng. Noha El-Khouly",
      title: "Quality Assurance Manager",
      academic_position: "Eng.",
      bio: "Eng. Noha El-Khouly ensures lubricant quality and standards compliance.",
      email: "n.el-khouly@epri.edu",
      phone: "+201234567871",
      picture: "/staff/noha-el-khouly.jpg",
    },

    // Petrochemicals Research Staff
    {
      id: "staff-pet-1",
      name: "Prof. Dr. Magdy El-Shazly",
      title: "Petrochemicals Researcher",
      academic_position: "Prof. Dr.",
      bio: "Prof. Dr. Magdy El-Shazly leads petrochemical process research and development.",
      email: "m.el-shazly@epri.edu",
      phone: "+201234567872",
      picture: "/staff/magdy-el-shazly.jpg",
    },
    {
      id: "staff-pet-2",
      name: "Dr. Amira El-Mahdy",
      title: "Polymer Synthesis Specialist",
      academic_position: "Dr.",
      bio: "Dr. Amira El-Mahdy specializes in polymer synthesis from petrochemical feedstocks.",
      email: "a.el-mahdy@epri.edu",
      phone: "+201234567873",
      picture: "/staff/amira-el-mahdy.jpg",
    },
    {
      id: "staff-pet-3",
      name: "Eng. Wael El-Saadany",
      title: "Process Development Engineer",
      academic_position: "Eng.",
      bio: "Eng. Wael El-Saadany develops petrochemical processes and technologies.",
      email: "w.el-saadany@epri.edu",
      phone: "+201234567874",
      picture: "/staff/wael-el-saadany.jpg",
    },
    {
      id: "staff-pet-4",
      name: "Dr. Laila El-Khatib",
      title: "Catalyst Research Scientist",
      academic_position: "Dr.",
      bio: "Dr. Laila El-Khatib researches catalysts for petrochemical processes.",
      email: "l.el-khatib@epri.edu",
      phone: "+201234567875",
      picture: "/staff/laila-el-khatib.jpg",
    },

    // Polymers & Plastics Staff
    {
      id: "staff-pol-1",
      name: "Dr. Tarek El-Shazly",
      title: "Polymer Engineer",
      academic_position: "Dr.",
      bio: "Dr. Tarek El-Shazly specializes in polymer research and plastic development.",
      email: "t.el-shazly@epri.edu",
      phone: "+201234567876",
      picture: "/staff/tarek-el-shazly.jpg",
    },
    {
      id: "staff-pol-2",
      name: "Eng. Rana El-Mahdy",
      title: "Materials Engineer",
      academic_position: "Eng.",
      bio: "Eng. Rana El-Mahdy develops polymer materials and composites.",
      email: "r.el-mahdy@epri.edu",
      phone: "+201234567877",
      picture: "/staff/rana-el-mahdy.jpg",
    },
    {
      id: "staff-pol-3",
      name: "Dr. Hany El-Saadany",
      title: "Plastic Processing Specialist",
      academic_position: "Dr.",
      bio: "Dr. Hany El-Saadany specializes in plastic processing and manufacturing.",
      email: "h.el-saadany@epri.edu",
      phone: "+201234567878",
      picture: "/staff/hany-el-saadany.jpg",
    },
    {
      id: "staff-pol-4",
      name: "Eng. Dina El-Khatib",
      title: "Polymer Testing Engineer",
      academic_position: "Eng.",
      bio: "Eng. Dina El-Khatib tests polymer properties and performance.",
      email: "d.el-khatib@epri.edu",
      phone: "+201234567879",
      picture: "/staff/dina-el-khatib.jpg",
    },

    // Process Design & Development Staff
    {
      id: "staff-proc-1",
      name: "Prof. Dr. Samy El-Mahdy",
      title: "Process Design Engineer",
      academic_position: "Prof. Dr.",
      bio: "Prof. Dr. Samy El-Mahdy designs petroleum processing facilities and systems.",
      email: "s.el-mahdy@epri.edu",
      phone: "+201234567880",
      picture: "/staff/samy-el-mahdy.jpg",
    },
    {
      id: "staff-proc-2",
      name: "Dr. Nermeen El-Shazly",
      title: "Feasibility Study Specialist",
      academic_position: "Dr.",
      bio: "Dr. Nermeen El-Shazly conducts feasibility studies and process optimization.",
      email: "n.el-shazly@epri.edu",
      phone: "+201234567881",
      picture: "/staff/nermeen-el-shazly.jpg",
    },
    {
      id: "staff-proc-3",
      name: "Eng. Youssef El-Saadany",
      title: "Engineering Design Manager",
      academic_position: "Eng.",
      bio: "Eng. Youssef El-Saadany manages engineering design projects and teams.",
      email: "y.el-saadany@epri.edu",
      phone: "+201234567882",
      picture: "/staff/youssef-el-saadany.jpg",
    },
    {
      id: "staff-proc-4",
      name: "Dr. Reham El-Khatib",
      title: "Process Safety Engineer",
      academic_position: "Dr.",
      bio: "Dr. Reham El-Khatib ensures process safety and risk assessment.",
      email: "r.el-khatib@epri.edu",
      phone: "+201234567883",
      picture: "/staff/reham-el-khatib.jpg",
    },

    // Process Simulation Staff
    {
      id: "staff-sim-1",
      name: "Dr. Karim El-Mahdy",
      title: "Simulation Engineer",
      academic_position: "Dr.",
      bio: "Dr. Karim El-Mahdy develops process simulation models and optimization strategies.",
      email: "k.el-mahdy@epri.edu",
      phone: "+201234567884",
      picture: "/staff/karim-el-mahdy.jpg",
    },
    {
      id: "staff-sim-2",
      name: "Eng. Salma El-Shazly",
      title: "Modeling Specialist",
      academic_position: "Eng.",
      bio: "Eng. Salma El-Shazly creates and maintains process simulation models.",
      email: "s.el-shazly@epri.edu",
      phone: "+201234567885",
      picture: "/staff/salma-el-shazly.jpg",
    },
    {
      id: "staff-sim-3",
      name: "Dr. Waleed El-Saadany",
      title: "Optimization Analyst",
      academic_position: "Dr.",
      bio: "Dr. Waleed El-Saadany optimizes processes using simulation tools.",
      email: "w.el-saadany@epri.edu",
      phone: "+201234567886",
      picture: "/staff/waleed-el-saadany.jpg",
    },
    {
      id: "staff-sim-4",
      name: "Eng. Heba El-Khatib",
      title: "Software Engineer",
      academic_position: "Eng.",
      bio: "Eng. Heba El-Khatib maintains simulation software and computing systems.",
      email: "h.el-khatib@epri.edu",
      phone: "+201234567887",
      picture: "/staff/heba-el-khatib.jpg",
    },

    // Environmental Assessment Staff
    {
      id: "staff-env-1",
      name: "Dr. Mohamed El-Mahdy",
      title: "Environmental Engineer",
      academic_position: "Dr.",
      bio: "Dr. Mohamed El-Mahdy conducts environmental impact assessments.",
      email: "m.el-mahdy@epri.edu",
      phone: "+201234567888",
      picture: "/staff/mohamed-el-mahdy.jpg",
    },
    {
      id: "staff-env-2",
      name: "Eng. Sara El-Shazly",
      title: "Sustainability Specialist",
      academic_position: "Eng.",
      bio: "Eng. Sara El-Shazly develops sustainable practices and monitoring systems.",
      email: "s.el-shazly@epri.edu",
      phone: "+201234567889",
      picture: "/staff/sara-el-shazly.jpg",
    },
    {
      id: "staff-env-3",
      name: "Dr. Ahmed El-Saadany",
      title: "Environmental Monitoring Manager",
      academic_position: "Dr.",
      bio: "Dr. Ahmed El-Saadany manages environmental monitoring programs.",
      email: "a.el-saadany@epri.edu",
      phone: "+201234567890",
      picture: "/staff/ahmed-el-saadany.jpg",
    },
    {
      id: "staff-env-4",
      name: "Eng. Dina El-Khatib",
      title: "Compliance Officer",
      academic_position: "Eng.",
      bio: "Eng. Dina El-Khatib ensures regulatory compliance and reporting.",
      email: "d.el-khatib@epri.edu",
      phone: "+201234567891",
      picture: "/staff/dina-el-khatib-env.jpg",
    },
  ];

  // Create all additional staff members
  for (const staffData of additionalStaffMembers) {
    await prisma.staff.upsert({
      where: { id: staffData.id },
      update: {
        name: staffData.name,
        title: staffData.title,
        academic_position: staffData.academic_position,
        bio: staffData.bio,
        email: staffData.email,
        phone: staffData.phone,
        picture: staffData.picture,
      },
      create: {
        id: staffData.id,
        name: staffData.name,
        title: staffData.title,
        academic_position: staffData.academic_position,
        bio: staffData.bio,
        email: staffData.email,
        phone: staffData.phone,
        picture: staffData.picture,
      },
    });
  }

  console.log(
    `✅ ${additionalStaffMembers.length} additional staff members created`
  );

  // Assign staff to departments
  const departmentStaffAssignments = [
    // Sedimentology Laboratory (4 staff)
    {
      department_id: "dept-sedimentology",
      staff_ids: ["staff-sed-1", "staff-sed-2", "staff-sed-3", "staff-sed-4"],
    },
    // Paleontology Laboratory (4 staff)
    {
      department_id: "dept-paleontology",
      staff_ids: ["staff-pal-1", "staff-pal-2", "staff-pal-3", "staff-pal-4"],
    },
    // Geophysics Laboratory (5 staff)
    {
      department_id: "dept-geophysics",
      staff_ids: [
        "staff-geo-1",
        "staff-geo-2",
        "staff-geo-3",
        "staff-geo-4",
        "staff-geo-5",
      ],
    },
    // Drilling Engineering (4 staff)
    {
      department_id: "dept-drilling",
      staff_ids: [
        "staff-drill-1",
        "staff-drill-2",
        "staff-drill-3",
        "staff-drill-4",
      ],
    },
    // Reservoir Engineering (4 staff)
    {
      department_id: "dept-reservoir",
      staff_ids: ["staff-res-1", "staff-res-2", "staff-res-3", "staff-res-4"],
    },
    // Production Technology (4 staff)
    {
      department_id: "dept-production",
      staff_ids: [
        "staff-prod-1",
        "staff-prod-2",
        "staff-prod-3",
        "staff-prod-4",
      ],
    },
    // Core Analysis Laboratory (4 staff)
    {
      department_id: "dept-core-analysis",
      staff_ids: [
        "staff-core-1",
        "staff-core-2",
        "staff-core-3",
        "staff-core-4",
      ],
    },
    // Chemical Analysis Laboratory (4 staff)
    {
      department_id: "dept-chemical-analysis",
      staff_ids: [
        "staff-chem-1",
        "staff-chem-2",
        "staff-chem-3",
        "staff-chem-4",
      ],
    },
    // Spectroscopy Laboratory (4 staff)
    {
      department_id: "dept-spectroscopy",
      staff_ids: [
        "staff-spec-1",
        "staff-spec-2",
        "staff-spec-3",
        "staff-spec-4",
      ],
    },
    // Corrosion Testing Laboratory (4 staff)
    {
      department_id: "dept-corrosion",
      staff_ids: [
        "staff-corr-1",
        "staff-corr-2",
        "staff-corr-3",
        "staff-corr-4",
      ],
    },
    // Soil Analysis Laboratory (4 staff)
    {
      department_id: "dept-soil",
      staff_ids: [
        "staff-soil-1",
        "staff-soil-2",
        "staff-soil-3",
        "staff-soil-4",
      ],
    },
    // Mud Testing Laboratory (4 staff)
    {
      department_id: "dept-mud",
      staff_ids: ["staff-mud-1", "staff-mud-2", "staff-mud-3", "staff-mud-4"],
    },
    // Refining Technology (4 staff)
    {
      department_id: "dept-refining",
      staff_ids: ["staff-ref-1", "staff-ref-2", "staff-ref-3", "staff-ref-4"],
    },
    // Distillation & Separation (4 staff)
    {
      department_id: "dept-distillation",
      staff_ids: [
        "staff-dist-1",
        "staff-dist-2",
        "staff-dist-3",
        "staff-dist-4",
      ],
    },
    // Petroleum Applications Research (4 staff)
    {
      department_id: "dept-applications",
      staff_ids: ["staff-app-1", "staff-app-2", "staff-app-3", "staff-app-4"],
    },
    // Lubricants Development (4 staff)
    {
      department_id: "dept-lubricants",
      staff_ids: ["staff-lub-1", "staff-lub-2", "staff-lub-3", "staff-lub-4"],
    },
    // Petrochemicals Research (4 staff)
    {
      department_id: "dept-petrochemicals",
      staff_ids: ["staff-pet-1", "staff-pet-2", "staff-pet-3", "staff-pet-4"],
    },
    // Polymers & Plastics (4 staff)
    {
      department_id: "dept-polymers",
      staff_ids: ["staff-pol-1", "staff-pol-2", "staff-pol-3", "staff-pol-4"],
    },
    // Process Design & Development (4 staff)
    {
      department_id: "dept-process-design",
      staff_ids: [
        "staff-proc-1",
        "staff-proc-2",
        "staff-proc-3",
        "staff-proc-4",
      ],
    },
    // Process Simulation (4 staff)
    {
      department_id: "dept-simulation",
      staff_ids: ["staff-sim-1", "staff-sim-2", "staff-sim-3", "staff-sim-4"],
    },
    // Environmental Assessment (4 staff)
    {
      department_id: "dept-environmental",
      staff_ids: ["staff-env-1", "staff-env-2", "staff-env-3", "staff-env-4"],
    },
  ];

  // Assign staff to departments
  for (const assignment of departmentStaffAssignments) {
    for (const staffId of assignment.staff_ids) {
      await prisma.departmentStaff.upsert({
        where: {
          department_id_staff_id: {
            department_id: assignment.department_id,
            staff_id: staffId,
          },
        },
        update: {},
        create: {
          department_id: assignment.department_id,
          staff_id: staffId,
        },
      });
    }
  }

  console.log(
    `✅ Staff assigned to all ${departmentStaffAssignments.length} departments`
  );

  const serviceCentersData = [
    // Centers
    {
      id: "center-asphalt-polymers",
      slug: "asphalt-polymers",
      name: "Asphalt & polymers",
      type: "center",
      headline: "Advanced asphalt and polymer research and development center",
      description:
        "The Asphalt & Polymers Center specializes in the development, testing, and optimization of asphalt materials and polymer-based solutions for the petroleum and construction industries. We provide comprehensive research services, quality testing, and innovative product development.",
      image:
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&h=800&fit=crop",
      banner_image:
        "https://images.unsplash.com/photo-1569228037739-37f4c9e2ab89?w=1600&h=900&fit=crop",
      location: "Nasr City, Cairo",
      contact_phone: "+(202)22747847",
      contact_email: "asphalt.polymers@epri.edu.eg",
      equipments: [
        {
          name: "Dynamic Shear Rheometer (DSR)",
          details:
            "Advanced rheological testing equipment for asphalt binder characterization and performance grading.",
        },
        {
          name: "Bending Beam Rheometer (BBR)",
          details:
            "Low-temperature performance testing for asphalt binders and mixtures.",
        },
        {
          name: "Polymer Testing Laboratory",
          details:
            "Comprehensive polymer characterization including molecular weight, thermal properties, and mechanical testing.",
        },
      ],
      products: [
        {
          name: "Modified Asphalt Binders",
          description:
            "High-performance polymer-modified asphalt binders for various applications.",
        },
        {
          name: "Polymer Additives",
          description:
            "Specialized polymer additives for enhanced material properties.",
        },
      ],
      lab_methodology:
        "Our laboratory follows ASTM and AASHTO standards for asphalt and polymer testing. We employ advanced analytical techniques including rheology, thermal analysis, and mechanical testing to ensure quality and performance.",
      work_volume: {
        totalIncomeRate: 12.5,
        currency: "million EGP",
        dataPoints: [
          { label: "2021", value: 8.2 },
          { label: "2022", value: 10.1 },
          { label: "2023", value: 11.5 },
          { label: "2024", value: 12.5 },
        ],
      },
      company_activity: {
        totalProjects: 58,
        activityMix: [
          { label: "Research & Development", value: 40 },
          { label: "Quality Testing", value: 30 },
          { label: "Product Development", value: 20 },
          { label: "Consulting Services", value: 10 },
        ],
      },
      future_prospective:
        "Expanding into sustainable asphalt technologies, developing bio-based polymers, and establishing partnerships with construction and infrastructure companies.",
      services: [
        {
          name: "Asphalt Testing & Analysis",
          summary:
            "Comprehensive testing services for asphalt binders, mixtures, and performance evaluation.",
        },
        {
          name: "Polymer Research & Development",
          summary:
            "Advanced R&D services for polymer-based materials and applications.",
        },
        {
          name: "Material Characterization",
          summary: "Detailed material analysis and characterization services.",
        },
      ],
      metrics: {
        accreditation: "ISO/IEC 17025",
        activeProjects: 58,
        researchPublications: 24,
      },
      is_featured: true,
      is_published: true,
      order_index: 1,
    },
    {
      id: "center-chemical-services",
      slug: "chemical-services-development",
      name: "Chemical Services and Development",
      type: "center",
      headline: "Comprehensive chemical services and product development",
      description:
        "Providing advanced chemical analysis, development, and consulting services for the petroleum industry.",
      image:
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&h=800&fit=crop",
      banner_image:
        "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=1600&h=900&fit=crop",
      location: "Nasr City, Cairo",
      contact_phone: "+(202)22747848",
      contact_email: "chemical.services@epri.edu.eg",
      equipments: [],
      products: [],
      lab_methodology: "",
      work_volume: {
        totalIncomeRate: 6.8,
        currency: "million EGP",
        dataPoints: [
          { label: "2021", value: 4.5 },
          { label: "2022", value: 5.6 },
          { label: "2023", value: 6.2 },
          { label: "2024", value: 6.8 },
        ],
      },
      company_activity: {
        totalProjects: 35,
        activityMix: [
          { label: "Chemical Analysis", value: 50 },
          { label: "Product Development", value: 30 },
          { label: "Consulting", value: 20 },
        ],
      },
      future_prospective: "",
      services: [],
      is_featured: false,
      is_published: true,
      order_index: 2,
    },
    {
      id: "center-core-analysis",
      slug: "core-analysis",
      name: "Core Analysis",
      type: "center",
      headline:
        "Specialized core analysis and reservoir characterization services",
      description:
        "Advanced core analysis laboratory providing comprehensive reservoir rock characterization and fluid analysis.",
      image:
        "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=1200&h=800&fit=crop",
      banner_image:
        "https://images.unsplash.com/photo-1505731132164-cca90383e1af?w=1600&h=900&fit=crop",
      location: "Nasr City, Cairo",
      contact_phone: "+(202)22747849",
      contact_email: "core.analysis@epri.edu.eg",
      equipments: [],
      products: [],
      lab_methodology: "",
      work_volume: {
        totalIncomeRate: 9.2,
        currency: "million EGP",
        dataPoints: [
          { label: "2021", value: 6.1 },
          { label: "2022", value: 7.5 },
          { label: "2023", value: 8.4 },
          { label: "2024", value: 9.2 },
        ],
      },
      company_activity: {
        totalProjects: 45,
        activityMix: [
          { label: "Core Analysis", value: 60 },
          { label: "Reservoir Studies", value: 25 },
          { label: "Consulting", value: 15 },
        ],
      },
      future_prospective: "",
      services: [],
      is_featured: false,
      is_published: true,
      order_index: 3,
    },
    {
      id: "center-pvt-services",
      slug: "pvt-services",
      name: "PVT Services",
      type: "center",
      headline:
        "Pressure-Volume-Temperature analysis and fluid characterization",
      description:
        "Comprehensive PVT analysis services for reservoir fluid characterization and production optimization.",
      image:
        "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=800&fit=crop",
      banner_image:
        "https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=1600&h=900&fit=crop",
      location: "Nasr City, Cairo",
      contact_phone: "+(202)22747850",
      contact_email: "pvt.services@epri.edu.eg",
      equipments: [],
      products: [],
      lab_methodology: "",
      work_volume: {
        totalIncomeRate: 7.5,
        currency: "million EGP",
        dataPoints: [
          { label: "2021", value: 5.2 },
          { label: "2022", value: 6.3 },
          { label: "2023", value: 7.0 },
          { label: "2024", value: 7.5 },
        ],
      },
      company_activity: {
        totalProjects: 38,
        activityMix: [
          { label: "PVT Analysis", value: 55 },
          { label: "Fluid Characterization", value: 30 },
          { label: "Consulting", value: 15 },
        ],
      },
      future_prospective: "",
      services: [],
      is_featured: false,
      is_published: true,
      order_index: 4,
    },
    {
      id: "center-surfaces",
      slug: "surfaces",
      name: "Surfaces",
      type: "center",
      headline: "Surface chemistry and material surface analysis",
      description:
        "Advanced surface analysis and characterization services for materials and coatings.",
      image:
        "https://images.unsplash.com/photo-1514996937319-344454492b37?w=1200&h=800&fit=crop",
      banner_image:
        "https://images.unsplash.com/photo-1503389152951-9f343605f61e?w=1600&h=900&fit=crop",
      location: "Nasr City, Cairo",
      contact_phone: "+(202)22747851",
      contact_email: "surfaces@epri.edu.eg",
      equipments: [],
      products: [],
      lab_methodology: "",
      work_volume: {
        totalIncomeRate: 5.3,
        currency: "million EGP",
        dataPoints: [
          { label: "2021", value: 3.8 },
          { label: "2022", value: 4.5 },
          { label: "2023", value: 4.9 },
          { label: "2024", value: 5.3 },
        ],
      },
      company_activity: {
        totalProjects: 28,
        activityMix: [
          { label: "Surface Analysis", value: 50 },
          { label: "Coating Services", value: 30 },
          { label: "Research", value: 20 },
        ],
      },
      future_prospective: "",
      services: [],
      is_featured: false,
      is_published: true,
      order_index: 5,
    },
    {
      id: "center-protection",
      slug: "protection",
      name: "Protection",
      type: "center",
      headline: "Corrosion protection and material protection services",
      description:
        "Specialized services for corrosion prevention, material protection, and coating technologies.",
      image:
        "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=1200&h=800&fit=crop",
      banner_image:
        "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1600&h=900&fit=crop",
      location: "Nasr City, Cairo",
      contact_phone: "+(202)22747852",
      contact_email: "protection@epri.edu.eg",
      equipments: [],
      products: [],
      lab_methodology: "",
      work_volume: {
        totalIncomeRate: 6.1,
        currency: "million EGP",
        dataPoints: [
          { label: "2021", value: 4.2 },
          { label: "2022", value: 5.1 },
          { label: "2023", value: 5.7 },
          { label: "2024", value: 6.1 },
        ],
      },
      company_activity: {
        totalProjects: 32,
        activityMix: [
          { label: "Corrosion Protection", value: 45 },
          { label: "Coating Services", value: 35 },
          { label: "Consulting", value: 20 },
        ],
      },
      future_prospective: "",
      services: [],
      is_featured: false,
      is_published: true,
      order_index: 6,
    },
    {
      id: "center-tanks-services",
      slug: "tanks-services",
      name: "Tanks Services",
      type: "center",
      headline: "Tank inspection, maintenance, and testing services",
      description:
        "Comprehensive services for storage tank inspection, maintenance, and integrity assessment.",
      image:
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&h=800&fit=crop",
      banner_image:
        "https://images.unsplash.com/photo-1569228037739-37f4c9e2ab89?w=1600&h=900&fit=crop",
      location: "Nasr City, Cairo",
      contact_phone: "+(202)22747853",
      contact_email: "tanks.services@epri.edu.eg",
      equipments: [],
      products: [],
      lab_methodology: "",
      work_volume: {
        totalIncomeRate: 8.7,
        currency: "million EGP",
        dataPoints: [
          { label: "2021", value: 6.0 },
          { label: "2022", value: 7.3 },
          { label: "2023", value: 8.1 },
          { label: "2024", value: 8.7 },
        ],
      },
      company_activity: {
        totalProjects: 42,
        activityMix: [
          { label: "Tank Inspection", value: 40 },
          { label: "Maintenance Services", value: 35 },
          { label: "Testing", value: 25 },
        ],
      },
      future_prospective: "",
      services: [],
      is_featured: false,
      is_published: true,
      order_index: 7,
    },
    {
      id: "center-technical-support",
      slug: "technical-support-technology",
      name: "Technical Support & technology",
      type: "center",
      headline: "Technical support and technology transfer services",
      description:
        "Providing technical support, technology transfer, and innovation services to the petroleum industry.",
      image:
        "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=800&fit=crop",
      banner_image:
        "https://images.unsplash.com/photo-1505731132164-cca90383e1af?w=1600&h=900&fit=crop",
      location: "Nasr City, Cairo",
      contact_phone: "+(202)22747854",
      contact_email: "tech.support@epri.edu.eg",
      equipments: [],
      products: [],
      lab_methodology: "",
      work_volume: {
        totalIncomeRate: 4.9,
        currency: "million EGP",
        dataPoints: [
          { label: "2021", value: 3.5 },
          { label: "2022", value: 4.1 },
          { label: "2023", value: 4.6 },
          { label: "2024", value: 4.9 },
        ],
      },
      company_activity: {
        totalProjects: 25,
        activityMix: [
          { label: "Technical Support", value: 50 },
          { label: "Technology Transfer", value: 30 },
          { label: "Training", value: 20 },
        ],
      },
      future_prospective: "",
      services: [],
      is_featured: false,
      is_published: true,
      order_index: 8,
    },
    // Units
    {
      id: "unit-central-analytical-labs",
      slug: "central-analytical-labs",
      name: "Central Analytical labs",
      type: "unit",
      headline: "Centralized analytical laboratory services",
      description:
        "Comprehensive analytical services providing chemical analysis, quality control, and research support.",
      image:
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&h=800&fit=crop",
      banner_image:
        "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=1600&h=900&fit=crop",
      location: "Nasr City, Cairo",
      contact_phone: "+(202)22747855",
      contact_email: "analytical.labs@epri.edu.eg",
      equipments: [],
      products: [],
      lab_methodology: "",
      work_volume: {
        totalIncomeRate: 10.2,
        currency: "million EGP",
        dataPoints: [
          { label: "2021", value: 7.5 },
          { label: "2022", value: 8.8 },
          { label: "2023", value: 9.6 },
          { label: "2024", value: 10.2 },
        ],
      },
      company_activity: {
        totalProjects: 52,
        activityMix: [
          { label: "Chemical Analysis", value: 45 },
          { label: "Quality Control", value: 30 },
          { label: "Research Support", value: 25 },
        ],
      },
      future_prospective: "",
      services: [],
      is_featured: false,
      is_published: true,
      order_index: 1,
    },
    {
      id: "unit-cathodic-protection",
      slug: "cathodic-protection",
      name: "Cathodic Protection",
      type: "unit",
      headline: "Cathodic protection systems and services",
      description:
        "Specialized unit providing cathodic protection design, installation, and monitoring services.",
      image:
        "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=1200&h=800&fit=crop",
      banner_image:
        "https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=1600&h=900&fit=crop",
      location: "Nasr City, Cairo",
      contact_phone: "+(202)22747856",
      contact_email: "cathodic.protection@epri.edu.eg",
      equipments: [],
      products: [],
      lab_methodology: "",
      work_volume: {
        totalIncomeRate: 5.6,
        currency: "million EGP",
        dataPoints: [
          { label: "2021", value: 3.9 },
          { label: "2022", value: 4.7 },
          { label: "2023", value: 5.2 },
          { label: "2024", value: 5.6 },
        ],
      },
      company_activity: {
        totalProjects: 30,
        activityMix: [
          { label: "System Design", value: 40 },
          { label: "Installation", value: 35 },
          { label: "Monitoring", value: 25 },
        ],
      },
      future_prospective: "",
      services: [],
      is_featured: false,
      is_published: true,
      order_index: 2,
    },
    {
      id: "unit-earth-surveys",
      slug: "earth-surveys-unit",
      name: "Earth Surveys Unit",
      type: "unit",
      headline: "Geological and geophysical survey services",
      description:
        "Comprehensive earth survey services including geological mapping, geophysical exploration, and site characterization.",
      image:
        "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=1200&h=800&fit=crop",
      banner_image:
        "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1600&h=900&fit=crop",
      location: "Nasr City, Cairo",
      contact_phone: "+(202)22747857",
      contact_email: "earth.surveys@epri.edu.eg",
      equipments: [],
      products: [],
      lab_methodology: "",
      work_volume: {
        totalIncomeRate: 7.8,
        currency: "million EGP",
        dataPoints: [
          { label: "2021", value: 5.4 },
          { label: "2022", value: 6.5 },
          { label: "2023", value: 7.2 },
          { label: "2024", value: 7.8 },
        ],
      },
      company_activity: {
        totalProjects: 40,
        activityMix: [
          { label: "Geological Surveys", value: 45 },
          { label: "Geophysical Exploration", value: 35 },
          { label: "Site Characterization", value: 20 },
        ],
      },
      future_prospective: "",
      services: [],
      is_featured: false,
      is_published: true,
      order_index: 3,
    },
    {
      id: "unit-eor-non-traditional",
      slug: "enhanced-oil-recovery-non-traditional",
      name: "Enhanced Oil Recovery by non-traditional ways",
      type: "unit",
      headline: "Innovative enhanced oil recovery technologies",
      description:
        "Research and development unit focusing on non-traditional EOR methods and innovative recovery techniques.",
      image:
        "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=800&fit=crop",
      banner_image:
        "https://images.unsplash.com/photo-1505731132164-cca90383e1af?w=1600&h=900&fit=crop",
      location: "Nasr City, Cairo",
      contact_phone: "+(202)22747858",
      contact_email: "eor.nontraditional@epri.edu.eg",
      equipments: [],
      products: [],
      lab_methodology: "",
      work_volume: {
        totalIncomeRate: 6.4,
        currency: "million EGP",
        dataPoints: [
          { label: "2021", value: 4.3 },
          { label: "2022", value: 5.2 },
          { label: "2023", value: 5.9 },
          { label: "2024", value: 6.4 },
        ],
      },
      company_activity: {
        totalProjects: 33,
        activityMix: [
          { label: "Research & Development", value: 50 },
          { label: "Pilot Testing", value: 30 },
          { label: "Field Implementation", value: 20 },
        ],
      },
      future_prospective: "",
      services: [],
      is_featured: false,
      is_published: true,
      order_index: 4,
    },
    {
      id: "unit-fuel-research",
      slug: "fuel-research-fru",
      name: "Fuel Research (FRU)",
      type: "unit",
      headline: "Fuel research and development unit",
      description:
        "Specialized research unit dedicated to fuel analysis, development, and optimization.",
      image:
        "https://images.unsplash.com/photo-1514996937319-344454492b37?w=1200&h=800&fit=crop",
      banner_image:
        "https://images.unsplash.com/photo-1503389152951-9f343605f61e?w=1600&h=900&fit=crop",
      location: "Nasr City, Cairo",
      contact_phone: "+(202)22747859",
      contact_email: "fuel.research@epri.edu.eg",
      equipments: [],
      products: [],
      lab_methodology: "",
      work_volume: {
        totalIncomeRate: 8.1,
        currency: "million EGP",
        dataPoints: [
          { label: "2021", value: 5.8 },
          { label: "2022", value: 6.9 },
          { label: "2023", value: 7.6 },
          { label: "2024", value: 8.1 },
        ],
      },
      company_activity: {
        totalProjects: 46,
        activityMix: [
          { label: "Fuel Analysis", value: 40 },
          { label: "Research & Development", value: 35 },
          { label: "Quality Testing", value: 25 },
        ],
      },
      future_prospective: "",
      services: [],
      is_featured: false,
      is_published: true,
      order_index: 5,
    },
    {
      id: "unit-coal-quality-control",
      slug: "quality-control-coal-analysis",
      name: "QUALITY CONTROL UNIT FOR COAL ANALYSIS",
      type: "unit",
      headline: "Coal quality control and analysis services",
      description:
        "Specialized unit providing comprehensive coal analysis and quality control services.",
      image:
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&h=800&fit=crop",
      banner_image:
        "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=1600&h=900&fit=crop",
      location: "Nasr City, Cairo",
      contact_phone: "+(202)22747860",
      contact_email: "coal.quality@epri.edu.eg",
      equipments: [],
      products: [],
      lab_methodology: "",
      work_volume: {
        totalIncomeRate: 4.2,
        currency: "million EGP",
        dataPoints: [
          { label: "2021", value: 3.0 },
          { label: "2022", value: 3.6 },
          { label: "2023", value: 3.9 },
          { label: "2024", value: 4.2 },
        ],
      },
      company_activity: {
        totalProjects: 22,
        activityMix: [
          { label: "Coal Analysis", value: 55 },
          { label: "Quality Control", value: 30 },
          { label: "Testing Services", value: 15 },
        ],
      },
      future_prospective: "",
      services: [],
      is_featured: false,
      is_published: true,
      order_index: 6,
    },
  ];

  // Gallery images for service centers and units
  const serviceCenterGalleries: Record<string, string[]> = {
    "center-asphalt-polymers": [
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1569228037739-37f4c9e2ab89?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1505731132164-cca90383e1af?w=800&h=600&fit=crop",
    ],
    "center-chemical-services": [
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&h=600&fit=crop",
    ],
    "center-core-analysis": [
      "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1505731132164-cca90383e1af?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=800&h=600&fit=crop",
    ],
    "center-pvt-services": [
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1514996937319-344454492b37?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1503389152951-9f343605f61e?w=800&h=600&fit=crop",
    ],
    "center-surfaces": [
      "https://images.unsplash.com/photo-1514996937319-344454492b37?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1503389152951-9f343605f61e?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
    ],
    "center-protection": [
      "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1514996937319-344454492b37?w=800&h=600&fit=crop",
    ],
    "center-tanks-services": [
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1569228037739-37f4c9e2ab89?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1505731132164-cca90383e1af?w=800&h=600&fit=crop",
    ],
    "center-technical-support": [
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1505731132164-cca90383e1af?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=800&h=600&fit=crop",
    ],
    "unit-central-analytical-labs": [
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&h=600&fit=crop",
    ],
    "unit-cathodic-protection": [
      "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1514996937319-344454492b37?w=800&h=600&fit=crop",
    ],
    "unit-earth-surveys": [
      "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1505731132164-cca90383e1af?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
    ],
    "unit-eor-non-traditional": [
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1505731132164-cca90383e1af?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1514996937319-344454492b37?w=800&h=600&fit=crop",
    ],
    "unit-fuel-research": [
      "https://images.unsplash.com/photo-1514996937319-344454492b37?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1503389152951-9f343605f61e?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
    ],
    "unit-coal-quality-control": [
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&h=600&fit=crop",
    ],
  };

  for (const center of serviceCentersData) {
    const {
      id,
      slug,
      equipments: centerEquipments = [],
      ...centerData
    } = center;

    // Add gallery if available
    const galleryData = serviceCenterGalleries[id]
      ? { gallery: serviceCenterGalleries[id] }
      : {};

    const upsertedCenter = await (prisma as any).serviceCenter.upsert({
      where: { slug },
      update: {
        ...centerData,
        ...galleryData,
        slug,
      },
      create: {
        id,
        slug,
        ...centerData,
        ...galleryData,
      },
    });

    await (prisma as any).serviceEquipment.deleteMany({
      where: { serviceCenterId: upsertedCenter.id },
    });

    if (centerEquipments.length > 0) {
      for (const equipmentEntry of centerEquipments) {
        const equipment =
          typeof equipmentEntry === "object" && equipmentEntry !== null
            ? equipmentEntry
            : { name: String(equipmentEntry ?? "Equipment"), details: null };

        await (prisma as any).serviceEquipment.create({
          data: {
            serviceCenterId: upsertedCenter.id,
            serviceId: null,
            name: equipment.name,
            description:
              (equipment as any).details ??
              (equipment as any).description ??
              null,
            image: (equipment as any).image ?? null,
            specifications: (equipment as any).specifications ?? null,
          },
        });
      }
    }
  }

  console.log(
    `✅ Seeded ${serviceCentersData.length} service centers with analytics and tab content`
  );

  // Assign staff to service centers and units
  console.log("👥 Assigning staff to service centers and units...");
  const serviceCenterStaffAssignments = [
    {
      service_center_id: "center-asphalt-polymers",
      staff_ids: ["staff-1", "staff-2", "staff-pol-1", "staff-pol-2"],
    },
    {
      service_center_id: "center-chemical-services",
      staff_ids: ["staff-3", "staff-chem-1", "staff-chem-2"],
    },
    {
      service_center_id: "center-core-analysis",
      staff_ids: ["staff-4", "staff-core-1", "staff-core-2", "staff-core-3"],
    },
    {
      service_center_id: "center-pvt-services",
      staff_ids: ["staff-5", "staff-res-1", "staff-res-2"],
    },
    {
      service_center_id: "center-surfaces",
      staff_ids: ["staff-6", "staff-surf-1", "staff-surf-2"],
    },
    {
      service_center_id: "center-protection",
      staff_ids: ["staff-cor-1", "staff-cor-2", "staff-cor-3"],
    },
    {
      service_center_id: "center-tanks-services",
      staff_ids: ["staff-drill-1", "staff-drill-2", "staff-drill-3"],
    },
    {
      service_center_id: "center-technical-support",
      staff_ids: ["staff-proc-1", "staff-proc-2", "staff-sim-1"],
    },
    {
      service_center_id: "unit-central-analytical-labs",
      staff_ids: [
        "staff-chem-1",
        "staff-chem-2",
        "staff-chem-3",
        "staff-chem-4",
      ],
    },
    {
      service_center_id: "unit-cathodic-protection",
      staff_ids: ["staff-cor-1", "staff-cor-2"],
    },
    {
      service_center_id: "unit-earth-surveys",
      staff_ids: ["staff-geo-1", "staff-geo-2", "staff-geo-3"],
    },
    {
      service_center_id: "unit-eor-non-traditional",
      staff_ids: ["staff-res-1", "staff-res-2", "staff-res-3"],
    },
    {
      service_center_id: "unit-fuel-research",
      staff_ids: ["staff-ref-1", "staff-ref-2", "staff-ref-3"],
    },
    {
      service_center_id: "unit-coal-quality-control",
      staff_ids: ["staff-chem-1", "staff-chem-2"],
    },
  ];

  for (const assignment of serviceCenterStaffAssignments) {
    for (const staffId of assignment.staff_ids) {
      try {
        await (prisma as any).serviceCenterStaff.upsert({
          where: {
            service_center_id_staff_id: {
              service_center_id: assignment.service_center_id,
              staff_id: staffId,
            },
          },
          update: {},
          create: {
            service_center_id: assignment.service_center_id,
            staff_id: staffId,
          },
        });
      } catch (error: any) {
        // Skip if staff member doesn't exist
        if (error.code !== "P2003") {
          console.warn(
            `Failed to assign staff ${staffId} to service center ${assignment.service_center_id}:`,
            error.message
          );
        }
      }
    }
  }

  console.log(
    `✅ Staff assigned to ${serviceCenterStaffAssignments.length} service centers and units`
  );

  // Create Products
  console.log("🛍️  Seeding products...");
  const productsData = [
    {
      id: "prod-1",
      name: {
        en: "Polymer-Modified Asphalt Binder PG 76-22",
        ar: "رابط أسفلت معدل بالبوليمر PG 76-22",
      },
      slug: "polymer-modified-asphalt-pg-76-22",
      description: {
        en: "High-performance polymer-modified asphalt binder designed for superior rutting resistance and low-temperature cracking resistance. Ideal for high-traffic roadways and extreme climate conditions.",
        ar: "رابط أسفلت معدل بالبوليمر عالي الأداء مصمم لمقاومة التآكل والتصدع في درجات الحرارة المنخفضة. مثالي للطرق عالية الحركة والظروف المناخية القاسية.",
      },
      short_description: {
        en: "Premium polymer-modified asphalt for high-performance road applications",
        ar: "أسفلت معدل بالبوليمر عالي الجودة لتطبيقات الطرق عالية الأداء",
      },
      image:
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1569228037739-37f4c9e2ab89?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop",
      ]),
      price: 8500.0,
      original_price: 9500.0,
      category: "Asphalt Products",
      tags: JSON.stringify([
        "asphalt",
        "polymer",
        "road construction",
        "high-performance",
      ]),
      specifications: JSON.stringify({
        performance_grade: "PG 76-22",
        viscosity: "3000-5000 cP at 135°C",
        penetration: "40-60 dmm",
        softening_point: "55-65°C",
        elastic_recovery: "≥ 60%",
        flash_point: "≥ 230°C",
      }),
      features: JSON.stringify([
        "Superior rutting resistance",
        "Excellent low-temperature performance",
        "Enhanced durability",
        "Reduced maintenance costs",
        "Meets ASTM D6373 standards",
      ]),
      stock_quantity: 500,
      sku: "ASPH-PG76-22-001",
      rating_average: 4.8,
      rating_count: 24,
      review_count: 18,
      is_featured: true,
      is_published: true,
      is_available: true,
      order_index: 1,
      service_center_id: "center-asphalt-polymers",
    },
    {
      id: "prod-2",
      name: {
        en: "SBS Polymer Additive for Asphalt",
        ar: "مضاف البوليمر SBS للأسفلت",
      },
      slug: "sbs-polymer-additive-asphalt",
      description: {
        en: "Styrene-Butadiene-Styrene (SBS) polymer additive for enhancing asphalt binder properties. Improves elasticity, fatigue resistance, and overall performance of asphalt mixtures.",
        ar: "مضاف بوليمر الستايرين-بوتاديين-ستايرين (SBS) لتحسين خصائص رابط الأسفلت. يحسن المرونة ومقاومة التعب والأداء العام لخليط الأسفلت.",
      },
      short_description: {
        en: "Premium SBS polymer additive for asphalt modification",
        ar: "مضاف بوليمر SBS عالي الجودة لتعديل الأسفلت",
      },
      image:
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=600&fit=crop",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=800&h=600&fit=crop",
      ]),
      price: 12000.0,
      original_price: null,
      category: "Polymer Additives",
      tags: JSON.stringify([
        "polymer",
        "additive",
        "SBS",
        "asphalt modification",
      ]),
      specifications: JSON.stringify({
        polymer_type: "SBS (Styrene-Butadiene-Styrene)",
        styrene_content: "30-35%",
        particle_size: "2-4 mm",
        density: "0.92-0.94 g/cm³",
        melting_point: "180-200°C",
        storage_temperature: "Below 30°C",
      }),
      features: JSON.stringify([
        "High elasticity improvement",
        "Enhanced fatigue resistance",
        "Improved temperature susceptibility",
        "Easy to blend",
        "Long shelf life",
      ]),
      stock_quantity: 300,
      sku: "POL-SBS-001",
      rating_average: 4.6,
      rating_count: 15,
      review_count: 12,
      is_featured: true,
      is_published: true,
      is_available: true,
      order_index: 2,
      service_center_id: "center-asphalt-polymers",
    },
    {
      id: "prod-3",
      name: { en: "Crude Oil Analysis Kit", ar: "مجموعة تحليل النفط الخام" },
      slug: "crude-oil-analysis-kit",
      description: {
        en: "Comprehensive analysis kit for crude oil characterization including API gravity, sulfur content, viscosity, and basic sediment and water (BS&W) determination. Includes all necessary reagents and standards.",
        ar: "مجموعة تحليل شاملة لتوصيف النفط الخام تشمل الكثافة النوعية API ومحتوى الكبريت واللزوجة وتحديد الرواسب والماء الأساسي. تتضمن جميع الكواشف والمعايير اللازمة.",
      },
      short_description: {
        en: "Complete crude oil analysis kit with reagents and standards",
        ar: "مجموعة تحليل كاملة للنفط الخام مع الكواشف والمعايير",
      },
      image:
        "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=600&fit=crop",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&h=600&fit=crop",
      ]),
      price: 3500.0,
      original_price: null,
      category: "Laboratory Equipment",
      tags: JSON.stringify([
        "crude oil",
        "analysis",
        "laboratory",
        "testing kit",
      ]),
      specifications: JSON.stringify({
        components:
          "API gravity hydrometer, sulfur analyzer, viscometer, BS&W centrifuge",
        test_capacity: "Up to 50 samples",
        accuracy: "±0.1% for API gravity",
        standards_included: "ASTM D1298, D4294, D445, D4007",
        shelf_life: "24 months",
      }),
      features: JSON.stringify([
        "Complete analysis package",
        "ASTM compliant methods",
        "High accuracy measurements",
        "Easy to use",
        "Includes calibration standards",
      ]),
      stock_quantity: 50,
      sku: "LAB-CRUDE-KIT-001",
      rating_average: 4.7,
      rating_count: 20,
      review_count: 16,
      is_featured: false,
      is_published: true,
      is_available: true,
      order_index: 3,
      service_center_id: "center-chemical-services",
    },
    {
      id: "prod-4",
      name: {
        en: "Reservoir Core Sample Analysis Service",
        ar: "خدمة تحليل عينات قلب المكمن",
      },
      slug: "reservoir-core-analysis-service",
      description: {
        en: "Professional core analysis service including porosity, permeability, saturation, and petrophysical property determination. Comprehensive reporting with digital imaging and data interpretation.",
        ar: "خدمة تحليل قلب احترافية تشمل المسامية والنفاذية والتشبع وتحديد الخصائص البتروفيزيائية. تقارير شاملة مع التصوير الرقمي وتفسير البيانات.",
      },
      short_description: {
        en: "Professional core analysis with comprehensive reporting",
        ar: "تحليل قلب احترافي مع تقارير شاملة",
      },
      image:
        "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&h=600&fit=crop",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1505731132164-cca90383e1af?w=800&h=600&fit=crop",
      ]),
      price: 15000.0,
      original_price: null,
      category: "Analysis Services",
      tags: JSON.stringify([
        "core analysis",
        "reservoir",
        "petrophysics",
        "laboratory service",
      ]),
      specifications: JSON.stringify({
        analysis_types:
          "Porosity, Permeability, Saturation, Grain Density, Capillary Pressure",
        sample_size: "1 inch to 4 inches diameter",
        turnaround_time: "5-7 business days",
        standards: "API RP 40, ASTM D4404",
        report_format: "Digital PDF with raw data",
      }),
      features: JSON.stringify([
        "Comprehensive petrophysical analysis",
        "Digital imaging included",
        "Fast turnaround time",
        "Expert interpretation",
        "ISO 17025 accredited",
      ]),
      stock_quantity: null,
      sku: "SRV-CORE-ANALYSIS-001",
      rating_average: 4.9,
      rating_count: 32,
      review_count: 28,
      is_featured: true,
      is_published: true,
      is_available: true,
      order_index: 4,
      service_center_id: "center-core-analysis",
    },
    {
      id: "prod-5",
      name: {
        en: "PVT Fluid Characterization Service",
        ar: "خدمة توصيف السوائل PVT",
      },
      slug: "pvt-fluid-characterization",
      description: {
        en: "Complete Pressure-Volume-Temperature (PVT) analysis service for reservoir fluids. Includes compositional analysis, phase behavior studies, and EOS modeling for production optimization.",
        ar: "خدمة تحليل الضغط-الحجم-درجة الحرارة (PVT) الكاملة لسوائل المكمن. تشمل التحليل التركيبي ودراسات سلوك الطور ونمذجة معادلة الحالة لتحسين الإنتاج.",
      },
      short_description: {
        en: "Complete PVT analysis for reservoir fluid characterization",
        ar: "تحليل PVT كامل لتوصيف سوائل المكمن",
      },
      image:
        "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=800&h=600&fit=crop",
      ]),
      price: 25000.0,
      original_price: null,
      category: "Analysis Services",
      tags: JSON.stringify([
        "PVT",
        "reservoir",
        "fluid characterization",
        "EOS modeling",
      ]),
      specifications: JSON.stringify({
        analysis_components:
          "Compositional analysis, Bubble point, Dew point, Viscosity, Density, EOS modeling",
        sample_volume: "Minimum 500 ml",
        pressure_range: "Up to 10,000 psi",
        temperature_range: "50-300°F",
        turnaround_time: "10-14 business days",
      }),
      features: JSON.stringify([
        "Comprehensive PVT analysis",
        "EOS modeling included",
        "Production optimization insights",
        "Expert interpretation",
        "Industry-standard methods",
      ]),
      stock_quantity: null,
      sku: "SRV-PVT-001",
      rating_average: 4.8,
      rating_count: 18,
      review_count: 15,
      is_featured: true,
      is_published: true,
      is_available: true,
      order_index: 5,
      service_center_id: "center-pvt-services",
    },
    {
      id: "prod-6",
      name: {
        en: "Petroleum Product Quality Testing Service",
        ar: "خدمة اختبار جودة المنتجات البترولية",
      },
      slug: "petroleum-product-quality-testing",
      description: {
        en: "Comprehensive quality testing service for petroleum products including gasoline, diesel, jet fuel, and lubricants. Tests include octane/cetane numbers, distillation, flash point, and contamination analysis.",
        ar: "خدمة اختبار جودة شاملة للمنتجات البترولية تشمل البنزين والديزل ووقود الطائرات والزيوت. الاختبارات تشمل أرقام الأوكتان/السيتان والتقطير ونقطة الوميض وتحليل التلوث.",
      },
      short_description: {
        en: "Complete quality testing for all petroleum products",
        ar: "اختبار جودة كامل لجميع المنتجات البترولية",
      },
      image:
        "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1574263867128-cddc47ba885e?w=800&h=600&fit=crop",
      ]),
      price: 8000.0,
      original_price: null,
      category: "Testing Services",
      tags: JSON.stringify([
        "quality testing",
        "petroleum products",
        "fuel analysis",
        "laboratory",
      ]),
      specifications: JSON.stringify({
        test_parameters:
          "Octane/Cetane, Distillation, Flash Point, Viscosity, Density, Sulfur Content, Water Content",
        sample_size: "Minimum 1 liter",
        standards: "ASTM, EN, IP methods",
        turnaround_time: "3-5 business days",
        certification: "ISO 17025 accredited",
      }),
      features: JSON.stringify([
        "Comprehensive test suite",
        "Multiple product types",
        "Fast turnaround",
        "International standards",
        "Certified results",
      ]),
      stock_quantity: null,
      sku: "SRV-QUALITY-TEST-001",
      rating_average: 4.7,
      rating_count: 25,
      review_count: 20,
      is_featured: false,
      is_published: true,
      is_available: true,
      order_index: 6,
      service_center_id: "center-chemical-services",
    },
    {
      id: "prod-7",
      name: {
        en: "Surface Chemistry Analysis Equipment",
        ar: "معدات تحليل كيمياء السطوح",
      },
      slug: "surface-chemistry-analysis-equipment",
      description: {
        en: "Advanced equipment package for surface chemistry analysis including contact angle measurement, surface tension analysis, and wettability studies. Essential for enhanced oil recovery research.",
        ar: "حزمة معدات متقدمة لتحليل كيمياء السطوح تشمل قياس زاوية التلامس وتحليل التوتر السطحي ودراسات البلل. ضرورية لأبحاث الاستخلاص المعزز للنفط.",
      },
      short_description: {
        en: "Advanced surface chemistry analysis equipment package",
        ar: "حزمة معدات متقدمة لتحليل كيمياء السطوح",
      },
      image:
        "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=800&h=600&fit=crop",
      ]),
      price: 45000.0,
      original_price: 50000.0,
      category: "Laboratory Equipment",
      tags: JSON.stringify([
        "surface chemistry",
        "equipment",
        "EOR",
        "wettability",
        "laboratory",
      ]),
      specifications: JSON.stringify({
        components:
          "Contact angle goniometer, Surface tension tensiometer, High-pressure cell, Temperature controller",
        measurement_range: "Contact angle: 0-180°, Surface tension: 0-100 mN/m",
        pressure_range: "Up to 5000 psi",
        temperature_range: "20-150°C",
        accuracy: "±0.1° for contact angle",
      }),
      features: JSON.stringify([
        "Complete analysis system",
        "High-pressure capability",
        "Temperature control",
        "Automated measurements",
        "Research-grade accuracy",
      ]),
      stock_quantity: 5,
      sku: "EQ-SURFACE-CHEM-001",
      rating_average: 4.9,
      rating_count: 8,
      review_count: 6,
      is_featured: true,
      is_published: true,
      is_available: true,
      order_index: 7,
      service_center_id: "center-surfaces",
    },
    {
      id: "prod-8",
      name: {
        en: "Drilling Fluid Additive Package",
        ar: "حزمة مضافات سائل الحفر",
      },
      slug: "drilling-fluid-additive-package",
      description: {
        en: "Comprehensive package of drilling fluid additives including viscosifiers, fluid loss control agents, shale inhibitors, and lubricants. Optimized for various drilling conditions and formations.",
        ar: "حزمة شاملة من مضافات سائل الحفر تشمل المواد المغلظة وعوامل التحكم في فقدان السائل ومثبطات الصخر الزيتي والمواد المزلقة. محسنة لظروف وتكوينات الحفر المختلفة.",
      },
      short_description: {
        en: "Complete drilling fluid additive package",
        ar: "حزمة كاملة من مضافات سائل الحفر",
      },
      image:
        "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=600&fit=crop",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&h=600&fit=crop",
      ]),
      price: 18000.0,
      original_price: null,
      category: "Drilling Products",
      tags: JSON.stringify([
        "drilling fluid",
        "additives",
        "drilling",
        "wellbore",
      ]),
      specifications: JSON.stringify({
        components:
          "Viscosifiers, Fluid loss control, Shale inhibitors, Lubricants, pH control agents",
        package_size: "50 kg per component",
        application: "Water-based and oil-based muds",
        temperature_stability: "Up to 200°C",
        shelf_life: "24 months",
      }),
      features: JSON.stringify([
        "Complete additive package",
        "Multiple applications",
        "High temperature stability",
        "Cost-effective",
        "Easy to use",
      ]),
      stock_quantity: 20,
      sku: "DRILL-ADD-PKG-001",
      rating_average: 4.5,
      rating_count: 12,
      review_count: 10,
      is_featured: false,
      is_published: true,
      is_available: true,
      order_index: 8,
      service_center_id: "center-chemical-services",
    },
  ];

  for (const product of productsData) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        ...product,
      },
      create: {
        ...product,
      },
    });
  }

  console.log(`✅ Seeded ${productsData.length} products`);

  // Create comprehensive laboratories with relational data and Unsplash images
  const laboratoriesData = [
    {
      id: "lab-sedimentology",
      name: "Sedimentology & Stratigraphy Laboratory",
      description:
        "Advanced sedimentological analysis and stratigraphic research facility specializing in sediment characterization, depositional environment interpretation, and reservoir quality assessment for petroleum exploration.",
      image:
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=600&fit=crop",
      head_name: "Prof. Dr. Mostafa Gouda Mohamed",
      head_title: "Head of Sedimentology Laboratory",
      head_academic_title: "Prof. Dr.",
      head_picture:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      head_cv_url: "/cv/mostafa-gouda-cv.pdf",
      head_email: "gouda250@yahoo.com",
      head_bio:
        "Prof. Dr. Mostafa Gouda Mohamed is a distinguished sedimentologist with over 25 years of experience in petroleum geology. He has led numerous research projects on reservoir characterization and has published extensively in international journals.",
      address: "1 Ahmed El-Zomor Street, El Zohour Region, Nasr city, Cairo",
      phone: "+(202)22747847",
      alternative_phone: "+(202)22747433",
      fax: "+(202)22747444",
      email: "sedimentology@epri.edu.eg",
      website: "https://epri.edu.eg/sedimentology",
      established_year: 1985,
      facilities:
        "State-of-the-art microscopy suite, sample preparation facilities, digital imaging systems, and environmental chambers for sediment analysis.",
      equipment_list:
        "Polarizing microscopes, SEM, XRD equipment, grain size analyzers, porosity and permeability measurement systems",
      research_areas:
        "Carbonate and clastic reservoir characterization, sequence stratigraphy, depositional environments, diagenetic processes",
      services_offered:
        "Petrographic analysis, reservoir quality assessment, stratigraphic correlation, facies analysis, core description",
      staff_count: 12,
      students_count: 25,
      department_id: "dept-sedimentology",
      section_id: sections.find((s) => s.slug === "exploration")?.id,
      building: "Research Building A",
      floor: "3rd Floor",
      room_numbers: "301-305",
      is_active: true,
      is_featured: true,
      display_order: 1,
    },
    {
      id: "lab-paleontology",
      name: "Micropaleontology & Biostratigraphy Laboratory",
      description:
        "Specialized facility for micropaleontological and biostratigraphic analysis, providing age dating, paleoenvironmental interpretation, and correlation services for petroleum exploration.",
      image:
        "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&h=600&fit=crop",
      head_name: "Dr. Sarah Ahmed Mahmoud",
      head_title: "Head of Micropaleontology Laboratory",
      head_academic_title: "Dr.",
      head_picture:
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face",
      head_cv_url: "/cv/sarah-mahmoud-cv.pdf",
      head_email: "s.mahmoud@epri.edu.eg",
      head_bio:
        "Dr. Sarah Ahmed Mahmoud is a renowned micropaleontologist specializing in foraminiferal biostratigraphy and paleoenvironmental reconstruction. She has extensive experience in age dating and correlation of petroleum-bearing formations.",
      address: "1 Ahmed El-Zomor Street, El Zohour Region, Nasr city, Cairo",
      phone: "+(202)22747850",
      alternative_phone: "+(202)22747851",
      fax: "+(202)22747852",
      email: "paleontology@epri.edu.eg",
      website: "https://epri.edu.eg/paleontology",
      established_year: 1988,
      facilities:
        "Advanced microscopy laboratory, fossil preparation lab, digital imaging and analysis systems, reference collection storage",
      equipment_list:
        "High-resolution microscopes, micropaleontological preparation equipment, fossil imaging systems, reference collections",
      research_areas:
        "Foraminiferal biostratigraphy, paleoecology, paleoenvironmental reconstruction, sequence biostratigraphy",
      services_offered:
        "Biostratigraphic age dating, paleoenvironmental analysis, fossil identification, biozonation studies",
      staff_count: 8,
      students_count: 15,
      department_id: "dept-paleontology",
      section_id: sections.find((s) => s.slug === "exploration")?.id,
      building: "Research Building A",
      floor: "2nd Floor",
      room_numbers: "201-204",
      is_active: true,
      is_featured: true,
      display_order: 2,
    },
    {
      id: "lab-geophysics",
      name: "Geophysics & Well Logging Laboratory",
      description:
        "Advanced geophysical research facility equipped with state-of-the-art instruments for seismic data processing, well log analysis, and geophysical modeling for petroleum exploration and reservoir characterization.",
      image:
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop",
      head_name: "Prof. Dr. Khaled Hassan Ali",
      head_title: "Head of Geophysics Laboratory",
      head_academic_title: "Prof. Dr.",
      head_picture:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      head_cv_url: "/cv/khaled-ali-cv.pdf",
      head_email: "k.ali@epri.edu.eg",
      head_bio:
        "Prof. Dr. Khaled Hassan Ali is a leading geophysicist with expertise in seismic interpretation and reservoir geophysics. He has over 20 years of experience in petroleum exploration and has consulted for major international oil companies.",
      address: "1 Ahmed El-Zomor Street, El Zohour Region, Nasr city, Cairo",
      phone: "+(202)22747860",
      alternative_phone: "+(202)22747861",
      fax: "+(202)22747862",
      email: "geophysics@epri.edu.eg",
      website: "https://epri.edu.eg/geophysics",
      established_year: 1990,
      facilities:
        "High-performance computing cluster, seismic interpretation workstations, well log analysis systems, gravity and magnetic processing labs",
      equipment_list:
        "Seismic workstations, well log interpretation software, gravity meters, magnetometers, electrical resistivity equipment",
      research_areas:
        "Seismic interpretation, reservoir geophysics, potential field methods, well log analysis, integrated geophysical studies",
      services_offered:
        "Seismic data processing and interpretation, well log analysis, gravity and magnetic surveys, reservoir characterization",
      staff_count: 15,
      students_count: 30,
      department_id: "dept-geophysics",
      section_id: sections.find((s) => s.slug === "exploration")?.id,
      building: "Research Building B",
      floor: "1st Floor",
      room_numbers: "101-108",
      is_active: true,
      is_featured: true,
      display_order: 3,
    },
    {
      id: "lab-core-analysis",
      name: "Core Analysis & Petrophysics Laboratory",
      description:
        "Comprehensive core analysis services including porosity, permeability, saturation, and petrophysical property measurements for reservoir characterization and evaluation.",
      image:
        "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&h=600&fit=crop",
      head_name: "Dr. Amira Fouad Soliman",
      head_title: "Head of Core Analysis Laboratory",
      head_academic_title: "Dr.",
      head_picture:
        "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&h=400&fit=crop&crop=face",
      head_cv_url: "/cv/amira-soliman-cv.pdf",
      head_email: "a.soliman@epri.edu.eg",
      head_bio:
        "Dr. Amira Fouad Soliman is a specialist in core analysis and petrophysics with extensive experience in reservoir property measurements. She has developed innovative techniques for unconventional reservoir analysis.",
      address: "1 Ahmed El-Zomor Street, El Zohour Region, Nasr city, Cairo",
      phone: "+(202)22747870",
      alternative_phone: "+(202)22747871",
      fax: "+(202)22747872",
      email: "coreanalysis@epri.edu.eg",
      website: "https://epri.edu.eg/coreanalysis",
      established_year: 1992,
      facilities:
        "Core preparation facilities, automated core analysis systems, special core analysis equipment, CT scanning facility",
      equipment_list:
        "Core gamma scanner, porosity-permeability analyzers, capillary pressure systems, CT scanner, NMR core analyzer",
      research_areas:
        "Core analysis, petrophysics, reservoir characterization, rock mechanics, formation evaluation",
      services_offered:
        "Routine and special core analysis, porosity and permeability measurements, capillary pressure analysis, rock mechanics testing",
      staff_count: 10,
      students_count: 20,
      department_id: "dept-core-analysis",
      section_id: sections.find((s) => s.slug === "analysis-evaluation")?.id,
      building: "Research Building C",
      floor: "1st Floor",
      room_numbers: "105-110",
      is_active: true,
      is_featured: true,
      display_order: 4,
    },
    {
      id: "lab-chemical-analysis",
      name: "Petroleum Chemistry & Analysis Laboratory",
      description:
        "State-of-the-art chemical analysis laboratory for petroleum products, crude oil characterization, and quality control testing using advanced analytical instrumentation.",
      image:
        "https://images.unsplash.com/photo-1583912086296-89e4d36f5012?w=800&h=600&fit=crop",
      head_name: "Prof. Dr. Mahmoud Ibrahim Hassan",
      head_title: "Head of Chemistry Laboratory",
      head_academic_title: "Prof. Dr.",
      head_picture:
        "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face",
      head_cv_url: "/cv/mahmoud-hassan-cv.pdf",
      head_email: "m.hassan@epri.edu.eg",
      head_bio:
        "Prof. Dr. Mahmoud Ibrahim Hassan is a distinguished petroleum chemist with over 30 years of experience in crude oil analysis and petroleum product development. He has authored numerous publications on petroleum chemistry.",
      address: "1 Ahmed El-Zomor Street, El Zohour Region, Nasr city, Cairo",
      phone: "+(202)22747880",
      alternative_phone: "+(202)22747881",
      fax: "+(202)22747882",
      email: "chemistry@epri.edu.eg",
      website: "https://epri.edu.eg/chemistry",
      established_year: 1987,
      facilities:
        "Advanced analytical chemistry laboratory, sample preparation facilities, fume hoods, and specialized storage for chemicals",
      equipment_list:
        "GC-MS, HPLC, IR spectrometer, UV-Vis spectrophotometer, atomic absorption spectrometer, distillation apparatus",
      research_areas:
        "Petroleum chemistry, crude oil characterization, fuel analysis, environmental chemistry, analytical method development",
      services_offered:
        "Crude oil assays, petroleum product analysis, contamination testing, fuel quality assessment, chemical composition analysis",
      staff_count: 14,
      students_count: 28,
      department_id: "dept-chemical-analysis",
      section_id: sections.find((s) => s.slug === "analysis-evaluation")?.id,
      building: "Research Building C",
      floor: "2nd Floor",
      room_numbers: "201-208",
      is_active: true,
      is_featured: true,
      display_order: 5,
    },
    {
      id: "lab-environmental",
      name: "Environmental Assessment & Monitoring Laboratory",
      description:
        "Comprehensive environmental monitoring and assessment facility specializing in soil, water, and air quality analysis for petroleum industry environmental compliance.",
      image:
        "https://images.unsplash.com/photo-1574263867128-cddc47ba885e?w=800&h=600&fit=crop",
      head_name: "Dr. Nadia Mohamed Farouk",
      head_title: "Head of Environmental Laboratory",
      head_academic_title: "Dr.",
      head_picture:
        "https://images.unsplash.com/photo-1594824730131-b0d5a8bd3d49?w=400&h=400&fit=crop&crop=face",
      head_cv_url: "/cv/nadia-farouk-cv.pdf",
      head_email: "n.farouk@epri.edu.eg",
      head_bio:
        "Dr. Nadia Mohamed Farouk is an environmental scientist specializing in petroleum-related environmental impact assessment and remediation. She has led numerous environmental projects for oil and gas companies.",
      address: "1 Ahmed El-Zomor Street, El Zohour Region, Nasr city, Cairo",
      phone: "+(202)22747890",
      alternative_phone: "+(202)22747891",
      fax: "+(202)22747892",
      email: "environmental@epri.edu.eg",
      website: "https://epri.edu.eg/environmental",
      established_year: 1995,
      facilities:
        "Environmental analysis laboratory, field sampling equipment, air quality monitoring systems, water testing facilities",
      equipment_list:
        "Environmental monitoring stations, water quality analyzers, soil contamination detectors, air quality sensors, GIS workstations",
      research_areas:
        "Environmental impact assessment, contamination remediation, environmental monitoring, sustainability assessment, climate change studies",
      services_offered:
        "Environmental impact assessment, soil and water contamination analysis, air quality monitoring, remediation planning",
      staff_count: 12,
      students_count: 22,
      department_id: "dept-environmental",
      section_id: sections.find((s) => s.slug === "processes-design-develop")
        ?.id,
      building: "Environmental Building",
      floor: "1st Floor",
      room_numbers: "101-106",
      is_active: true,
      is_featured: true,
      display_order: 6,
    },
    {
      id: "lab-drilling",
      name: "Drilling Fluids & Mud Testing Laboratory",
      description:
        "Specialized laboratory for drilling fluid analysis, mud testing, and wellbore stability assessment to optimize drilling operations and ensure well integrity.",
      image:
        "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
      head_name: "Eng. Omar Salah Ahmed",
      head_title: "Head of Drilling Laboratory",
      head_academic_title: "Eng.",
      head_picture:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      head_cv_url: "/cv/omar-ahmed-cv.pdf",
      head_email: "o.ahmed@epri.edu.eg",
      head_bio:
        "Eng. Omar Salah Ahmed is a drilling engineer with over 15 years of experience in drilling operations and mud engineering. He has worked on challenging drilling projects across different geological formations.",
      address: "1 Ahmed El-Zomor Street, El Zohour Region, Nasr city, Cairo",
      phone: "+(202)22747900",
      alternative_phone: "+(202)22747901",
      fax: "+(202)22747902",
      email: "drilling@epri.edu.eg",
      website: "https://epri.edu.eg/drilling",
      established_year: 1993,
      facilities:
        "Mud testing laboratory, rheometer station, filtration testing equipment, high-pressure high-temperature testing systems",
      equipment_list:
        "Rheometers, mud balances, filtration equipment, HPHT aging cells, sand content analyzers, pH meters",
      research_areas:
        "Drilling fluid optimization, wellbore stability, mud chemistry, drilling hydraulics, lost circulation materials",
      services_offered:
        "Drilling fluid testing, mud optimization, wellbore stability analysis, drilling hydraulics calculations",
      staff_count: 8,
      students_count: 16,
      department_id: "dept-drilling",
      section_id: sections.find((s) => s.slug === "exploration")?.id,
      building: "Drilling Building",
      floor: "1st Floor",
      room_numbers: "101-104",
      is_active: true,
      is_featured: false,
      display_order: 7,
    },
    {
      id: "lab-corrosion",
      name: "Corrosion & Materials Testing Laboratory",
      description:
        "Advanced materials testing facility specializing in corrosion analysis, failure investigation, and materials evaluation for petroleum industry applications.",
      image:
        "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=600&fit=crop",
      head_name: "Dr. Layla Hassan Abdel-Rahman",
      head_title: "Head of Materials Laboratory",
      head_academic_title: "Dr.",
      head_picture:
        "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&h=400&fit=crop&crop=face",
      head_cv_url: "/cv/layla-abdelrahman-cv.pdf",
      head_email: "l.abdelrahman@epri.edu.eg",
      head_bio:
        "Dr. Layla Hassan Abdel-Rahman is a materials scientist specializing in corrosion engineering and failure analysis. She has extensive experience in materials selection and corrosion prevention for harsh petroleum environments.",
      address: "1 Ahmed El-Zomor Street, El Zohour Region, Nasr city, Cairo",
      phone: "+(202)22747910",
      alternative_phone: "+(202)22747911",
      fax: "+(202)22747912",
      email: "materials@epri.edu.eg",
      website: "https://epri.edu.eg/materials",
      established_year: 1996,
      facilities:
        "Corrosion testing chambers, materials characterization equipment, mechanical testing machines, failure analysis laboratory",
      equipment_list:
        "Corrosion test cells, potentiostats, metallurgical microscopes, hardness testers, tensile testing machines, SEM-EDS",
      research_areas:
        "Corrosion engineering, materials characterization, failure analysis, protective coatings, materials selection",
      services_offered:
        "Corrosion testing, materials evaluation, failure analysis, coating assessment, materials selection consulting",
      staff_count: 9,
      students_count: 18,
      department_id: "dept-corrosion",
      section_id: sections.find((s) => s.slug === "analysis-evaluation")?.id,
      building: "Materials Building",
      floor: "1st Floor",
      room_numbers: "101-105",
      is_active: true,
      is_featured: false,
      display_order: 8,
    },
  ];

  // Create laboratories
  console.log("🔬 Creating laboratories...");

  const laboratories = await Promise.all(
    laboratoriesData.map((lab) =>
      prisma.laboratory.upsert({
        where: { id: lab.id },
        update: {
          name: toJson(lab.name, lab.name),
          description: toJson(lab.description, lab.description),
          image: lab.image,
          head_name: toJson(lab.head_name, lab.head_name),
          head_title: toJson(lab.head_title, lab.head_title),
          head_academic_title: toJson(lab.head_academic_title, lab.head_academic_title),
          head_picture: lab.head_picture,
          head_cv_url: lab.head_cv_url,
          head_email: lab.head_email,
          head_bio: toJson(lab.head_bio, lab.head_bio),
          address: toJson(lab.address, lab.address),
          phone: lab.phone,
          alternative_phone: lab.alternative_phone,
          fax: lab.fax,
          email: lab.email,
          website: lab.website,
          established_year: lab.established_year,
          facilities: toJson(lab.facilities, lab.facilities),
          equipment_list: toJson(lab.equipment_list, lab.equipment_list),
          research_areas: toJson(lab.research_areas, lab.research_areas),
          services_offered: toJson(lab.services_offered, lab.services_offered),
          staff_count: lab.staff_count,
          students_count: lab.students_count,
          department_id: lab.department_id,
          section_id: lab.section_id || null,
          building: lab.building,
          floor: lab.floor,
          room_numbers: lab.room_numbers,
          is_active: lab.is_active,
          is_featured: lab.is_featured,
          display_order: lab.display_order,
        },
        create: {
          id: lab.id,
          name: toJson(lab.name, lab.name),
          description: toJson(lab.description, lab.description),
          image: lab.image,
          head_name: toJson(lab.head_name, lab.head_name),
          head_title: toJson(lab.head_title, lab.head_title),
          head_academic_title: toJson(lab.head_academic_title, lab.head_academic_title),
          head_picture: lab.head_picture,
          head_cv_url: lab.head_cv_url,
          head_email: lab.head_email,
          head_bio: toJson(lab.head_bio, lab.head_bio),
          address: toJson(lab.address, lab.address),
          phone: lab.phone,
          alternative_phone: lab.alternative_phone,
          fax: lab.fax,
          email: lab.email,
          website: lab.website,
          established_year: lab.established_year,
          facilities: toJson(lab.facilities, lab.facilities),
          equipment_list: toJson(lab.equipment_list, lab.equipment_list),
          research_areas: toJson(lab.research_areas, lab.research_areas),
          services_offered: toJson(lab.services_offered, lab.services_offered),
          staff_count: lab.staff_count,
          students_count: lab.students_count,
          department_id: lab.department_id,
          section_id: lab.section_id || null,
          building: lab.building,
          floor: lab.floor,
          room_numbers: lab.room_numbers,
          is_active: lab.is_active,
          is_featured: lab.is_featured,
          display_order: lab.display_order,
        },
      })
    )
  );

  console.log(`✅ Created ${laboratories.length} laboratories with full details and department links`);

  // ============================================
  // ASSIGN STAFF TO PETROLEUM RESEARCH LABORATORIES
  // ============================================
  console.log("👥 Assigning staff to petroleum research laboratories...");

  const allStaffMembers = await prisma.staff.findMany();
  const laboratoryStaffAssignments = [];

  // Corrosion Lab - Assign 3 staff
  const corrosionLab = laboratories.find((lab: any) => lab.id === "corrosion-lab");
  if (corrosionLab && allStaffMembers.length > 0) {
    for (let i = 0; i < Math.min(3, allStaffMembers.length); i++) {
      const staffMember = allStaffMembers[i];
      if (staffMember) {
        laboratoryStaffAssignments.push({
          laboratory_id: corrosionLab.id,
          staff_id: staffMember.id,
          position: i === 0 ? { en: "Lab Director", ar: "مدير المختبر" } : i === 1 ? { en: "Senior Researcher", ar: "باحث أول" } : { en: "Lab Technician", ar: "فني مختبر" }
        });
      }
    }
  }

  // Roads Lab
  const roadsLab = laboratories.find((lab: any) => lab.id === "roads-lab");
  if (roadsLab && allStaffMembers.length > 3) {
    for (let i = 3; i < Math.min(6, allStaffMembers.length); i++) {
      const staffMember = allStaffMembers[i];
      if (staffMember) {
        laboratoryStaffAssignments.push({
          laboratory_id: roadsLab.id,
          staff_id: staffMember.id,
          position: i === 3 ? { en: "Lab Coordinator", ar: "منسق المختبر" } : { en: "Research Assistant", ar: "مساعد باحث" }
        });
      }
    }
  }

  // Other petroleum labs
  const labAssignments = [
    { labId: "concrete-lab", staffStart: 6, staffEnd: 8, position: { en: "Materials Specialist", ar: "أخصائي مواد" } },
    { labId: "soil-mechanics-lab", staffStart: 8, staffEnd: 10, position: { en: "Geotechnical Engineer", ar: "مهندس جيوتقني" } },
    { labId: "hydraulics-lab", staffStart: 10, staffEnd: 12, position: { en: "Hydraulics Technician", ar: "فني هيدروليكا" } },
    { labId: "environmental-lab", staffStart: 12, staffEnd: 15, position: { en: "Environmental Analyst", ar: "محلل بيئي" } },
    { labId: "materials-testing-lab", staffStart: 15, staffEnd: 17, position: { en: "Testing Engineer", ar: "مهندس اختبارات" } },
    { labId: "surveying-lab", staffStart: 17, staffEnd: 19, position: { en: "Survey Technician", ar: "فني مساحة" } }
  ];

  labAssignments.forEach(({ labId, staffStart, staffEnd, position }) => {
    const lab = laboratories.find((l: any) => l.id === labId);
    if (lab && allStaffMembers.length > staffStart) {
      for (let i = staffStart; i < Math.min(staffEnd, allStaffMembers.length); i++) {
        const staffMember = allStaffMembers[i];
        if (staffMember) {
          laboratoryStaffAssignments.push({
            laboratory_id: lab.id,
            staff_id: staffMember.id,
            position
          });
        }
      }
    }
  });

  // Create assignments
  for (const assignment of laboratoryStaffAssignments) {
    await prisma.laboratoryStaff.create({ data: assignment });
  }

  console.log(`✅ Assigned ${laboratoryStaffAssignments.length} staff to ${new Set(laboratoryStaffAssignments.map(a => a.laboratory_id)).size} petroleum research laboratories`);



  // Update existing data with Unsplash images
  console.log("🔄 Updating existing data with Unsplash images...");

  // Update departments with Unsplash images
  const departmentImageUpdates = [
    {
      id: "dept-sedimentology",
      image:
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=600&fit=crop",
    },
    {
      id: "dept-paleontology",
      image:
        "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&h=600&fit=crop",
    },
    {
      id: "dept-geophysics",
      image:
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop",
    },
    {
      id: "dept-drilling",
      image:
        "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
    },
    {
      id: "dept-reservoir",
      image:
        "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
    },
    {
      id: "dept-production",
      image:
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=600&fit=crop",
    },
    {
      id: "dept-core-analysis",
      image:
        "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&h=600&fit=crop",
    },
    {
      id: "dept-chemical-analysis",
      image:
        "https://images.unsplash.com/photo-1583912086296-89e4d36f5012?w=800&h=600&fit=crop",
    },
    {
      id: "dept-spectroscopy",
      image:
        "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=600&fit=crop",
    },
    {
      id: "dept-corrosion",
      image:
        "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=600&fit=crop",
    },
    {
      id: "dept-soil",
      image:
        "https://images.unsplash.com/photo-1574263867128-cddc47ba885e?w=800&h=600&fit=crop",
    },
    {
      id: "dept-mud",
      image:
        "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
    },
    {
      id: "dept-refining",
      image:
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=600&fit=crop",
    },
    {
      id: "dept-distillation",
      image:
        "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=600&fit=crop",
    },
    {
      id: "dept-applications",
      image:
        "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
    },
    {
      id: "dept-lubricants",
      image:
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=600&fit=crop",
    },
    {
      id: "dept-petrochemicals",
      image:
        "https://images.unsplash.com/photo-1583912086296-89e4d36f5012?w=800&h=600&fit=crop",
    },
    {
      id: "dept-polymers",
      image:
        "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=600&fit=crop",
    },
    {
      id: "dept-process-design",
      image:
        "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
    },
    {
      id: "dept-simulation",
      image:
        "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
    },
    {
      id: "dept-environmental",
      image:
        "https://images.unsplash.com/photo-1574263867128-cddc47ba885e?w=800&h=600&fit=crop",
    },
  ];

  for (const update of departmentImageUpdates) {
    await prisma.department
      .update({
        where: { id: update.id },
        data: { image: update.image },
      })
      .catch(() => {
        // Skip if department doesn't exist
        console.log(
          `⚠️  Department ${update.id} not found, skipping image update`
        );
      });
  }

  // Update services with Unsplash images
  const serviceImageUpdates = [
    {
      id: "1",
      image:
        "https://images.unsplash.com/photo-1583912086296-89e4d36f5012?w=800&h=600&fit=crop",
    },
    {
      id: "2",
      image:
        "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
    },
    {
      id: "3",
      image:
        "https://images.unsplash.com/photo-1574263867128-cddc47ba885e?w=800&h=600&fit=crop",
    },
  ];

  for (const update of serviceImageUpdates) {
    await prisma.service
      .update({
        where: { id: update.id },
        data: { image: update.image },
      })
      .catch(() => {
        console.log(
          `⚠️  Service ${update.id} not found, skipping image update`
        );
      });
  }

  // Update equipment with Unsplash images
  const equipmentImageUpdates = [
    {
      id: "eq-1",
      image:
        "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=600&fit=crop",
    },
    {
      id: "eq-2",
      image:
        "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&h=600&fit=crop",
    },
    {
      id: "eq-4",
      image:
        "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop",
    },
    {
      id: "eq-6",
      image:
        "https://images.unsplash.com/photo-1574263867128-cddc47ba885e?w=800&h=600&fit=crop",
    },
  ];

  for (const update of equipmentImageUpdates) {
    await prisma.serviceEquipment
      .update({
        where: { id: update.id },
        data: { image: update.image },
      })
      .catch(() => {
        console.log(
          `⚠️  Equipment ${update.id} not found, skipping image update`
        );
      });
  }

  // Note: Events don't have image field in the current schema, so skipping event image updates

  // Update staff members with Unsplash images
  const staffImageUpdates = [
    {
      id: "staff-1",
      picture:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    },
    {
      id: "staff-2",
      picture:
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face",
    },
    {
      id: "staff-3",
      picture:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    },
    {
      id: "staff-4",
      picture:
        "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&h=400&fit=crop&crop=face",
    },
    {
      id: "staff-5",
      picture:
        "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face",
    },
    {
      id: "staff-6",
      picture:
        "https://images.unsplash.com/photo-1594824730131-b0d5a8bd3d49?w=400&h=400&fit=crop&crop=face",
    },
  ];

  for (const update of staffImageUpdates) {
    await prisma.staff
      .update({
        where: { id: update.id },
        data: { picture: update.picture },
      })
      .catch(() => {
        console.log(`⚠️  Staff ${update.id} not found, skipping image update`);
      });
  }

  // Update service center heads with Unsplash images
  const centerHeadImageUpdates = [
    {
      id: "ch-1",
      picture:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    },
    {
      id: "ch-2",
      picture:
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face",
    },
    {
      id: "ch-3",
      picture:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    },
    {
      id: "ch-4",
      picture:
        "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face",
    },
    {
      id: "ch-5",
      picture:
        "https://images.unsplash.com/photo-1594824730131-b0d5a8bd3d49?w=400&h=400&fit=crop&crop=face",
    },
  ];

  for (const update of centerHeadImageUpdates) {
    await prisma.serviceCenterHead
      .update({
        where: { id: update.id },
        data: { picture: update.picture },
      })
      .catch(() => {
        console.log(
          `⚠️  Service center head ${update.id} not found, skipping image update`
        );
      });
  }

  // Update speakers with Unsplash images
  const speakerImageUpdates = [
    {
      id: "dr-ahmed-hassan",
      picture:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    },
    {
      id: "dr-fatima-mahmoud",
      picture:
        "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face",
    },
    {
      id: "dr-mohamed-ali",
      picture:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    },
  ];

  for (const update of speakerImageUpdates) {
    await prisma.speaker
      .update({
        where: { id: update.id },
        data: { picture: update.picture },
      })
      .catch(() => {
        console.log(
          `⚠️  Speaker ${update.id} not found, skipping image update`
        );
      });
  }

  console.log("✅ All existing data updated with Unsplash images");

  // Initialize Site Stats
  console.log("📊 Initializing site statistics...");
  const existingStats = await prisma.siteStats.findFirst();
  if (!existingStats) {
    await prisma.siteStats.create({
      data: {
        total_visits: 0,
        unique_sessions: 0,
      },
    });
    console.log("✅ Site statistics initialized");
  } else {
    console.log("✅ Site statistics already exist");
  }

  // Create Hero Sliders
  console.log("🎠 Creating hero sliders...");
  const heroSliders = [
    {
      media_type: "video",
      image: "/petroleum-lab-testing.jpg",
      video:
        "https://www.sliderrevolution.com/wp-content/uploads/revslider/Dancing-Bulbs.mp4",
      title: {
        en: "World-Class Petroleum Analysis & Testing",
        ar: "تحليل واختبار البترول على مستوى عالمي",
      },
      subtitle: {
        en: "Comprehensive crude oil analysis with state-of-the-art technology and expert precision",
        ar: "تحليل شامل للنفط الخام بأحدث التقنيات ودقة الخبراء",
      },
      description: {
        en: "Advanced GC-MS, spectrophotometry, and viscometry services for petroleum quality assurance",
        ar: "خدمات GC-MS والطيف الضوئي واللزوجة المتقدمة لضمان جودة البترول",
      },
      cta: { en: "Explore Our Services", ar: "استكشف خدماتنا" },
      cta_link: "/services",
      badge: { en: "Laboratory Services", ar: "خدمات المختبرات" },
      icon: "Microscope",
      stats: [
        { value: "500+", label: { en: "Tests Completed", ar: "اختبار مكتمل" } },
        { value: "98%", label: { en: "Accuracy Rate", ar: "معدل الدقة" } },
      ],
      is_active: true,
      order_index: 0,
    },
    {
      media_type: "image",
      image: "/conference-symposium.jpg",
      title: {
        en: "Annual Research Symposium 2025",
        ar: "الندوة البحثية السنوية 2025",
      },
      subtitle: {
        en: "Join leading researchers and industry experts for groundbreaking insights",
        ar: "انضم إلى الباحثين الرائدين وخبراء الصناعة للحصول على رؤى رائدة",
      },
      description: {
        en: "April 15, 2025 • Main Campus Auditorium • 500 Capacity",
        ar: "15 أبريل 2025 • قاعة الحرم الجامعي الرئيسي • سعة 500",
      },
      cta: { en: "Register Now", ar: "سجل الآن" },
      cta_link: "/events",
      badge: { en: "Featured Event", ar: "حدث مميز" },
      icon: "Calendar",
      stats: [
        { value: "342", label: { en: "Registered", ar: "مسجل" } },
        { value: "15+", label: { en: "Speakers", ar: "متحدث" } },
      ],
      is_active: true,
      order_index: 1,
    },
    {
      media_type: "image",
      image: "/reservoir-engineering.jpg",
      title: {
        en: "Advanced Reservoir Engineering Services",
        ar: "خدمات هندسة المكامن المتقدمة",
      },
      subtitle: {
        en: "Maximize hydrocarbon recovery with cutting-edge simulation and analysis",
        ar: "تعظيم استعادة الهيدروكربونات بمحاكاة وتحليل متطورة",
      },
      description: {
        en: "Comprehensive reservoir characterization, modeling, and production optimization",
        ar: "توصيف شامل للمكامن والنمذجة وتحسين الإنتاج",
      },
      cta: { en: "Learn More", ar: "اعرف المزيد" },
      cta_link: "/services",
      badge: { en: "Engineering Services", ar: "خدمات هندسية" },
      icon: "Wrench",
      stats: [
        { value: "100+", label: { en: "Projects", ar: "مشروع" } },
        { value: "30+", label: { en: "Years Experience", ar: "سنة خبرة" } },
      ],
      is_active: true,
      order_index: 2,
    },
    {
      media_type: "image",
      image: "/ai-technology-workshop.jpg",
      title: {
        en: "Upcoming: AI in Petroleum Technology Workshop",
        ar: "قريباً: ورشة عمل الذكاء الاصطناعي في تكنولوجيا البترول",
      },
      subtitle: {
        en: "Master the future of energy with artificial intelligence applications",
        ar: "أتقن مستقبل الطاقة مع تطبيقات الذكاء الاصطناعي",
      },
      description: {
        en: "Hands-on training in machine learning for petroleum exploration and production",
        ar: "تدريب عملي في التعلم الآلي لاستكشاف وإنتاج البترول",
      },
      cta: { en: "View Events", ar: "عرض الأحداث" },
      cta_link: "/events",
      badge: { en: "Workshop", ar: "ورشة عمل" },
      icon: "Lightbulb",
      stats: [
        { value: "3 Days", label: { en: "Duration", ar: "المدة" } },
        { value: "Certificate", label: { en: "Included", ar: "مشمول" } },
      ],
      is_active: true,
      order_index: 3,
    },
  ];

  // Check if hero sliders already exist
  const existingSliders = await (prisma as any).heroSlider.findMany();
  if (existingSliders.length === 0) {
    for (const slider of heroSliders) {
      await (prisma as any).heroSlider.create({
        data: {
          media_type: slider.media_type,
          image: slider.image,
          video: slider.video,
          title: slider.title as any,
          subtitle: slider.subtitle as any,
          description: slider.description as any,
          cta: slider.cta as any,
          cta_link: slider.cta_link,
          badge: slider.badge as any,
          icon: slider.icon,
          stats: slider.stats as any,
          is_active: slider.is_active,
          order_index: slider.order_index,
        },
      });
    }
  } else {
    console.log("✅ Hero sliders already exist, skipping creation");
  }
  console.log(`✅ Created ${heroSliders.length} hero sliders`);

  // Create Home Page Content
  console.log("🏠 Creating home page content...");
  const homePageContents = [
    {
      section_key: "why_choose",
      title: { en: "Why Choose EPRI?", ar: "لماذا تختار EPRI؟" },
      subtitle: {
        en: "Excellence in petroleum research backed by international certifications and decades of expertise",
        ar: "التميز في البحث البترولي مدعوم بالشهادات الدولية وعقود من الخبرة",
      },
      description: {
        en: "EPRI maintains ISO 9001:2015 and ISO 45001:2018 certifications",
        ar: "تحافظ EPRI على شهادات ISO 9001:2015 و ISO 45001:2018",
      },
      content: {
        features: [
          {
            icon: "Award",
            title: {
              en: "ISO Certified Excellence",
              ar: "التميز المعتمد من ISO",
            },
            description: {
              en: "Internationally recognized quality management systems ensuring the highest standards",
              ar: "أنظمة إدارة الجودة المعترف بها دولياً التي تضمن أعلى المعايير",
            },
            color: "from-yellow-500 to-orange-500",
          },
          {
            icon: "Users",
            title: { en: "Expert Team", ar: "فريق خبير" },
            description: {
              en: "Leading researchers and industry professionals with decades of experience",
              ar: "باحثون رائدون ومهنيون في الصناعة مع عقود من الخبرة",
            },
            color: "from-blue-500 to-cyan-500",
          },
          {
            icon: "TrendingUp",
            title: { en: "Cutting-Edge Research", ar: "بحث متطور" },
            description: {
              en: "Advanced technology and innovative solutions for the petroleum industry",
              ar: "تقنيات متقدمة وحلول مبتكرة لصناعة البترول",
            },
            color: "from-purple-500 to-pink-500",
          },
          {
            icon: "Shield",
            title: { en: "Trusted & Reliable", ar: "موثوق وموثوق به" },
            description: {
              en: "Proven track record with industry partners and government agencies",
              ar: "سجل حافل مع شركاء الصناعة والوكالات الحكومية",
            },
            color: "from-green-500 to-emerald-500",
          },
          {
            icon: "Target",
            title: { en: "Focused Excellence", ar: "التميز المركز" },
            description: {
              en: "Specialized expertise in petroleum research, analysis, and development",
              ar: "خبرة متخصصة في البحث والتحليل والتطوير البترولي",
            },
            color: "from-red-500 to-rose-500",
          },
          {
            icon: "Zap",
            title: { en: "Innovation Driven", ar: "مدفوع بالابتكار" },
            description: {
              en: "Continuous improvement and adoption of latest technologies and methodologies",
              ar: "التحسين المستمر واعتماد أحدث التقنيات والمنهجيات",
            },
            color: "from-indigo-500 to-violet-500",
          },
        ],
      },
      is_active: true,
      order_index: 0,
    },
    {
      section_key: "achievements",
      title: { en: "Our Achievements", ar: "إنجازاتنا" },
      subtitle: {
        en: "Milestones in education and research",
        ar: "معالم في التعليم والبحث",
      },
      content: {
        achievements: [
          { title: { en: "MSc Programs", ar: "برامج الماجستير" }, value: 126 },
          { title: { en: "PhD Programs", ar: "برامج الدكتوراه" }, value: 40 },
          {
            title: {
              en: "Higher Specialization Programs In Medicine And Dentistry",
              ar: "برامج التخصص العالي في الطب وطب الأسنان",
            },
            value: 22,
          },
          { title: { en: "Higher Diploma", ar: "الدبلوم العالي" }, value: 8 },
          {
            title: { en: "Certificate Programs", ar: "برامج الشهادات" },
            value: 15,
          },
        ],
      },
      is_active: true,
      order_index: 1,
    },
    {
      section_key: "cta",
      title: {
        en: "Ready to Start Your Learning Journey?",
        ar: "هل أنت مستعد لبدء رحلة التعلم الخاصة بك؟",
      },
      subtitle: {
        en: "Join thousands of students advancing their careers with EPRI",
        ar: "انضم إلى آلاف الطلاب الذين يتقدمون في حياتهم المهنية مع EPRI",
      },
      button_text: { en: "Get Started Today", ar: "ابدأ اليوم" },
      button_link: "/register",
      content: {
        secondary_button_text: { en: "Browse Courses", ar: "تصفح الدورات" },
        secondary_button_link: "/courses",
      },
      is_active: true,
      order_index: 2,
    },
    {
      section_key: "connect",
      title: { en: "CONNECT", ar: "تواصل" },
      subtitle: {
        en: "Stay connected with us on social media",
        ar: "ابق على اتصال معنا على وسائل التواصل الاجتماعي",
      },
      content: {
        instagramPosts: [
          { id: "1", image: "/placeholder.svg", caption: "we compare" },
          { id: "2", image: "/placeholder.svg", caption: "" },
          { id: "3", image: "/placeholder.svg", caption: "Teams in action" },
          { id: "4", image: "/placeholder.svg", caption: "" },
          { id: "5", image: "/placeholder.svg", caption: "" },
          { id: "6", image: "/placeholder.svg", caption: "11.2" },
        ],
        tweets: [
          {
            id: "1",
            text: "RT @AutonomousAD: انتهى الانتظار! كأس آسيا والمحيط الهادئ للروبوتات 2025 مع حفل افتتاح ملهم...",
            author: "KhalifaUni جامعة خليفة للعلوم والتكنولوجيا",
            handle: "@KhalifaUni",
            timestamp: "2h",
          },
          {
            id: "2",
            text: "RT @AutonomousAD: https://t.co/AdKNN9Jhfl",
            author: "KhalifaUni جامعة خليفة للعلوم والتكنولوجيا",
            handle: "@KhalifaUni",
            timestamp: "3h",
          },
          {
            id: "3",
            text: "RT @AutonomousAD: https://t.co/AdKNN9Jhfl",
            author: "KhalifaUni جامعة خليفة للعلوم والتكنولوجيا",
            handle: "@KhalifaUni",
            timestamp: "4h",
          },
          {
            id: "4",
            text: "RT @AutonomousAD: https://t.co/AdKNN9Jhfl",
            author: "KhalifaUni جامعة خليفة للعلوم والتكنولوجيا",
            handle: "@KhalifaUni",
            timestamp: "5h",
          },
        ],
        youtubeVideos: [
          {
            id: "1",
            title: "Can Your Wearable Add Years to Your Life?",
            thumbnail: "/placeholder.svg",
            description:
              "Wearable devices do more than count steps, as they hold clues about your heart, sleep, and even your lifespan. In...",
            date: "November 17, 2025, 6:52 am",
            url: "#",
          },
        ],
      },
      is_active: true,
      order_index: 3,
    },
  ];

  for (const content of homePageContents) {
    await prisma.homePageContent.upsert({
      where: { section_key: content.section_key },
      update: {},
      create: {
        section_key: content.section_key,
        title: content.title ? (content.title as any) : null,
        subtitle: content.subtitle ? (content.subtitle as any) : null,
        description: content.description ? (content.description as any) : null,
        content: content.content ? (content.content as any) : null,
        button_text: content.button_text ? (content.button_text as any) : null,
        button_link: content.button_link || null,
        is_active: content.is_active,
        order_index: content.order_index,
      },
    });
  }
  console.log(
    `✅ Created ${homePageContents.length} home page content sections`
  );

  // Create PageContent for Innovation and Entrepreneurship pages
  const innovationPageContents = [
    {
      page_key: "innovation-and-entrepreneurship",
      section_key: "overview",
      title: {
        en: "Innovation and Entrepreneurship",
        ar: "الابتكار وريادة الأعمال",
      },
      description: {
        en: "Fostering innovation, supporting entrepreneurs, and transforming ideas into successful businesses in the petroleum and energy sector.",
        ar: "تعزيز الابتكار ودعم رواد الأعمال وتحويل الأفكار إلى أعمال ناجحة في قطاع البترول والطاقة.",
      },
      is_active: true,
      order_index: 0,
    },
    {
      page_key: "innovation-and-entrepreneurship",
      section_key: "technology-transfer-tto",
      title: {
        en: "Technology Transfer TTO",
        ar: "نقل التكنولوجيا TTO",
      },
      description: {
        en: "Facilitating the transfer of research innovations and technologies from the laboratory to industry and market.",
        ar: "تسهيل نقل الابتكارات والتكنولوجيات البحثية من المختبر إلى الصناعة والسوق.",
      },
      is_active: true,
      order_index: 1,
    },
    {
      page_key: "innovation-and-entrepreneurship",
      section_key: "grant-international-cooperation-gico",
      title: {
        en: "Grant & International Cooperation GICO",
        ar: "المنح والتعاون الدولي GICO",
      },
      description: {
        en: "Managing grants, funding opportunities, and fostering international research collaborations.",
        ar: "إدارة المنح وفرص التمويل وتعزيز التعاون البحثي الدولي.",
      },
      is_active: true,
      order_index: 2,
    },
    {
      page_key: "innovation-and-entrepreneurship",
      section_key: "technology-innovation-support-tisc",
      title: {
        en: "Technology Innovation Support TISC",
        ar: "دعم الابتكار التكنولوجي TISC",
      },
      description: {
        en: "Supporting technology innovation and providing resources for research and development initiatives.",
        ar: "دعم الابتكار التكنولوجي وتوفير الموارد لمبادرات البحث والتطوير.",
      },
      is_active: true,
      order_index: 3,
    },
    {
      page_key: "innovation-and-entrepreneurship",
      section_key: "ip-management",
      title: {
        en: "IP Management",
        ar: "إدارة الملكية الفكرية",
      },
      description: {
        en: "Managing intellectual property rights, patents, trademarks, and protecting research innovations.",
        ar: "إدارة حقوق الملكية الفكرية وبراءات الاختراع والعلامات التجارية وحماية الابتكارات البحثية.",
      },
      is_active: true,
      order_index: 4,
    },
    {
      page_key: "innovation-and-entrepreneurship",
      section_key: "e-club",
      title: {
        en: "E-Club",
        ar: "النادي الإلكتروني",
      },
      description: {
        en: "Entrepreneurship club fostering innovation, networking, and startup development.",
        ar: "نادي ريادة الأعمال الذي يعزز الابتكار والتواصل وتطوير الشركات الناشئة.",
      },
      is_active: true,
      order_index: 5,
    },
    {
      page_key: "innovation-and-entrepreneurship",
      section_key: "incubators-startups",
      title: {
        en: "Incubators Of Startups",
        ar: "حاضنات الشركات الناشئة",
      },
      description: {
        en: "Supporting startup companies with incubation services, mentorship, and resources for growth.",
        ar: "دعم الشركات الناشئة بخدمات الحضانة والإرشاد والموارد للنمو.",
      },
      is_active: true,
      order_index: 6,
    },
    {
      page_key: "innovation-and-entrepreneurship",
      section_key: "patent",
      title: {
        en: "Patent",
        ar: "براءة الاختراع",
      },
      description: {
        en: "View our registered patents and intellectual property.",
        ar: "عرض براءات الاختراع المسجلة والملكية الفكرية.",
      },
      is_active: true,
      order_index: 7,
    },
  ];

  for (const content of innovationPageContents) {
    // Check if exists first, then update or create
    const existing = await prisma.pageContent.findFirst({
      where: {
        page_key: content.page_key,
        section_key: content.section_key,
      },
    });

    if (existing) {
      await prisma.pageContent.update({
        where: { id: existing.id },
        data: {
          title: content.title as any,
          description: content.description as any,
          is_active: content.is_active,
          order_index: content.order_index,
        },
      });
    } else {
      await prisma.pageContent.create({
        data: {
          page_key: content.page_key,
          section_key: content.section_key,
          title: content.title as any,
          description: content.description as any,
          is_active: content.is_active,
          order_index: content.order_index,
        },
      });
    }
  }
  console.log(
    `✅ Created ${innovationPageContents.length} Innovation and Entrepreneurship page content sections`
  );

  console.log(
    "🎉 Database seeding completed successfully with comprehensive relational data and Unsplash images!"
  );
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
