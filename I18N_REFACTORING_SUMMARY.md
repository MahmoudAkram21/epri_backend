# Backend i18n Refactoring Summary

## ✅ Completed Tasks

### 1. i18n Infrastructure Setup
- ✅ Created `/backend/i18n/index.js` - Main i18next initialization with filesystem backend
- ✅ Created `/backend/i18n/helpers.js` - Helper function for non-request context translations
- ✅ Updated `/backend/src/lib/i18n.ts` - Already configured with filesystem backend
- ✅ i18n middleware is properly applied in `server-auth.ts` (line 258)

### 2. Translation Files
- ✅ Created comprehensive `/backend/locales/en/backend.json` with all translation keys
- ✅ Created comprehensive `/backend/locales/ar/backend.json` with Arabic translations
- ✅ All namespaces organized: common, auth, products, services, departments, events, news, courses, users, staff, api, validation, visitor_stats, service_center, status

### 3. Prisma Schema Updates (Multilingual Fields)
Updated the following models to support multilingual fields:

- ✅ **Category**: `title_en`, `title_ar`, `description_en`, `description_ar`
- ✅ **Event**: `title_en`, `title_ar`, `description_en`, `description_ar`, `guidelines_en`, `guidelines_ar`
- ✅ **Product**: `name_en`, `name_ar`, `description_en`, `description_ar`, `short_description_en`, `short_description_ar`
- ✅ **Course**: `title_en`, `title_ar`, `subtitle_en`, `subtitle_ar`, `description_en`, `description_ar`
- ✅ **Lesson**: `title_en`, `title_ar`, `description_en`, `description_ar`, `content_en`, `content_ar`
- ✅ **Department**: `name_en`, `name_ar`, `description_en`, `description_ar`
- ✅ **DepartmentSection**: `name_en`, `name_ar`
- ✅ **Service**: `title_en`, `title_ar`, `subtitle_en`, `subtitle_ar`, `description_en`, `description_ar`
- ✅ **ServiceTab**: `title_en`, `title_ar`, `content_en`, `content_ar`
- ✅ **ServiceCenter**: `name_en`, `name_ar`, `headline_en`, `headline_ar`, `description_en`, `description_ar`, `lab_methodology_en`, `lab_methodology_ar`, `future_prospective_en`, `future_prospective_ar`
- ✅ **ServiceEquipment**: `name_en`, `name_ar`, `description_en`, `description_ar`
- ✅ **ISOCertificate**: `title_en`, `title_ar`, `description_en`, `description_ar`
- ✅ **Laboratory**: `name_en`, `name_ar`, `description_en`, `description_ar`, `facilities_en`, `facilities_ar`, `equipment_list_en`, `equipment_list_ar`, `research_areas_en`, `research_areas_ar`, `services_offered_en`, `services_offered_ar`

### 4. Code Updates
- ✅ Updated `/backend/src/server-auth.ts` - Most API response messages now use `req.t()`
- ✅ Updated `/backend/src/routes/visitor-stats.ts` - All messages use translations
- ✅ Updated `/backend/src/middleware/auth.ts` - All error messages use translations

### 5. Translation Keys Created
All translation keys follow snake_case and are organized by namespace:
- `common.*` - Common messages (success, error, not_found, etc.)
- `auth.*` - Authentication and authorization messages
- `products.*` - Product-related messages
- `services.*` - Service-related messages
- `departments.*` - Department-related messages
- `events.*` - Event-related messages
- `courses.*` - Course-related messages
- `users.*` - User-related messages
- `staff.*` - Staff-related messages
- `api.*` - API health/status messages
- `validation.*` - Validation error messages
- `visitor_stats.*` - Visitor statistics messages
- `service_center.*` - Service center messages
- `status.*` - Status enum translations

## ⚠️ Remaining Tasks

### 1. Database Migration
**CRITICAL**: Create and run Prisma migration for multilingual fields:

```bash
cd backend
npx prisma migrate dev --name add_multilingual_fields
```

**IMPORTANT NOTES:**
- This migration will add new columns but won't migrate existing data
- You'll need to create a data migration script to copy existing `name` → `name_en`, `title` → `title_en`, etc.
- Consider backing up the database before running the migration

### 2. Seed File Updates
**File**: `/backend/prisma/seed.ts`

**Required Changes:**
- Replace hardcoded English text with translation keys using the helper function
- Import: `const { t } = require('../i18n/helpers');`
- Update all seed data to use `name_en`, `name_ar`, `title_en`, `title_ar`, etc.
- Example:
  ```typescript
  // Before:
  name: "Laptop",
  description: "A powerful computer"
  
  // After:
  name_en: "Laptop",
  name_ar: "لابتوب",
  description_en: "A powerful computer",
  description_ar: "جهاز كمبيوتر قوي"
  ```

### 3. Remaining Hardcoded Messages in server-auth.ts
Some messages may still be hardcoded. Search for:
- `message: '...'` (with single quotes)
- `message: "..."` (with double quotes)
- `'Internal server error'`
- Any other English text in response messages

