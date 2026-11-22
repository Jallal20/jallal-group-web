import "server-only";

/**
 * Centralised environment access.
 *
 * Public values are safe to expose (they are required by the browser SDK for
 * read-only, permission-guarded access). `APPWRITE_API_KEY` and `ADMIN_EMAILS`
 * are server-only and must never be referenced from client components.
 */

const publicEnv = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "",
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "",
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "",
  inquiriesCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_INQUIRIES_COLLECTION_ID ?? "",
  companiesCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_COMPANIES_COLLECTION_ID ?? "",
  venturesCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_VENTURES_COLLECTION_ID ?? "",
  propertiesCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_PROPERTIES_COLLECTION_ID ?? "",
  propertyProjectsCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_PROPERTY_PROJECTS_COLLECTION_ID ?? "",
  coursesCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_COURSES_COLLECTION_ID ?? "",
  enrollmentsCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_ENROLLMENTS_COLLECTION_ID ?? "",
  courseApplicationsCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_COURSE_APPLICATIONS_COLLECTION_ID ?? "",
  elevateProjectsCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_ELEVATE_PROJECTS_COLLECTION_ID ?? "",
  techProjectsCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_TECH_PROJECTS_COLLECTION_ID ?? "",
  auditLogsCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_AUDIT_LOGS_COLLECTION_ID ?? "",
  siteSettingsCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_SITE_SETTINGS_COLLECTION_ID ?? "",
  adminProfilesCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_ADMIN_PROFILES_COLLECTION_ID ?? "",
  notificationsCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID ?? "",
  digitalVenturesCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_DIGITAL_VENTURES_COLLECTION_ID ?? "",
  courseCategoriesCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_COURSE_CATEGORIES_COLLECTION_ID ?? "",
  projectsCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_PROJECTS_COLLECTION_ID ?? "",
  // Training & Programs Management
  activitiesCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_ACTIVITIES_COLLECTION_ID ?? "",
  applicationFormsCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_APPLICATION_FORMS_COLLECTION_ID ?? "",
  formFieldsCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_FORM_FIELDS_COLLECTION_ID ?? "",
  applicationsCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_APPLICATIONS_COLLECTION_ID ?? "",
  studentsCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID ?? "",
  programEnrollmentsCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_PROGRAM_ENROLLMENTS_COLLECTION_ID ?? "",
  programAnnouncementsCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_PROGRAM_ANNOUNCEMENTS_COLLECTION_ID ?? "",
  learningMaterialsCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_LEARNING_MATERIALS_COLLECTION_ID ?? "",
  instructorsCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_INSTRUCTORS_COLLECTION_ID ?? "",
  programInstructorsCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_PROGRAM_INSTRUCTORS_COLLECTION_ID ?? "",
  studentProfilesCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_STUDENT_PROFILES_COLLECTION_ID ?? "",
  storageBucketId: process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID ?? "",
};

const serverEnv = {
  apiKey: process.env.APPWRITE_API_KEY ?? "",
  adminEmails: (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  rateLimitSecret: process.env.FORM_RATE_LIMIT_SECRET ?? "",
  bootstrapToken: process.env.ADMIN_BOOTSTRAP_TOKEN ?? "",
};

export const env = {
  ...publicEnv,
  ...serverEnv,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.jallalgroup.com",
  // Short aliases used by backend modules
  propertiesId: publicEnv.propertiesCollectionId,
  propertyProjectsId: publicEnv.propertyProjectsCollectionId,
  coursesId: publicEnv.coursesCollectionId,
  enrollmentsId: publicEnv.enrollmentsCollectionId,
  courseApplicationsId: publicEnv.courseApplicationsCollectionId,
  elevateProjectsId: publicEnv.elevateProjectsCollectionId,
  techProjectsId: publicEnv.techProjectsCollectionId,
  adminProfilesId: publicEnv.adminProfilesCollectionId,
  notificationsId: publicEnv.notificationsCollectionId,
  digitalVenturesId: publicEnv.digitalVenturesCollectionId,
  courseCategoriesId: publicEnv.courseCategoriesCollectionId,
  projectsId: publicEnv.projectsCollectionId,
  storageBucketId: publicEnv.storageBucketId,
  auditLogsId: publicEnv.auditLogsCollectionId,
  siteSettingsId: publicEnv.siteSettingsCollectionId,
  // Training & Programs Management short aliases
  activitiesId: publicEnv.activitiesCollectionId,
  applicationFormsId: publicEnv.applicationFormsCollectionId,
  formFieldsId: publicEnv.formFieldsCollectionId,
  applicationsId: publicEnv.applicationsCollectionId,
  studentsId: publicEnv.studentsCollectionId,
  programEnrollmentsId: publicEnv.programEnrollmentsCollectionId,
  programAnnouncementsId: publicEnv.programAnnouncementsCollectionId,
  learningMaterialsId: publicEnv.learningMaterialsCollectionId,
  instructorsId: publicEnv.instructorsCollectionId,
  programInstructorsId: publicEnv.programInstructorsCollectionId,
  studentProfilesId: publicEnv.studentProfilesCollectionId,
};

/** True when every value required for Appwrite-backed features is present. */
export function isAppwriteConfigured(): boolean {
  return Boolean(
    publicEnv.endpoint &&
      publicEnv.projectId &&
      publicEnv.databaseId &&
      publicEnv.inquiriesCollectionId &&
      serverEnv.apiKey,
  );
}

export function isContentStoreConfigured(): boolean {
  return Boolean(
    publicEnv.endpoint &&
      publicEnv.projectId &&
      publicEnv.databaseId &&
      publicEnv.companiesCollectionId &&
      publicEnv.venturesCollectionId &&
      serverEnv.apiKey,
  );
}

export type EnvStatus = {
  appwrite: boolean;
  content: boolean;
  missing: string[];
};

export function envStatus(): EnvStatus {
  const requiredForBackend: [string, string][] = [
    ["NEXT_PUBLIC_APPWRITE_ENDPOINT", publicEnv.endpoint],
    ["NEXT_PUBLIC_APPWRITE_PROJECT_ID", publicEnv.projectId],
    ["NEXT_PUBLIC_APPWRITE_DATABASE_ID", publicEnv.databaseId],
    ["NEXT_PUBLIC_APPWRITE_INQUIRIES_COLLECTION_ID", publicEnv.inquiriesCollectionId],
    ["APPWRITE_API_KEY", serverEnv.apiKey],
  ];

  const missing = requiredForBackend
    .filter(([, value]) => !value)
    .map(([key]) => key);

  return {
    appwrite: missing.length === 0,
    content: isContentStoreConfigured(),
    missing,
  };
}
