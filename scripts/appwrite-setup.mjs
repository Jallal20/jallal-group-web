#!/usr/bin/env node
/**
 * Provisions the Appwrite backend for jallal-group-web.
 *
 *   node scripts/appwrite-setup.mjs [--seed] [--admin-email you@x.com] [--admin-password secret]
 *
 * What it does (idempotent — safe to re-run):
 *   1. Creates the database and tables with columns and indexes. No public
 *      permissions are granted: the server API key is the only reader/writer.
 *   2. With --seed, copies structured records from src/content into content
 *      tables (skipped when rows already exist).
 *   3. Creates (or updates) an admin account carrying the `admin` label.
 *
 * Requires Appwrite environment variables — see .env.example.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  Client,
  TablesDB,
  Users,
  Storage,
  AppwriteException,
  ID,
  Query,
} from "node-appwrite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!match) continue;
    const [, key, raw] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = raw.replace(/^["']|["']$/g, "");
  }
}

loadEnvFile(resolve(root, ".env.local"));
loadEnvFile(resolve(root, ".env"));

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name, fallback = "") => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const env = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "",
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "",
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "jallal_group",
  inquiriesId:
    process.env.NEXT_PUBLIC_APPWRITE_INQUIRIES_COLLECTION_ID ?? "inquiries",
  companiesId:
    process.env.NEXT_PUBLIC_APPWRITE_COMPANIES_COLLECTION_ID ?? "companies",
  venturesId:
    process.env.NEXT_PUBLIC_APPWRITE_VENTURES_COLLECTION_ID ?? "ventures",
  propertiesId:
    process.env.NEXT_PUBLIC_APPWRITE_PROPERTIES_COLLECTION_ID ?? "properties",
  propertyProjectsId:
    process.env
      .NEXT_PUBLIC_APPWRITE_PROPERTY_PROJECTS_COLLECTION_ID ?? "property_projects",
  coursesId:
    process.env.NEXT_PUBLIC_APPWRITE_COURSES_COLLECTION_ID ?? "courses",
  enrollmentsId:
    process.env.NEXT_PUBLIC_APPWRITE_ENROLLMENTS_COLLECTION_ID ?? "enrollments",
  courseApplicationsId:
    process.env.NEXT_PUBLIC_APPWRITE_COURSE_APPLICATIONS_COLLECTION_ID ??
    "course_applications",
  elevateProjectsId:
    process.env
      .NEXT_PUBLIC_APPWRITE_ELEVATE_PROJECTS_COLLECTION_ID ??
    "elevate_projects",
  techProjectsId:
    process.env.NEXT_PUBLIC_APPWRITE_TECH_PROJECTS_COLLECTION_ID ??
    "tech_projects",
  courseCategoriesId:
    process.env.NEXT_PUBLIC_APPWRITE_COURSE_CATEGORIES_COLLECTION_ID ??
    "course_categories",
  storageBucketId:
    process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID ?? "jallal_media",
  auditLogsId:
    process.env.NEXT_PUBLIC_APPWRITE_AUDIT_LOGS_COLLECTION_ID ??
    "audit_logs",
  siteSettingsId:
    process.env.NEXT_PUBLIC_APPWRITE_SITE_SETTINGS_COLLECTION_ID ??
    "site_settings",
  adminProfilesId:
    process.env.NEXT_PUBLIC_APPWRITE_ADMIN_PROFILES_COLLECTION_ID ??
    "admin_profiles",
  notificationsId:
    process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID ??
    "notifications",
  digitalVenturesId:
    process.env.NEXT_PUBLIC_APPWRITE_DIGITAL_VENTURES_COLLECTION_ID ?? "digital_ventures",
  projectsId:
    process.env.NEXT_PUBLIC_APPWRITE_PROJECTS_COLLECTION_ID ?? "projects",
  // Training & Programs Management
  activitiesId:
    process.env.NEXT_PUBLIC_APPWRITE_ACTIVITIES_COLLECTION_ID ?? "activities",
  applicationFormsId:
    process.env.NEXT_PUBLIC_APPWRITE_APPLICATION_FORMS_COLLECTION_ID ??
    "application_forms",
  formFieldsId:
    process.env.NEXT_PUBLIC_APPWRITE_FORM_FIELDS_COLLECTION_ID ?? "form_fields",
  applicationsId:
    process.env.NEXT_PUBLIC_APPWRITE_APPLICATIONS_COLLECTION_ID ?? "applications",
  studentsId:
    process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID ?? "students",
  programEnrollmentsId:
    process.env.NEXT_PUBLIC_APPWRITE_PROGRAM_ENROLLMENTS_COLLECTION_ID ??
    "program_enrollments",
  programAnnouncementsId:
    process.env.NEXT_PUBLIC_APPWRITE_PROGRAM_ANNOUNCEMENTS_COLLECTION_ID ??
    "program_announcements",
  learningMaterialsId:
    process.env.NEXT_PUBLIC_APPWRITE_LEARNING_MATERIALS_COLLECTION_ID ??
    "learning_materials",
  instructorsId:
    process.env.NEXT_PUBLIC_APPWRITE_INSTRUCTORS_COLLECTION_ID ?? "instructors",
  programInstructorsId:
    process.env.NEXT_PUBLIC_APPWRITE_PROGRAM_INSTRUCTORS_COLLECTION_ID ??
    "program_instructors",
  studentProfilesId:
    process.env.NEXT_PUBLIC_APPWRITE_STUDENT_PROFILES_COLLECTION_ID ??
    "student_profiles",
  apiKey: process.env.APPWRITE_API_KEY ?? "",
  adminEmails: (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
};

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

if (!env.endpoint || !env.projectId || !env.apiKey) {
  fail(
    "Missing Appwrite configuration. Copy .env.example to .env.local and fill in " +
      "NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID and APPWRITE_API_KEY.",
  );
}

const client = new Client()
  .setEndpoint(env.endpoint)
  .setProject(env.projectId)
  .setKey(env.apiKey);

const db = new TablesDB(client);
const users = new Users(client);
const storage = new Storage(client);

/** Errors that mean "already exists" and should not stop the run. */
function isDuplicate(error) {
  return (
    error instanceof AppwriteException &&
    (error.code === 409 ||
      /already exists/i.test(error.message) ||
      /duplicate/i.test(error.message))
  );
}

async function ignoreExisting(promise, label) {
  try {
    return await promise;
  } catch (error) {
    if (isDuplicate(error)) {
      console.log(`  · ${label} already exists — reusing it`);
      return null;
    }
    throw error;
  }
}

