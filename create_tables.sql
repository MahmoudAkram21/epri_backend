-- Create all tables for EPR backend based on current schema
USE epri_fresh;

-- System Settings
CREATE TABLE IF NOT EXISTS `system_setting` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `description` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    
    UNIQUE INDEX `system_setting_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Website Visitor Counter
CREATE TABLE IF NOT EXISTS `website_counter` (
    `id` VARCHAR(191) NOT NULL,
    `total_visits` BIGINT NOT NULL DEFAULT 0,
    `unique_sessions` BIGINT NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Session Tracking (minimal tracking for unique sessions)
CREATE TABLE IF NOT EXISTS `session_track` (
    `id` VARCHAR(191) NOT NULL,
    `session_id` VARCHAR(191) NOT NULL,
    `first_visit` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_visit` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `page_views` INTEGER NOT NULL DEFAULT 1,
    
    UNIQUE INDEX `session_track_session_id_key`(`session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- User Management
CREATE TABLE IF NOT EXISTS `user` (
    `id` VARCHAR(191) NOT NULL,
    `first_name` VARCHAR(191) NOT NULL,
    `last_name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `password_hash` VARCHAR(191) NULL,
    `role` ENUM('STUDENT', 'RESEARCHER', 'INSTRUCTOR', 'ADMIN', 'GUEST') NOT NULL DEFAULT 'STUDENT',
    `is_verified` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    
    UNIQUE INDEX `user_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Event Categories
CREATE TABLE IF NOT EXISTS `category` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `color` VARCHAR(191) NULL,
    `icon` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    
    UNIQUE INDEX `category_title_key`(`title`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Event Address/Location
CREATE TABLE IF NOT EXISTS `address` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `line_1` VARCHAR(191) NOT NULL,
    `line_2` VARCHAR(191) NULL,
    `city` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NULL,
    `country` VARCHAR(191) NOT NULL DEFAULT 'Egypt',
    `postal_code` VARCHAR(191) NULL,
    `map_link` VARCHAR(191) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Events/Conferences/Symposiums
CREATE TABLE IF NOT EXISTS `event` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NULL,
    `price` DECIMAL(8, 2) NOT NULL DEFAULT 0,
    `capacity` INTEGER NOT NULL DEFAULT 100,
    `status` ENUM('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'DRAFT',
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `registration_open` BOOLEAN NOT NULL DEFAULT true,
    `is_conference` BOOLEAN NOT NULL DEFAULT false,
    `cover_image` VARCHAR(191) NULL,
    `agenda` JSON NULL,
    `guidelines` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `address_id` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Junction table for Event-Category many-to-many relationship
CREATE TABLE IF NOT EXISTS `event_category` (
    `id` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL,
    `category_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `event_category_event_id_category_id_key`(`event_id`, `category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Event Speakers/Presenters
CREATE TABLE IF NOT EXISTS `speaker` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `bio` TEXT NULL,
    `picture` VARCHAR(191) NULL,
    `topics` JSON NULL,
    `expertise` VARCHAR(191) NULL,
    `institution` VARCHAR(191) NULL,
    `linkedin` VARCHAR(191) NULL,
    `twitter` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Event Orders/Registrations
CREATE TABLE IF NOT EXISTS `event_order` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL,
    `payment_status` ENUM('PENDING', 'PAID', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `total_amount` DECIMAL(8, 2) NOT NULL,
    `payment_method` VARCHAR(191) NULL,
    `transaction_id` VARCHAR(191) NULL,
    `receipt_url` VARCHAR(191) NULL,
    `verified_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Digital Tickets
CREATE TABLE IF NOT EXISTS `ticket` (
    `id` VARCHAR(191) NOT NULL,
    `ticket_number` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `event_id` VARCHAR(191) NOT NULL,
    `ticket_type` VARCHAR(191) NOT NULL DEFAULT 'GENERAL',
    `ticket_price` DECIMAL(8, 2) NOT NULL,
    `ticket_status` ENUM('ACTIVE', 'USED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    `qr_code` VARCHAR(191) NULL,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ticket_ticket_number_key`(`ticket_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Course Management (Enhanced with online/offline delivery)
CREATE TABLE IF NOT EXISTS `course` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `subtitle` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `image` VARCHAR(191) NULL,
    `instructor_id` VARCHAR(191) NULL,
    `instructor_name` VARCHAR(191) NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'General',
    `price` DECIMAL(8, 2) NOT NULL DEFAULT 0,
    `is_free` BOOLEAN NOT NULL DEFAULT false,
    `duration_hours` INTEGER NOT NULL DEFAULT 0,
    `duration_weeks` INTEGER NOT NULL DEFAULT 0,
    `level` VARCHAR(191) NOT NULL DEFAULT 'BEGINNER',
    `language` VARCHAR(191) NOT NULL DEFAULT 'English',
    `max_students` INTEGER NOT NULL DEFAULT 50,
    `is_published` BOOLEAN NOT NULL DEFAULT false,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    
    -- Delivery Type and Location
    `delivery_type` ENUM('ONLINE', 'OFFLINE', 'HYBRID') NOT NULL DEFAULT 'ONLINE',
    `meeting_location` VARCHAR(191) NULL,
    `room_number` VARCHAR(191) NULL,
    `building` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `zoom_link` VARCHAR(191) NULL,
    `meeting_id` VARCHAR(191) NULL,
    `meeting_passcode` VARCHAR(191) NULL,
    `platform` VARCHAR(191) NULL,
    
    -- Schedule
    `start_date` DATETIME(3) NULL,
    `end_date` DATETIME(3) NULL,
    `schedule_info` TEXT NULL,
    `time_zone` VARCHAR(191) NOT NULL DEFAULT 'UTC',
    
    -- Learning Objectives and Requirements
    `objectives` JSON NULL,
    `requirements` JSON NULL,
    
    -- Stats
    `rating_average` FLOAT NOT NULL DEFAULT 0.0,
    `rating_count` INTEGER NOT NULL DEFAULT 0,
    `enrollment_count` INTEGER NOT NULL DEFAULT 0,
    
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Course Lessons (Enhanced for recorded content)
CREATE TABLE IF NOT EXISTS `lesson` (
    `id` VARCHAR(191) NOT NULL,
    `course_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `content` LONGTEXT NULL,
    `video_url` VARCHAR(191) NULL,
    `video_type` VARCHAR(191) NOT NULL DEFAULT 'youtube',
    `video_id` VARCHAR(191) NULL,
    `duration` INTEGER NOT NULL DEFAULT 0,
    `order_index` INTEGER NOT NULL DEFAULT 0,
    `is_free` BOOLEAN NOT NULL DEFAULT false,
    `is_preview` BOOLEAN NOT NULL DEFAULT false,
    `attachments` JSON NULL,
    `quiz_data` JSON NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Course Enrollments
CREATE TABLE IF NOT EXISTS `course_enrollment` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `course_id` VARCHAR(191) NOT NULL,
    `enrolled_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completed_at` DATETIME(3) NULL,
    `progress` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `course_enrollment_user_id_course_id_key`(`user_id`, `course_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Reviews and Ratings
CREATE TABLE IF NOT EXISTS `review` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `course_id` VARCHAR(191) NULL,
    `event_id` VARCHAR(191) NULL,
    `rating` TINYINT NOT NULL,
    `comment` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Department Section
CREATE TABLE IF NOT EXISTS `department_section` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `order_index` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `department_section_name_key`(`name`),
    UNIQUE INDEX `department_section_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Department
CREATE TABLE IF NOT EXISTS `department` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `image` VARCHAR(191) NULL,
    `icon` VARCHAR(191) NULL,
    `manager_id` VARCHAR(191) NULL,
    `section_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Staff
CREATE TABLE IF NOT EXISTS `staff` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `academic_position` VARCHAR(191) NULL,
    `current_admin_position` VARCHAR(191) NULL,
    `ex_admin_position` VARCHAR(191) NULL,
    `scientific_name` VARCHAR(191) NULL,
    `picture` VARCHAR(191) NULL,
    `gallery` JSON NULL,
    `bio` TEXT NULL,
    `research_interests` TEXT NULL,
    `news` TEXT NULL,
    `email` VARCHAR(191) NULL,
    `alternative_email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `mobile` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `google_scholar` VARCHAR(191) NULL,
    `research_gate` VARCHAR(191) NULL,
    `academia_edu` VARCHAR(191) NULL,
    `linkedin` VARCHAR(191) NULL,
    `facebook` VARCHAR(191) NULL,
    `twitter` VARCHAR(191) NULL,
    `google_plus` VARCHAR(191) NULL,
    `youtube` VARCHAR(191) NULL,
    `wordpress` VARCHAR(191) NULL,
    `instagram` VARCHAR(191) NULL,
    `mendeley` VARCHAR(191) NULL,
    `zotero` VARCHAR(191) NULL,
    `evernote` VARCHAR(191) NULL,
    `orcid` VARCHAR(191) NULL,
    `scopus` VARCHAR(191) NULL,
    `publications_count` INTEGER NOT NULL DEFAULT 0,
    `papers_count` INTEGER NOT NULL DEFAULT 0,
    `abstracts_count` INTEGER NOT NULL DEFAULT 0,
    `courses_files_count` INTEGER NOT NULL DEFAULT 0,
    `inlinks_count` INTEGER NOT NULL DEFAULT 0,
    `external_links_count` INTEGER NOT NULL DEFAULT 0,
    `faculty` VARCHAR(191) NULL,
    `department` VARCHAR(191) NULL,
    `office_location` VARCHAR(191) NULL,
    `office_hours` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Laboratory
CREATE TABLE IF NOT EXISTS `laboratory` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `image` VARCHAR(191) NULL,
    
    -- Head of Laboratory Information
    `head_name` VARCHAR(191) NULL,
    `head_title` VARCHAR(191) NULL,
    `head_academic_title` VARCHAR(191) NULL,
    `head_picture` VARCHAR(191) NULL,
    `head_cv_url` VARCHAR(191) NULL,
    `head_email` VARCHAR(191) NULL,
    `head_bio` TEXT NULL,
    
    -- Contact Information
    `address` TEXT NULL,
    `phone` VARCHAR(191) NULL,
    `alternative_phone` VARCHAR(191) NULL,
    `fax` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    
    -- Laboratory Details
    `established_year` INTEGER NULL,
    `facilities` TEXT NULL,
    `equipment_list` TEXT NULL,
    `research_areas` TEXT NULL,
    `services_offered` TEXT NULL,
    `staff_count` INTEGER NOT NULL DEFAULT 0,
    `students_count` INTEGER NOT NULL DEFAULT 0,
    
    -- Organizational Info
    `department_id` VARCHAR(191) NULL,
    `section_id` VARCHAR(191) NULL,
    `building` VARCHAR(191) NULL,
    `floor` VARCHAR(191) NULL,
    `room_numbers` VARCHAR(191) NULL,
    
    -- Status and Visibility
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `display_order` INTEGER NOT NULL DEFAULT 0,
    
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Department Staff
CREATE TABLE IF NOT EXISTS `department_staff` (
    `id` VARCHAR(191) NOT NULL,
    `department_id` VARCHAR(191) NOT NULL,
    `staff_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `department_staff_department_id_staff_id_key`(`department_id`, `staff_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Service Center Head
CREATE TABLE IF NOT EXISTS `service_center_head` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `picture` VARCHAR(191) NULL,
    `bio` TEXT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `expertise` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Services
CREATE TABLE IF NOT EXISTS `service` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `subtitle` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `image` VARCHAR(191) NULL,
    `category` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NULL,
    `features` JSON NULL,
    `duration` VARCHAR(191) NULL,
    `price` DECIMAL(8, 2) NULL DEFAULT 0,
    `is_free` BOOLEAN NOT NULL DEFAULT false,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `is_published` BOOLEAN NOT NULL DEFAULT true,
    `center_head_id` VARCHAR(191) NULL,
    `group_name` VARCHAR(191) NULL,
    `group_order` INTEGER NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Service Tabs
CREATE TABLE IF NOT EXISTS `service_tab` (
    `id` VARCHAR(191) NOT NULL,
    `service_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `order_index` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Service Equipment
CREATE TABLE IF NOT EXISTS `service_equipment` (
    `id` VARCHAR(191) NOT NULL,
    `service_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `image` VARCHAR(191) NULL,
    `specifications` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Many-to-many relationship for Event and Speaker
CREATE TABLE IF NOT EXISTS `_EventToSpeaker` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_EventToSpeaker_AB_unique`(`A`, `B`),
    INDEX `_EventToSpeaker_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Note: Foreign key constraints are handled by Prisma migrations
-- This file focuses on table creation only to avoid constraint conflicts
-- Run 'npx prisma db push' after creating tables to add relationships

-- Initialize website counter (only if no record exists)
INSERT IGNORE INTO `website_counter` (`id`, `total_visits`, `unique_sessions`, `created_at`, `updated_at`)
VALUES ('main-counter', 0, 0, NOW(3), NOW(3));
