"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.t = t;
exports.getTranslation = getTranslation;
const translations = {
    en: {
        common: {
            success: 'Success',
            error: 'Error',
            notFound: 'Not found',
            unauthorized: 'Unauthorized',
            forbidden: 'Forbidden',
            badRequest: 'Bad request',
            serverError: 'Internal server error',
            created: 'Created successfully',
            updated: 'Updated successfully',
            deleted: 'Deleted successfully',
            saved: 'Saved successfully',
            loading: 'Loading...',
            noData: 'No data available',
        },
        auth: {
            loginSuccess: 'Login successful',
            loginFailed: 'Login failed',
            invalidCredentials: 'Invalid credentials',
            tokenExpired: 'Token expired',
            tokenInvalid: 'Invalid token',
            registrationSuccess: 'Registration successful',
            registrationFailed: 'Registration failed',
            emailExists: 'Email already exists',
            passwordTooShort: 'Password too short',
            emailPasswordRequired: 'Email and password are required',
            accountPending: 'Account pending verification. Please wait for administrator approval.',
            accessTokenRequired: 'Access token required',
            userNotFound: 'User not found',
            tokenValid: 'Token is valid',
            invalidUnverifiedToken: 'Invalid or unverified token',
            adminAccessRequired: 'Admin access required',
            userRoleUpdated: 'User role updated successfully',
            userVerificationUpdated: 'User verification status updated successfully',
            userCreated: 'User created successfully',
            firstNameLastNameEmailRequired: 'First name, last name, and email are required',
            userPlanRemoved: 'User plan removed successfully',
            userTrialStopped: 'User free trial stopped successfully',
        },
        products: {
            notFound: 'Product not found',
            created: 'Product created successfully',
            updated: 'Product updated successfully',
            deleted: 'Product deleted successfully',
            listRetrieved: 'Products retrieved successfully',
        },
        services: {
            notFound: 'Service not found',
            created: 'Service created successfully',
            updated: 'Service updated successfully',
            deleted: 'Service deleted successfully',
            listRetrieved: 'Services retrieved successfully',
        },
        departments: {
            notFound: 'Department not found',
            created: 'Department created successfully',
            updated: 'Department updated successfully',
            deleted: 'Department deleted successfully',
            listRetrieved: 'Departments retrieved successfully',
        },
        events: {
            notFound: 'Event not found',
            created: 'Event created successfully',
            updated: 'Event updated successfully',
            deleted: 'Event deleted successfully',
            listRetrieved: 'Events retrieved successfully',
        },
        news: {
            notFound: 'News not found',
            created: 'News created successfully',
            updated: 'News updated successfully',
            deleted: 'News deleted successfully',
            listRetrieved: 'News retrieved successfully',
        },
        courses: {
            notFound: 'Course not found',
            created: 'Course created successfully',
            updated: 'Course updated successfully',
            deleted: 'Course deleted successfully',
            listRetrieved: 'Courses retrieved successfully',
            lessonNotFound: 'Lesson not found',
        },
        users: {
            notFound: 'User not found',
            created: 'User created successfully',
            updated: 'User updated successfully',
            deleted: 'User deleted successfully',
            listRetrieved: 'Users retrieved successfully',
        },
    },
    ar: {
        common: {
            success: 'نجح',
            error: 'خطأ',
            notFound: 'غير موجود',
            unauthorized: 'غير مصرح',
            forbidden: 'ممنوع',
            badRequest: 'طلب غير صحيح',
            serverError: 'خطأ في الخادم',
            created: 'تم الإنشاء بنجاح',
            updated: 'تم التحديث بنجاح',
            deleted: 'تم الحذف بنجاح',
            saved: 'تم الحفظ بنجاح',
            loading: 'جاري التحميل...',
            noData: 'لا توجد بيانات',
        },
        auth: {
            loginSuccess: 'تم تسجيل الدخول بنجاح',
            loginFailed: 'فشل تسجيل الدخول',
            invalidCredentials: 'بيانات غير صحيحة',
            tokenExpired: 'انتهت صلاحية الرمز',
            tokenInvalid: 'رمز غير صحيح',
            registrationSuccess: 'تم التسجيل بنجاح',
            registrationFailed: 'فشل التسجيل',
            emailExists: 'البريد الإلكتروني موجود بالفعل',
            passwordTooShort: 'كلمة المرور قصيرة جداً',
            emailPasswordRequired: 'البريد الإلكتروني وكلمة المرور مطلوبان',
            accountPending: 'الحساب في انتظار التحقق. يرجى انتظار موافقة المسؤول.',
            accessTokenRequired: 'رمز الوصول مطلوب',
            userNotFound: 'المستخدم غير موجود',
            tokenValid: 'الرمز صالح',
            invalidUnverifiedToken: 'رمز غير صحيح أو غير مُتحقق منه',
            adminAccessRequired: 'الوصول الإداري مطلوب',
            userRoleUpdated: 'تم تحديث دور المستخدم بنجاح',
            userVerificationUpdated: 'تم تحديث حالة التحقق من المستخدم بنجاح',
            userCreated: 'تم إنشاء المستخدم بنجاح',
            firstNameLastNameEmailRequired: 'الاسم الأول واسم العائلة والبريد الإلكتروني مطلوبة',
            userPlanRemoved: 'تم إزالة خطة المستخدم بنجاح',
            userTrialStopped: 'تم إيقاف التجربة المجانية للمستخدم بنجاح',
        },
        products: {
            notFound: 'المنتج غير موجود',
            created: 'تم إنشاء المنتج بنجاح',
            updated: 'تم تحديث المنتج بنجاح',
            deleted: 'تم حذف المنتج بنجاح',
            listRetrieved: 'تم جلب المنتجات بنجاح',
        },
        services: {
            notFound: 'الخدمة غير موجودة',
            created: 'تم إنشاء الخدمة بنجاح',
            updated: 'تم تحديث الخدمة بنجاح',
            deleted: 'تم حذف الخدمة بنجاح',
            listRetrieved: 'تم جلب الخدمات بنجاح',
        },
        departments: {
            notFound: 'القسم غير موجود',
            created: 'تم إنشاء القسم بنجاح',
            updated: 'تم تحديث القسم بنجاح',
            deleted: 'تم حذف القسم بنجاح',
            listRetrieved: 'تم جلب الأقسام بنجاح',
        },
        events: {
            notFound: 'الفعالية غير موجودة',
            created: 'تم إنشاء الفعالية بنجاح',
            updated: 'تم تحديث الفعالية بنجاح',
            deleted: 'تم حذف الفعالية بنجاح',
            listRetrieved: 'تم جلب الفعاليات بنجاح',
        },
        news: {
            notFound: 'الخبر غير موجود',
            created: 'تم إنشاء الخبر بنجاح',
            updated: 'تم تحديث الخبر بنجاح',
            deleted: 'تم حذف الخبر بنجاح',
            listRetrieved: 'تم جلب الأخبار بنجاح',
        },
        courses: {
            notFound: 'الدورة غير موجودة',
            created: 'تم إنشاء الدورة بنجاح',
            updated: 'تم تحديث الدورة بنجاح',
            deleted: 'تم حذف الدورة بنجاح',
            listRetrieved: 'تم جلب الدورات بنجاح',
            lessonNotFound: 'الدرس غير موجود',
        },
        users: {
            notFound: 'المستخدم غير موجود',
            created: 'تم إنشاء المستخدم بنجاح',
            updated: 'تم تحديث المستخدم بنجاح',
            deleted: 'تم حذف المستخدم بنجاح',
            listRetrieved: 'تم جلب المستخدمين بنجاح',
        },
    },
};
function t(locale, key, params) {
    const keys = key.split('.');
    let value = translations[locale];
    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k];
        }
        else {
            value = translations.en;
            for (const k2 of keys) {
                if (value && typeof value === 'object' && k2 in value) {
                    value = value[k2];
                }
                else {
                    return key;
                }
            }
            break;
        }
    }
    if (typeof value !== 'string') {
        return key;
    }
    if (params) {
        return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
            return params[param] || match;
        });
    }
    return value;
}
function getTranslation(req) {
    const locale = req.locale || 'en';
    return (key, params) => t(locale, key, params);
}
//# sourceMappingURL=translations.js.map