// ── 1. Database ──────────────────────────────────────────────────────────────

async function ensureDatabase() {
  console.log(`\n→ Database: ${env.databaseId}`);
  // Check if the database already exists before attempting to create.
  try {
    const existing = await db.list();
    if (existing.databases.some((d) => d.$id === env.databaseId)) {
      console.log("  · already exists — reusing it");
      return;
    }
  } catch {
    // If we can't list databases, fall through to create and handle the error.
  }
  try {
    await db.create({ databaseId: env.databaseId, name: "Jallal Group" });
    console.log("  · created");
  } catch (error) {
    if (isDuplicate(error)) {
      console.log("  · already exists — reusing it");
      return;
    }
    throw error;
  }
}

// ── 2. Tables ────────────────────────────────────────────────────────────────

const INQUIRY_COLUMNS = [
  { key: "fullName", type: "string", size: 200, required: true },
  { key: "organization", type: "string", size: 200, required: true },
  { key: "email", type: "string", size: 320, required: true },
  { key: "phone", type: "string", size: 50, required: false, default: "" },
  { key: "partnershipType", type: "string", size: 120, required: true },
  { key: "message", type: "longtext", required: true },
  { key: "status", type: "string", size: 20, required: true },
  { key: "source", type: "string", size: 60, required: false, default: "" },
  { key: "ipHash", type: "string", size: 64, required: false, default: "" },
  { key: "userAgent", type: "string", size: 300, required: false, default: "" },
];

const CONTENT_COLUMNS = [
  { key: "slug", type: "string", size: 120, required: true },
  { key: "name", type: "string", size: 200, required: true },
  { key: "order", type: "integer", required: true },
  { key: "payload", type: "longtext", required: true },
];

const PROPERTY_COLUMNS = [
  { key: "title", type: "string", size: 200, required: true },
  { key: "slug", type: "string", size: 120, required: true },
  { key: "category", type: "string", size: 120, required: true },
  { key: "propertyType", type: "string", size: 120, required: true },
  { key: "description", type: "longtext", required: true },
  { key: "location", type: "string", size: 200, required: true },
  { key: "district", type: "string", size: 120, required: false, default: "" },
  { key: "community", type: "string", size: 120, required: false, default: "" },
  { key: "price", type: "integer", required: false, default: 0 },
  { key: "currency", type: "string", size: 20, required: false, default: "SLE" },
  { key: "size", type: "string", size: 120, required: false, default: "" },
  { key: "status", type: "string", size: 40, required: true },
  { key: "imageIds", type: "string", size: 1000, required: false, default: "[]" },
  { key: "videoUrl", type: "string", size: 500, required: false, default: "" },
  { key: "featured", type: "boolean", required: true },
  { key: "projectDesignation", type: "string", size: 200, required: false, default: "" },
  { key: "contactInfo", type: "string", size: 500, required: false, default: "" },
  { key: "published", type: "boolean", required: true },
];

const PROPERTY_PROJECT_COLUMNS = [
  { key: "name", type: "string", size: 200, required: true },
  { key: "slug", type: "string", size: 120, required: true },
  { key: "description", type: "longtext", required: true },
  { key: "location", type: "string", size: 200, required: true },
  { key: "category", type: "string", size: 120, required: true },
  { key: "status", type: "string", size: 40, required: true },
  { key: "imageIds", type: "string", size: 1000, required: false, default: "[]" },
  { key: "highlights", type: "string", size: 1000, required: false, default: "[]" },
  { key: "expectedLaunchDate", type: "datetime", required: false },
  { key: "published", type: "boolean", required: true },
];

const COURSE_COLUMNS = [
  { key: "name", type: "string", size: 200, required: true },
  { key: "code", type: "string", size: 60, required: true },
  { key: "slug", type: "string", size: 120, required: false, default: "" },
  { key: "category", type: "string", size: 120, required: true },
  { key: "description", type: "longtext", required: true },
  { key: "objectives", type: "longtext", required: false, default: "" },
  { key: "duration", type: "string", size: 120, required: true },
  { key: "fee", type: "integer", required: false, default: 0 },
  { key: "currency", type: "string", size: 20, required: false, default: "SLE" },
  { key: "requirements", type: "longtext", required: false, default: "" },
  { key: "imageId", type: "string", size: 200, required: false, default: "" },
  { key: "capacity", type: "integer", required: false, default: 0 },
  { key: "status", type: "string", size: 40, required: true },
  { key: "published", type: "boolean", required: true },
  { key: "deliveryMethod", type: "string", size: 40, required: false, default: "Physical" },
  { key: "location", type: "string", size: 300, required: false, default: "" },
  { key: "startDate", type: "datetime", required: false },
  { key: "endDate", type: "datetime", required: false },
  { key: "enrollmentOpensAt", type: "datetime", required: false },
  { key: "enrollmentClosesAt", type: "datetime", required: false },
  { key: "instructorName", type: "string", size: 200, required: false, default: "" },
  { key: "instructorBio", type: "longtext", required: false, default: "" },
  { key: "instructorEmail", type: "string", size: 320, required: false, default: "" },
  { key: "curriculum", type: "longtext", required: false, default: "[]" },
  { key: "paymentInstructions", type: "longtext", required: false, default: "" },
  { key: "paymentMethods", type: "longtext", required: false, default: "[]" },
  { key: "isFree", type: "boolean", required: true },
];

const ENROLLMENT_COLUMNS = [
  { key: "courseId", type: "string", size: 120, required: true },
  { key: "courseName", type: "string", size: 200, required: true },
  { key: "fullName", type: "string", size: 200, required: true },
  { key: "email", type: "string", size: 320, required: true },
  { key: "phone", type: "string", size: 50, required: true },
  { key: "whatsappNumber", type: "string", size: 50, required: false, default: "" },
  { key: "dateOfBirth", type: "datetime", required: false },
  { key: "gender", type: "string", size: 40, required: false, default: "" },
  { key: "address", type: "longtext", required: true },
  { key: "educationBackground", type: "longtext", required: true },
  { key: "relevantExperience", type: "longtext", required: false, default: "" },
  { key: "additionalInformation", type: "longtext", required: false, default: "" },
  { key: "status", type: "string", size: 40, required: true },
  { key: "adminNotes", type: "longtext", required: false, default: "" },
  { key: "reference", type: "string", size: 60, required: true },
];