### 4. API Response Transformations
When returning data from Prisma, you'll need to transform multilingual fields based on the request locale:

```typescript
const locale = req.locale || 'en';
const product = {
  ...dbProduct,
  name: dbProduct[`name_${locale}`] || dbProduct.name_en,
  description: dbProduct[`description_${locale}`] || dbProduct.description_en,
  // ... other fields
};
```

### 5. Enum Translations
User-facing enums (PaymentStatus, TicketStatus, EventStatus, etc.) should be translated when returned to the frontend. Add translation keys in the `status` namespace.

## 📋 Translation Keys Reference

### Common Messages
- `common.success`
- `common.error`
- `common.not_found`
- `common.unauthorized`
- `common.forbidden`
- `common.bad_request`
- `common.server_error`
- `common.created`
- `common.updated`
- `common.deleted`
- `common.something_went_wrong`

### Authentication
- `auth.login_success`
- `auth.login_failed`
- `auth.invalid_credentials`
- `auth.token_expired`
- `auth.token_invalid`
- `auth.registration_success`
- `auth.registration_failed`
- `auth.email_exists`
- `auth.password_too_short`
- `auth.password_min_length`
- `auth.email_password_required`
- `auth.account_pending`
- `auth.account_not_verified`
- `auth.access_token_required`
- `auth.authentication_required`
- `auth.user_not_found`
- `auth.token_valid`
- `auth.invalid_unverified_token`
- `auth.invalid_or_expired_token`
- `auth.admin_access_required`
- `auth.instructor_access_required`
- `auth.verified_user_access_required`
- `auth.user_role_updated`
- `auth.user_verification_updated`
- `auth.user_created`
- `auth.user_updated`
- `auth.user_deleted`
- `auth.user_plan_removed`
- `auth.user_trial_stopped`
- `auth.first_name_last_name_email_required`
- `auth.email_already_in_use`
- `auth.user_with_email_exists`

### Products
- `products.not_found`
- `products.created`
- `products.updated`
- `products.deleted`
- `products.name_required`
- `products.name_already_exists`

### Services
- `services.not_found`
- `services.created`
- `services.updated`
- `services.deleted`
- `services.title_description_required`
- `services.failed_to_fetch`
- `services.failed_to_create`
- `services.failed_to_update`
- `services.failed_to_delete`

### Departments
- `departments.not_found`
- `departments.created`
- `departments.updated`
- `departments.deleted`
- `departments.failed_to_fetch`
- `departments.failed_to_fetch_sections`
- `departments.failed_to_fetch_list`

### Events
- `events.not_found`
- `events.created`
- `events.updated`
- `events.deleted`
- `events.endpoint_ready`

### Courses
- `courses.not_found`
- `courses.created`
- `courses.updated`
- `courses.deleted`
- `courses.lesson_not_found`

### Users
- `users.not_found`
- `users.created`
- `users.updated`
- `users.deleted`

### Staff
- `staff.not_found`
- `staff.failed_to_fetch`

### Visitor Stats
- `visitor_stats.visit_tracked`
- `visitor_stats.failed_to_track`
- `visitor_stats.failed_to_get_stats`
- `visitor_stats.counter_reset`
- `visitor_stats.failed_to_reset`
- `visitor_stats.failed_to_generate_session`

### Service Center
- `service_center.not_found`

### Status Enums
- `status.pending`
- `status.paid`
- `status.cancelled`
- `status.refunded`
- `status.active`
- `status.used`
- `status.expired`
- `status.draft`
- `status.published`
- `status.completed`

## 🔧 Usage Examples

### In Route Handlers (with request context)
```typescript
app.post('/api/example', async (req, res) => {
  const t = getT(req);
  return res.json({ message: t('common.success') });
});
```

### In Seed Files (without request context)
```typescript
const { t } = require('../i18n/helpers');

const product = {
  name_en: t('product.laptop.name', 'en'),
  name_ar: t('product.laptop.name', 'ar'),
  // ...
};
```

### Getting Locale from Request
```typescript
const locale = req.locale || 'en'; // 'en' or 'ar'
```

## ⚠️ Important Notes

1. **Database Migration**: The Prisma schema changes require a migration. Existing data will need to be migrated manually.

2. **API Responses**: When returning multilingual data, transform fields based on the request locale.

3. **Backward Compatibility**: Consider keeping old field names temporarily and using database views or computed fields.

4. **Testing**: Test all API endpoints with both `Accept-Language: en` and `Accept-Language: ar` headers.

5. **Seed Data**: Update seed file to populate both `_en` and `_ar` fields.

## 📝 Next Steps

1. Run the Prisma migration
2. Create data migration script to copy existing data
3. Update seed file
4. Test all endpoints with both locales
5. Update frontend to send `Accept-Language` header
6. Review and update any remaining hardcoded messages