const ELEVATE_PROJECT_COLUMNS = [
  { key: "name", type: "string", size: 200, required: true },
  { key: "slug", type: "string", size: 120, required: true },
  { key: "description", type: "longtext", required: true },
  { key: "objectives", type: "longtext", required: false, default: "" },
  { key: "category", type: "string", size: 120, required: true },
  { key: "imageIds", type: "string", size: 1000, required: false, default: "[]" },
  { key: "status", type: "string", size: 40, required: true },
  { key: "launchDate", type: "datetime", required: false },
  { key: "participationInfo", type: "longtext", required: false, default: "" },
  { key: "featured", type: "boolean", required: true },
  { key: "published", type: "boolean", required: true },
];

const TECH_PROJECT_COLUMNS = [
  { key: "name", type: "string", size: 200, required: true },
  { key: "slug", type: "string", size: 120, required: true },
  { key: "description", type: "longtext", required: true },
  { key: "category", type: "string", size: 120, required: true },
  { key: "imageIds", type: "string", size: 1000, required: false, default: "[]" },
  { key: "status", type: "string", size: 40, required: true },
  { key: "published", type: "boolean", required: true },
];

const AUDIT_LOG_COLUMNS = [
  { key: "adminId", type: "string", size: 120, required: true },
  { key: "adminEmail", type: "string", size: 320, required: true },
  { key: "action", type: "string", size: 120, required: true },
  { key: "module", type: "string", size: 120, required: true },
  { key: "recordId", type: "string", size: 120, required: false, default: "" },
  { key: "timestamp", type: "datetime", required: true },
  { key: "details", type: "longtext", required: false, default: "" },
];

const SITE_SETTINGS_COLUMNS = [
  { key: "key", type: "string", size: 120, required: true },
  { key: "value", type: "longtext", required: true },
  { key: "updatedBy", type: "string", size: 320, required: false, default: "" },
  { key: "updatedAt", type: "datetime", required: true },
];

const ADMIN_PROFILE_COLUMNS = [
  { key: "adminId", type: "string", size: 120, required: true },
  { key: "email", type: "string", size: 320, required: true },
  { key: "fullName", type: "string", size: 200, required: true },
  { key: "phone", type: "string", size: 50, required: false, default: "" },
  { key: "assignedCompany", type: "string", size: 200, required: false, default: "" },
  { key: "role", type: "string", size: 120, required: true },
  { key: "status", type: "string", size: 40, required: true },
  { key: "permissions", type: "string", size: 1000, required: false, default: "[]" },
  { key: "createdBy", type: "string", size: 120, required: true },
];

const NOTIFICATION_COLUMNS = [
  { key: "userId", type: "string", size: 120, required: true },
  { key: "title", type: "string", size: 200, required: true },
  { key: "message", type: "longtext", required: true },
  { key: "type", type: "string", size: 80, required: true },
  { key: "read", type: "boolean", required: true },
  { key: "link", type: "string", size: 500, required: false, default: "" },
  { key: "createdAt", type: "datetime", required: true },
];

const DIGITAL_VENTURE_COLUMNS = [
  { key: "name", type: "string", size: 200, required: true },
  { key: "slug", type: "string", size: 120, required: true },
  { key: "description", type: "longtext", required: true },
  { key: "category", type: "string", size: 120, required: true },
  { key: "status", type: "string", size: 40, required: true },
  { key: "imageIds", type: "string", size: 1000, required: false, default: "[]" },
  { key: "websiteUrl", type: "string", size: 500, required: false, default: "" },
  { key: "featured", type: "boolean", required: true },
  { key: "published", type: "boolean", required: true },
];

const PROJECTS_COLUMNS = [
  { key: "title", type: "string", size: 200, required: true },
  { key: "slug", type: "string", size: 120, required: true },
  { key: "type", type: "string", size: 40, required: true },
  { key: "category", type: "string", size: 120, required: true },
  { key: "status", type: "string", size: 60, required: true },
  { key: "companyId", type: "string", size: 120, required: false, default: "" },
  { key: "companyName", type: "string", size: 200, required: false, default: "" },
  { key: "description", type: "longtext", required: true },
  { key: "objectives", type: "longtext", required: false, default: "" },
  { key: "coverImageId", type: "string", size: 200, required: false, default: "" },
  { key: "eventDate", type: "datetime", required: false },
  { key: "endDate", type: "datetime", required: false },
  { key: "location", type: "string", size: 300, required: false, default: "" },
  { key: "online", type: "boolean", required: true },
  { key: "registrationUrl", type: "string", size: 500, required: false, default: "" },
  { key: "registrationOpenAt", type: "datetime", required: false },
  { key: "registrationCloseAt", type: "datetime", required: false },
  { key: "progress", type: "integer", required: false, default: 0 },
  { key: "featured", type: "boolean", required: true },
  { key: "displayOrder", type: "integer", required: true },
  { key: "published", type: "boolean", required: true },
  { key: "publishedAt", type: "datetime", required: false },
  { key: "activityId", type: "string", size: 120, required: false, default: "" },
  { key: "createdAt", type: "datetime", required: true },
  { key: "updatedAt", type: "datetime", required: true },
];

const COURSE_CATEGORY_COLUMNS = [
  { key: "name", type: "string", size: 200, required: true },
  { key: "slug", type: "string", size: 120, required: true },
  { key: "description", type: "string", size: 1000, required: false, default: "" },
  { key: "published", type: "boolean", required: true },
];

// ── Training & Programs Management tables ──────────────────────────────

const ACTIVITY_COLUMNS = [
  { key: "title", type: "string", size: 200, required: true },
  { key: "slug", type: "string", size: 120, required: true },
  { key: "category", type: "string", size: 120, required: true },
  { key: "description", type: "longtext", required: true },
  { key: "objectives", type: "longtext", required: false, default: "" },
  { key: "eligibility", type: "longtext", required: false, default: "" },
  { key: "venue", type: "string", size: 300, required: false, default: "" },
  { key: "venueType", type: "string", size: 40, required: false, default: "" },
  { key: "startDate", type: "datetime", required: false },
  { key: "endDate", type: "datetime", required: false },
  { key: "startTime", type: "string", size: 10, required: false, default: "" },
  { key: "endTime", type: "string", size: 10, required: false, default: "" },
  { key: "duration", type: "string", size: 120, required: false, default: "" },
  { key: "applicationOpensAt", type: "datetime", required: false },
  { key: "applicationDeadline", type: "datetime", required: false },
  { key: "totalSlots", type: "integer", required: false, default: 0 },
  { key: "fee", type: "integer", required: false, default: 0 },
  { key: "currency", type: "string", size: 20, required: false, default: "SLE" },
  { key: "isFree", type: "boolean", required: true },
  { key: "applicationsEnabled", type: "boolean", required: true },
  { key: "posterImageId", type: "string", size: 200, required: false, default: "" },
  { key: "imageIds", type: "string", size: 1000, required: false, default: "[]" },
  { key: "organizer", type: "string", size: 200, required: false, default: "" },
  { key: "status", type: "string", size: 40, required: true },
  { key: "publishAt", type: "datetime", required: false },
  { key: "published", type: "boolean", required: true },
];

const APPLICATION_FORM_COLUMNS = [
  { key: "activityId", type: "string", size: 120, required: true },
  { key: "activityTitle", type: "string", size: 200, required: false, default: "" },
  { key: "title", type: "string", size: 200, required: true },
  { key: "description", type: "longtext", required: false, default: "" },
  { key: "confirmationMessage", type: "longtext", required: false, default: "" },
  { key: "allowEditingAfterSubmit", type: "boolean", required: true },
  { key: "status", type: "string", size: 40, required: true },
  { key: "published", type: "boolean", required: true },
];

const FORM_FIELD_COLUMNS = [
  { key: "formId", type: "string", size: 120, required: true },
  { key: "fieldType", type: "string", size: 80, required: true },
  { key: "label", type: "string", size: 200, required: true },
  { key: "name", type: "string", size: 120, required: true },
  { key: "description", type: "string", size: 500, required: false, default: "" },
  { key: "required", type: "boolean", required: true },
  { key: "position", type: "integer", required: true },
  { key: "options", type: "string", size: 2000, required: false, default: "[]" },
  { key: "minLength", type: "integer", required: false },
  { key: "maxLength", type: "integer", required: false },
  { key: "acceptedFileTypes", type: "string", size: 500, required: false, default: "" },
  { key: "maxFileSizeMB", type: "integer", required: false },
  { key: "placeholder", type: "string", size: 200, required: false, default: "" },
];

const APPLICATION_COLUMNS = [
  { key: "activityId", type: "string", size: 120, required: true },
  { key: "activityTitle", type: "string", size: 200, required: false, default: "" },
  { key: "studentId", type: "string", size: 120, required: true },
  { key: "studentName", type: "string", size: 200, required: false, default: "" },
  { key: "studentEmail", type: "string", size: 320, required: false, default: "" },
  { key: "reference", type: "string", size: 60, required: true },
  { key: "formData", type: "longtext", required: false, default: "{}" },
  { key: "fileIds", type: "string", size: 2000, required: false, default: "[]" },
  { key: "status", type: "string", size: 40, required: true },
  { key: "adminNotes", type: "longtext", required: false, default: "" },
  { key: "reviewedBy", type: "string", size: 120, required: false, default: "" },
  { key: "reviewedAt", type: "datetime", required: false },
  { key: "decisionMessage", type: "longtext", required: false, default: "" },
];

const STUDENT_COLUMNS = [
  { key: "userId", type: "string", size: 120, required: true },
  { key: "studentId", type: "string", size: 40, required: true },
  { key: "email", type: "string", size: 320, required: true },
  { key: "fullName", type: "string", size: 200, required: true },
  { key: "phone", type: "string", size: 50, required: false, default: "" },
  { key: "dateOfBirth", type: "datetime", required: false },
  { key: "gender", type: "string", size: 40, required: false, default: "" },
  { key: "address", type: "string", size: 500, required: false, default: "" },
  { key: "institution", type: "string", size: 200, required: false, default: "" },
  { key: "educationalLevel", type: "string", size: 120, required: false, default: "" },
  { key: "courseOfStudy", type: "string", size: 200, required: false, default: "" },
  { key: "status", type: "string", size: 40, required: true },
  { key: "emailVerified", type: "boolean", required: true },
  { key: "emailVerifiedAt", type: "datetime", required: false },
];

const PROGRAM_ENROLLMENT_COLUMNS = [
  { key: "studentId", type: "string", size: 120, required: true },
  { key: "studentName", type: "string", size: 200, required: false, default: "" },
  { key: "studentEmail", type: "string", size: 320, required: false, default: "" },
  { key: "activityId", type: "string", size: 120, required: true },
  { key: "activityTitle", type: "string", size: 200, required: false, default: "" },
  { key: "applicationId", type: "string", size: 120, required: false, default: "" },
  { key: "schedule", type: "string", size: 500, required: false, default: "" },
  { key: "instructor", type: "string", size: 200, required: false, default: "" },
  { key: "notes", type: "longtext", required: false, default: "" },
  { key: "status", type: "string", size: 40, required: true },
  { key: "enrolledAt", type: "datetime", required: false },
];

const PROGRAM_ANNOUNCEMENT_COLUMNS = [
  { key: "activityId", type: "string", size: 120, required: false },
  { key: "activityTitle", type: "string", size: 200, required: false, default: "" },
  { key: "audience", type: "string", size: 80, required: true },
  { key: "targetStudentIds", type: "string", size: 2000, required: false, default: "[]" },
  { key: "title", type: "string", size: 200, required: true },
  { key: "message", type: "longtext", required: true },
  { key: "fileId", type: "string", size: 200, required: false, default: "" },
  { key: "fileName", type: "string", size: 200, required: false, default: "" },
  { key: "publishAt", type: "datetime", required: false },
  { key: "published", type: "boolean", required: true },
  { key: "createdBy", type: "string", size: 120, required: false, default: "" },
];

const LEARNING_MATERIAL_COLUMNS = [
  { key: "activityId", type: "string", size: 120, required: true },
  { key: "activityTitle", type: "string", size: 200, required: false, default: "" },
  { key: "title", type: "string", size: 200, required: true },
  { key: "description", type: "string", size: 500, required: false, default: "" },
  { key: "materialType", type: "string", size: 60, required: true },
  { key: "fileId", type: "string", size: 200, required: false, default: "" },
  { key: "fileName", type: "string", size: 200, required: false, default: "" },
  { key: "url", type: "string", size: 500, required: false, default: "" },
  { key: "published", type: "boolean", required: true },
  { key: "uploadedBy", type: "string", size: 120, required: false, default: "" },
];

const INSTRUCTOR_COLUMNS = [
  { key: "userId", type: "string", size: 120, required: false, default: "" },
  { key: "fullName", type: "string", size: 200, required: true },
  { key: "email", type: "string", size: 320, required: false, default: "" },
  { key: "phone", type: "string", size: 50, required: false, default: "" },
  { key: "bio", type: "longtext", required: false, default: "" },
  { key: "expertise", type: "string", size: 300, required: false, default: "" },
  { key: "status", type: "string", size: 40, required: true },
];

const PROGRAM_INSTRUCTOR_COLUMNS = [
  { key: "activityId", type: "string", size: 120, required: true },
  { key: "activityTitle", type: "string", size: 200, required: false, default: "" },
  { key: "instructorId", type: "string", size: 120, required: true },
  { key: "instructorName", type: "string", size: 200, required: false, default: "" },
  { key: "role", type: "string", size: 120, required: false, default: "Instructor"},
];

const STUDENT_PROFILE_COLUMNS = [
  { key: "studentId", type: "string", size: 120, required: true },
  { key: "avatarId", type: "string", size: 200, required: false, default: "" },
  { key: "bio", type: "longtext", required: false, default: "" },
  { key: "skills", type: "string", size: 1000, required: false, default: "[]" },
  { key: "updatedAt", type: "datetime", required: false },
];

async function ensureTable(tableId, name, columns, indexes) {
  console.log(`\n→ Table: ${tableId}`);

  // Check whether the table already exists (from a previous run).
  let tableExists = false;
  try {
    await db.getTable({ databaseId: env.databaseId, tableId });
    tableExists = true;
    console.log("  · table already exists — reusing it");
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) {
      tableExists = false;
    } else if (!isDuplicate(error)) {
      throw error;
    } else {
      tableExists = true;
    }
  }

  if (!tableExists) {
    try {
      await db.createTable({
        databaseId: env.databaseId,
        tableId,
        name,
        permissions: [],
        rowSecurity: true,
        enabled: true,
        columns,
      });
      console.log("  · created");
      tableExists = true;
    } catch (error) {
      if (isDuplicate(error)) {
        console.log("  · already exists — reusing it");
        tableExists = true;
      } else {
        throw error;
      }
    }
  }

  if (tableExists) {
    // Inspect existing columns so we only create indexes whose columns exist.
    let existingColumnKeys = [];
    try {
      const existing = await db.getTable({
        databaseId: env.databaseId,
        tableId,
      });
      existingColumnKeys = (existing.columns ?? []).map((c) => c.key);
    } catch (error) {
      if (!isDuplicate(error)) throw error;
    }
    const existingColumnSet = new Set(existingColumnKeys);

    // Add any columns that are missing from an existing table (additive only).
    for (const column of columns) {
      if (existingColumnSet.has(column.key)) continue;
      try {
        await db.createColumn({
          databaseId: env.databaseId,
          tableId,
          key: column.key,
          type: column.type,
          size: column.size,
          required: column.required,
          default: column.default ?? null,
        });
        console.log(`  · added column ${column.key} to ${tableId}`);
      } catch (error) {
        if (isDuplicate(error)) {
          console.log(`  · column ${column.key} already exists on ${tableId}`);
        } else {
          console.warn(`  · could not add column ${column.key}: ${error.message}`);
        }
      }
    }

    for (const index of indexes) {
      const missing = index.attributes.filter((attr) => !existingColumnSet.has(attr));
      if (missing.length > 0) {
        console.log(
          `  · index ${index.key} skipped (column(s) not present on table: ${missing.join(", ")})`,
        );
        continue;
      }
      await ignoreExisting(
        db.createIndex({
          databaseId: env.databaseId,
          tableId,
          key: index.key,
          type: index.type,
          columns: index.attributes,
        }),
        `index ${index.key}`,
      );
    }
  }
}

// ── 3. Seed content ──────────────────────────────────────────────────────────

async function rowCount(tableId) {
  try {
    const result = await db.listRows({
      databaseId: env.databaseId,
      tableId,
      queries: [],
      total: true,
    });
    return result.total ?? 0;
  } catch {
    return 0;
  }
}

async function seedTable(tableId, records) {
  const existing = await rowCount(tableId);
  if (existing > 0) {
    console.log(
      `  · ${existing} row(s) already present in ${tableId} — skipping seed (delete rows first to re-seed)`,
    );
    return;
  }

  let seeded = 0;
  for (const [index, record] of records.entries()) {
    await db.createRow({
      databaseId: env.databaseId,
      tableId,
      rowId: ID.unique(),
      data: {
        slug: record.slug,
        name: record.name,
        order: index + 1,
        payload: JSON.stringify(record),
      },
    });
    seeded += 1;
  }
  console.log(`  · seeded ${seeded} row(s) into ${tableId}`);
}

async function seedContent() {
  console.log("\n→ Seeding content from src/content");

  const { companies } = await import(
    new URL("../src/content/companies.ts", import.meta.url).href
  );
  const { ventures } = await import(
    new URL("../src/content/ventures.ts", import.meta.url).href
  );

  await seedTable(env.companiesId, companies);
  await seedTable(env.venturesId, ventures);
}

// ── 4. Admin account ─────────────────────────────────────────────────────────

async function ensureAdmin() {
  const email = option("--admin-email", env.adminEmails[0] ?? "");
  const password = option("--admin-password", process.env.ADMIN_PASSWORD ?? "");

  if (!email) {
    console.log(
      "\n→ Admin account skipped: pass --admin-email (or set ADMIN_EMAILS) to create one.",
    );
    return;
  }

  console.log(`\n→ Admin account: ${email}`);

  let userId = null;
  try {
    const list = await users.list({
      queries: [Query.equal("email", email)],
      total: false,
    });
    userId = list.users[0]?.$id ?? null;
  } catch (error) {
    console.warn(`  · user lookup failed: ${error.message}`);
  }

  if (!userId) {
    if (!password) {
      console.log(
        "  · account does not exist and no password was provided — re-run with --admin-password <secret>",
      );
      return;
    }
    try {
      const user = await users.create({
        userId: ID.unique(),
        email,
        password,
        name: "Jallal Group Admin",
      });
      userId = user.$id;
      console.log("  · account created");
    } catch (error) {
      if (isDuplicate(error)) {
        console.log("  · account already exists");
      } else {
        throw error;
      }
    }
  }

  if (userId) {
    await ignoreExisting(
      users.updateLabels({ userId, labels: ["admin"] }),
      "admin label",
    );
    if (password) {
      try {
        await users.updatePassword({ userId, password });
        console.log("  · password updated");
      } catch (error) {
        console.warn(`  · password update skipped: ${error.message}`);
      }
    }
    console.log("  · admin label applied");
  }
}

// ── Run ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Appwrite: ${env.endpoint} (project ${env.projectId})`);

  await ensureDatabase();

  // ── Storage bucket (media library) ───────────────────────────────
  console.log(`\n→ Storage bucket: ${env.storageBucketId}`);
  try {
    const existing = await storage.listBuckets();
    if (existing.buckets.some((b) => b.$id === env.storageBucketId)) {
      console.log("  · already exists — reusing it");
    } else {
      await storage.createBucket({
        bucketId: env.storageBucketId,
        name: "Jallal Group Media",
        enabled: true,
        permissions: [],
        fileSecurity: false,
        minimumFileSize: 0,
        maximumFileSize: 47 * 1024 * 1024, // ~47 MB (Appwrite limit: 50,000,000 bytes)
        allowedFileExtensions: [
          "jpg",
          "jpeg",
          "png",
          "gif",
          "webp",
          "svg",
          "mp4",
          "mov",
          "avi",
          "webm",
          "pdf",
        ],
      });
      console.log("  · created");
    }
  } catch (error) {
    if (isDuplicate(error)) {
      console.log("  · already exists — reusing it");
    } else {
      throw error;
    }
  }

  await ensureTable(env.inquiriesId, "Partnership inquiries", INQUIRY_COLUMNS, [
    { key: "by_email", type: "key", attributes: ["email"] },
    { key: "by_status", type: "key", attributes: ["status"] },
    { key: "by_type", type: "key", attributes: ["partnershipType"] },
  ]);

  await ensureTable(env.companiesId, "Companies", CONTENT_COLUMNS, [
    { key: "by_slug", type: "key", attributes: ["slug"] },
    { key: "by_order", type: "key", attributes: ["order"] },
  ]);

  await ensureTable(env.venturesId, "Digital ventures", CONTENT_COLUMNS, [
    { key: "by_slug", type: "key", attributes: ["slug"] },
    { key: "by_order", type: "key", attributes: ["order"] },
  ]);

  await ensureTable(env.propertiesId, "Properties", PROPERTY_COLUMNS, [
    { key: "by_slug", type: "key", attributes: ["slug"] },
    { key: "by_status", type: "key", attributes: ["status"] },
    { key: "by_category", type: "key", attributes: ["category"] },
    { key: "by_published", type: "key", attributes: ["published"] },
  ]);

  await ensureTable(
    env.propertyProjectsId,
    "Property projects",
    PROPERTY_PROJECT_COLUMNS,
    [
      { key: "by_slug", type: "key", attributes: ["slug"] },
      { key: "by_status", type: "key", attributes: ["status"] },
      { key: "by_category", type: "key", attributes: ["category"] },
      { key: "by_published", type: "key", attributes: ["published"] },
    ],
  );

  await ensureTable(env.coursesId, "Courses", COURSE_COLUMNS, [
    { key: "by_slug", type: "key", attributes: ["slug"] },
    { key: "by_status", type: "key", attributes: ["status"] },
    { key: "by_category", type: "key", attributes: ["category"] },
    { key: "by_published", type: "key", attributes: ["published"] },
  ]);

  // ── Course enrollment system tables ──────────────────────────────────────

  const COURSE_APPLICATION_COLUMNS = [
    { key: "courseId", type: "string", size: 120, required: true },
    { key: "courseName", type: "string", size: 200, required: false, default: "" },
    { key: "courseSlug", type: "string", size: 120, required: false, default: "" },
    { key: "studentId", type: "string", size: 120, required: false, default: "" },
    { key: "studentUserId", type: "string", size: 120, required: false, default: "" },
    { key: "fullName", type: "string", size: 200, required: true },
    { key: "email", type: "string", size: 320, required: true },
    { key: "phone", type: "string", size: 50, required: true },
    { key: "whatsappNumber", type: "string", size: 50, required: false, default: "" },
    { key: "country", type: "string", size: 120, required: false, default: "" },
    { key: "district", type: "string", size: 120, required: false, default: "" },
    { key: "address", type: "longtext", required: true },
    { key: "dateOfBirth", type: "datetime", required: false },
    { key: "gender", type: "string", size: 40, required: false, default: "" },
    { key: "highestQualification", type: "string", size: 200, required: false, default: "" },
    { key: "institution", type: "string", size: 200, required: false, default: "" },
    { key: "occupation", type: "string", size: 200, required: false, default: "" },
    { key: "relevantExperience", type: "longtext", required: false, default: "" },
    { key: "deliveryPreference", type: "string", size: 40, required: false, default: "" },
    { key: "courseFee", type: "integer", required: false, default: 0 },
    { key: "currency", type: "string", size: 20, required: false, default: "SLE" },
    { key: "enrollmentDate", type: "datetime", required: false },
    { key: "whyJoin", type: "longtext", required: false, default: "" },
    { key: "relevantSkills", type: "longtext", required: false, default: "" },
    { key: "additionalInformation", type: "longtext", required: false, default: "" },
    { key: "reference", type: "string", size: 60, required: true },
    { key: "status", type: "string", size: 40, required: true },
    { key: "paymentStatus", type: "string", size: 40, required: false, default: "none" },
    { key: "receiptFileId", type: "string", size: 200, required: false, default: "" },
    { key: "receiptFileName", type: "string", size: 300, required: false, default: "" },
    { key: "adminNotes", type: "longtext", required: false, default: "" },
    { key: "createdAt", type: "datetime", required: true },
    { key: "updatedAt", type: "datetime", required: true },
  ];

  await ensureTable(env.courseApplicationsId ?? "course_applications", "Course Applications", COURSE_APPLICATION_COLUMNS, [
    { key: "by_course", type: "key", attributes: ["courseId"] },
    { key: "by_status", type: "key", attributes: ["status"] },
    { key: "by_payment_status", type: "key", attributes: ["paymentStatus"] },
    { key: "by_email", type: "key", attributes: ["email"] },
    { key: "by_reference", type: "key", attributes: ["reference"] },
    { key: "by_student", type: "key", attributes: ["studentId"] },
    { key: "by_created", type: "key", attributes: ["createdAt"] },
  ]);

  const COURSE_APPLICATION_STATUS_HISTORY_COLUMNS = [
    { key: "applicationId", type: "string", size: 120, required: true },
    { key: "status", type: "string", size: 40, required: true },
    { key: "changedBy", type: "string", size: 120, required: false, default: "" },
    { key: "changedByEmail", type: "string", size: 320, required: false, default: "" },
    { key: "changedByRole", type: "string", size: 120, required: false, default: "" },
    { key: "changedAt", type: "datetime", required: true },
    { key: "notes", type: "longtext", required: false, default: "" },
  ];

  await ensureTable("course_application_status_history", "Application Status History", COURSE_APPLICATION_STATUS_HISTORY_COLUMNS, [
    { key: "by_application", type: "key", attributes: ["applicationId"] },
    { key: "by_changed_at", type: "key", attributes: ["changedAt"] },
  ]);

  const COURSE_PAYMENT_COLUMNS = [
    { key: "applicationId", type: "string", size: 120, required: true },
    { key: "courseId", type: "string", size: 120, required: true },
    { key: "courseName", type: "string", size: 200, required: false, default: "" },
    { key: "studentEmail", type: "string", size: 320, required: false, default: "" },
    { key: "amount", type: "integer", required: false, default: 0 },
    { key: "currency", type: "string", size: 20, required: false, default: "SLE" },
    { key: "paymentMethod", type: "string", size: 120, required: false, default: "" },
    { key: "transactionReference", type: "string", size: 200, required: false, default: "" },
    { key: "paymentDate", type: "datetime", required: false },
    { key: "receiptFileId", type: "string", size: 200, required: false, default: "" },
    { key: "receiptFileName", type: "string", size: 300, required: false, default: "" },
    { key: "status", type: "string", size: 40, required: true },
    { key: "rejectionReason", type: "longtext", required: false, default: "" },
    { key: "verifiedBy", type: "string", size: 120, required: false, default: "" },
    { key: "verifiedByEmail", type: "string", size: 320, required: false, default: "" },
    { key: "verifiedAt", type: "datetime", required: false },
    { key: "createdAt", type: "datetime", required: true },
    { key: "updatedAt", type: "datetime", required: true },
  ];

  await ensureTable("course_payments", "Course Payments", COURSE_PAYMENT_COLUMNS, [
    { key: "by_application", type: "key", attributes: ["applicationId"] },
    { key: "by_course", type: "key", attributes: ["courseId"] },
    { key: "by_status", type: "key", attributes: ["status"] },
    { key: "by_created", type: "key", attributes: ["createdAt"] },
  ]);

  const COURSE_FORM_FIELD_COLUMNS = [
    { key: "courseId", type: "string", size: 120, required: true },
    { key: "fieldType", type: "string", size: 80, required: true },
    { key: "label", type: "string", size: 200, required: true },
    { key: "name", type: "string", size: 120, required: true },
    { key: "description", type: "string", size: 500, required: false, default: "" },
    { key: "required", type: "boolean", required: true },
    { key: "position", type: "integer", required: true },
    { key: "options", type: "longtext", required: false, default: "[]" },
    { key: "placeholder", type: "string", size: 200, required: false, default: "" },
  ];

  await ensureTable("course_form_fields", "Course Form Fields", COURSE_FORM_FIELD_COLUMNS, [
    { key: "by_course", type: "key", attributes: ["courseId"] },
  ]);

  await ensureTable(env.enrollmentsId, "Enrollments", ENROLLMENT_COLUMNS, [
    { key: "by_course", type: "key", attributes: ["courseId"] },
    { key: "by_status", type: "key", attributes: ["status"] },
    { key: "by_email", type: "key", attributes: ["email"] },
    { key: "by_reference", type: "key", attributes: ["reference"] },
  ]);

  await ensureTable(env.elevateProjectsId, "Elevate 360 projects", ELEVATE_PROJECT_COLUMNS, [
    { key: "by_slug", type: "key", attributes: ["slug"] },
    { key: "by_status", type: "key", attributes: ["status"] },
    { key: "by_category", type: "key", attributes: ["category"] },
    { key: "by_published", type: "key", attributes: ["published"] },
  ]);

  await ensureTable(env.techProjectsId, "Jallal Tech projects", TECH_PROJECT_COLUMNS, [
    { key: "by_slug", type: "key", attributes: ["slug"] },
    { key: "by_status", type: "key", attributes: ["status"] },
    { key: "by_published", type: "key", attributes: ["published"] },
  ]);

  await ensureTable(env.auditLogsId, "Audit logs", AUDIT_LOG_COLUMNS, [
    { key: "by_admin", type: "key", attributes: ["adminId"] },
    { key: "by_module", type: "key", attributes: ["module"] },
    { key: "by_action", type: "key", attributes: ["action"] },
    { key: "by_timestamp", type: "key", attributes: ["timestamp"] },
  ]);

  await ensureTable(env.siteSettingsId, "Site settings", SITE_SETTINGS_COLUMNS, [
    { key: "by_key", type: "key", attributes: ["key"] },
  ]);

  await ensureTable(env.adminProfilesId, "Admin profiles", ADMIN_PROFILE_COLUMNS, [
    { key: "by_email", type: "key", attributes: ["email"] },
    { key: "by_role", type: "key", attributes: ["role"] },
    { key: "by_status", type: "key", attributes: ["status"] },
  ]);

  await ensureTable(env.notificationsId, "Notifications", NOTIFICATION_COLUMNS, [
    { key: "by_user", type: "key", attributes: ["userId"] },
    { key: "by_read", type: "key", attributes: ["read"] },
    { key: "by_created", type: "key", attributes: ["createdAt"] },
  ]);

  await ensureTable(env.digitalVenturesId, "Digital ventures", DIGITAL_VENTURE_COLUMNS, [
    { key: "by_slug", type: "key", attributes: ["slug"] },
    { key: "by_status", type: "key", attributes: ["status"] },
    { key: "by_category", type: "key", attributes: ["category"] },
    { key: "by_published", type: "key", attributes: ["published"] },
  ]);

  await ensureTable(env.projectsId, "Projects", PROJECTS_COLUMNS, [
    { key: "by_slug", type: "key", attributes: ["slug"] },
    { key: "by_status", type: "key", attributes: ["status"] },
    { key: "by_type", type: "key", attributes: ["type"] },
    { key: "by_published", type: "key", attributes: ["published"] },
    { key: "by_featured", type: "key", attributes: ["featured"] },
    { key: "by_display_order", type: "key", attributes: ["displayOrder"] },
    { key: "by_event_date", type: "key", attributes: ["eventDate"] },
  ]);

  await ensureTable(env.courseCategoriesId, "Course categories", COURSE_CATEGORY_COLUMNS, [
    { key: "by_slug", type: "key", attributes: ["slug"] },
    { key: "by_published", type: "key", attributes: ["published"] },
  ]);

  // ── Training & Programs Management tables ────────────────────────────

  await ensureTable(env.activitiesId, "Activities", ACTIVITY_COLUMNS, [
    { key: "by_slug", type: "key", attributes: ["slug"] },
    { key: "by_status", type: "key", attributes: ["status"] },
    { key: "by_category", type: "key", attributes: ["category"] },
    { key: "by_published", type: "key", attributes: ["published"] },
    { key: "by_deadline", type: "key", attributes: ["applicationDeadline"] },
  ]);

  await ensureTable(env.applicationFormsId, "Application forms", APPLICATION_FORM_COLUMNS, [
    { key: "by_activity", type: "key", attributes: ["activityId"] },
    { key: "by_status", type: "key", attributes: ["status"] },
    { key: "by_published", type: "key", attributes: ["published"] },
  ]);

  await ensureTable(env.formFieldsId, "Form fields", FORM_FIELD_COLUMNS, [
    { key: "by_form", type: "key", attributes: ["formId"] },
  ]);

  await ensureTable(env.applicationsId, "Applications", APPLICATION_COLUMNS, [
    { key: "by_activity", type: "key", attributes: ["activityId"] },
    { key: "by_student", type: "key", attributes: ["studentId"] },
    { key: "by_status", type: "key", attributes: ["status"] },
    { key: "by_reference", type: "key", attributes: ["reference"] },
    { key: "by_email", type: "key", attributes: ["studentEmail"] },
  ]);

  await ensureTable(env.studentsId, "Students", STUDENT_COLUMNS, [
    { key: "by_user", type: "key", attributes: ["userId"] },
    { key: "by_student_id", type: "key", attributes: ["studentId"] },
    { key: "by_email", type: "key", attributes: ["email"] },
    { key: "by_status", type: "key", attributes: ["status"] },
  ]);

  await ensureTable(env.programEnrollmentsId, "Program enrollments", PROGRAM_ENROLLMENT_COLUMNS, [
    { key: "by_student", type: "key", attributes: ["studentId"] },
    { key: "by_activity", type: "key", attributes: ["activityId"] },
    { key: "by_status", type: "key", attributes: ["status"] },
  ]);

  await ensureTable(env.programAnnouncementsId, "Program announcements", PROGRAM_ANNOUNCEMENT_COLUMNS, [
    { key: "by_activity", type: "key", attributes: ["activityId"] },
    { key: "by_audience", type: "key", attributes: ["audience"] },
    { key: "by_published", type: "key", attributes: ["published"] },
  ]);

  await ensureTable(env.learningMaterialsId, "Learning materials", LEARNING_MATERIAL_COLUMNS, [
    { key: "by_activity", type: "key", attributes: ["activityId"] },
    { key: "by_published", type: "key", attributes: ["published"] },
  ]);

  await ensureTable(env.instructorsId, "Instructors", INSTRUCTOR_COLUMNS, [
    { key: "by_status", type: "key", attributes: ["status"] },
  ]);

  await ensureTable(env.programInstructorsId, "Program instructors", PROGRAM_INSTRUCTOR_COLUMNS, [
    { key: "by_activity", type: "key", attributes: ["activityId"] },
  ]);

  await ensureTable(env.studentProfilesId, "Student profiles", STUDENT_PROFILE_COLUMNS, [
    { key: "by_student", type: "key", attributes: ["studentId"] },
  ]);

  if (flag("--seed")) {
    await seedContent();
  } else {
    console.log("\n→ Content seeding skipped (run with --seed to import src/content).");
  }

  await ensureAdmin();

  console.log("\n✔ Provisioning complete.");
  console.log("\nNext steps:");
  console.log("  1. Make sure .env.local carries these IDs:");
  console.log(`       NEXT_PUBLIC_APPWRITE_DATABASE_ID=${env.databaseId}`);
  console.log(`       NEXT_PUBLIC_APPWRITE_INQUIRIES_COLLECTION_ID=${env.inquiriesId}`);
  console.log(`       NEXT_PUBLIC_APPWRITE_COMPANIES_COLLECTION_ID=${env.companiesId}`);
  console.log(`       NEXT_PUBLIC_APPWRITE_VENTURES_COLLECTION_ID=${env.venturesId}`);
  console.log(`       NEXT_PUBLIC_APPWRITE_PROPERTIES_COLLECTION_ID=${env.propertiesId}`);
  console.log(`       NEXT_PUBLIC_APPWRITE_PROPERTY_PROJECTS_COLLECTION_ID=${env.propertyProjectsId}`);
  console.log(`       NEXT_PUBLIC_APPWRITE_COURSES_COLLECTION_ID=${env.coursesId}`);
  console.log(`       NEXT_PUBLIC_APPWRITE_ENROLLMENTS_COLLECTION_ID=${env.enrollmentsId}`);
  console.log(`       NEXT_PUBLIC_APPWRITE_ELEVATE_PROJECTS_COLLECTION_ID=${env.elevateProjectsId}`);
  console.log(`       NEXT_PUBLIC_APPWRITE_TECH_PROJECTS_COLLECTION_ID=${env.techProjectsId}`);
  console.log(`       NEXT_PUBLIC_APPWRITE_AUDIT_LOGS_COLLECTION_ID=${env.auditLogsId}`);
  console.log(`       NEXT_PUBLIC_APPWRITE_SITE_SETTINGS_COLLECTION_ID=${env.siteSettingsId}`);
  console.log(
    "  2. Verify the API key has documents/tables/databases/users read+write scopes.",
  );
  console.log(
    "  3. Provision Training & Programs tables by running:",
    "     node scripts/appwrite-setup.mjs",
  );
  console.log(
    "     (tables: activities, application_forms, form_fields, applications, students, " +
      "program_enrollments, program_announcements, learning_materials, instructors, " +
      "program_instructors, student_profiles)",
  );
  console.log("  4. npm run dev → http://localhost:3000/admin/login");
}

main().catch((error) => {
  fail(
    error instanceof AppwriteException
      ? `Appwrite error ${error.code}: ${error.message}`
      : (error?.stack ?? String(error)),
  );
});
