export type IconName =
  | "shield-check"
  | "terminal"
  | "globe"
  | "server"
  | "cloud"
  | "database"
  | "lock"
  | "trending-up"
  | "store"
  | "badge-check"
  | "bot"
  | "graduation-cap"
  | "code"
  | "palette"
  | "chart"
  | "building"
  | "briefcase"
  | "map"
  | "handshake"
  | "users"
  | "landmark"
  | "rocket"
  | "wallet"
  | "bus"
  | "home"
  | "activity"
  | "leaf"
  | "sun"
  | "arrow-right"
  | "check"
  | "mail"
  | "phone"
  | "map-pin"
  | "clock"
  | "quote"
  | "layers"
  | "network"
  | "compass"
  | "file-check"
  | "search"
  | "key"
  | "zap";

export interface Metric {
  value: string;
  label: string;
}

export interface Capability {
  icon: IconName;
  title: string;
  description: string;
}

export interface Company {
  slug: string;
  index: string;
  name: string;
  shortName: string;
  category: string;
  tagline: string;
  established: string;
  description: string;
  mandate: string;
  image: string;
  imageAlt: string;
  capabilities: Capability[];
  metrics: Metric[];
}

export type VentureStatus =
  | "In development"
  | "Prototyping"
  | "Architecture"
  | "Research";

export interface Venture {
  slug: string;
  index: string;
  name: string;
  category: string;
  status: VentureStatus;
  tagline: string;
  description: string;
  capabilities: Capability[];
  meta: { label: string; value: string };
  image: string;
  imageAlt: string;
  featured: boolean;
}

// ── Projects & Upcoming Events homepage showcase types ────────────────────

export type ShowcaseStatus =
  | "Upcoming"
  | "Planning"
  | "In Development"
  | "Ongoing"
  | "Registration Open"
  | "Registration Closed"
  | "Completed"
  | "Postponed"
  | "Cancelled";

export type ShowcaseContentType = "project" | "event";

export const SHOWCASE_STATUSES: ShowcaseStatus[] = [
  "Upcoming",
  "Planning",
  "In Development",
  "Ongoing",
  "Registration Open",
  "Registration Closed",
  "Completed",
  "Postponed",
  "Cancelled",
];

export const SHOWCASE_CONTENT_TYPES: ShowcaseContentType[] = [
  "project",
  "event",
];

export interface ShowcaseItem {
  id: string;
  title: string;
  slug: string;
  type: ShowcaseContentType;
  category: string;
  status: ShowcaseStatus;
  companyId: string;
  companyName: string;
  description: string;
  objectives: string;
  coverImageId: string;
  eventDate: string | null;
  endDate: string | null;
  location: string;
  online: boolean;
  registrationUrl: string;
  registrationOpenAt: string | null;
  registrationCloseAt: string | null;
  progress: number;
  featured: boolean;
  displayOrder: number;
  published: boolean;
  publishedAt: string | null;
  activityId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartnershipType {
  value: string;
  label: string;
  title: string;
  eyebrow: string;
  description: string;
  tag: string;
  icon: IconName;
}

export type InquiryStatus = "pending" | "reviewed" | "responded";

export interface PartnershipInquiry {
  id: string;
  fullName: string;
  organization: string;
  email: string;
  phone: string;
  partnershipType: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
  updatedAt: string;
}

// ── Property types ──────────────────────────────────────────────────────────

export type PropertyStatus = "available" | "sold" | "rented" | "off-market";

export type PropertyCategory =
  | "lands-for-sale"
  | "residential-properties"
  | "houses-for-sale"
  | "houses-for-rent"
  | "commercial-properties"
  | "real-estate-development-projects"
  | "upcoming-major-projects";

export interface Property {
  id: string;
  title: string;
  slug: string;
  category: PropertyCategory;
  propertyType: string;
  description: string;
  location: string;
  district: string;
  community: string;
  price: number;
  currency: string;
  size: string;
  status: PropertyStatus;
  imageIds: string[];
  videoUrl: string;
  featured: boolean;
  projectDesignation: string;
  contactInfo: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Property project types ──────────────────────────────────────────────────

export type ProjectStatus = "planned" | "in-development" | "completed" | "on-hold";

export interface PropertyProject {
  id: string;
  name: string;
  slug: string;
  description: string;
  location: string;
  category: string;
  status: ProjectStatus;
  imageIds: string[];
  highlights: string[];
  expectedLaunchDate: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Course types ────────────────────────────────────────────────────────────

export type CourseStatus = "available" | "full" | "closed";

export type CourseDeliveryMethod = "Online" | "Physical" | "Hybrid";

export interface Course {
  id: string;
  name: string;
  code: string;
  slug: string;
  category: string;
  description: string;
  objectives: string;
  duration: string;
  fee: number;
  currency: string;
  requirements: string;
  imageId: string;
  capacity: number;
  status: CourseStatus;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  deliveryMethod: CourseDeliveryMethod;
  location: string;
  startDate: string | null;
  endDate: string | null;
  enrollmentOpensAt: string | null;
  enrollmentClosesAt: string | null;
  instructorName: string;
  instructorBio: string;
  instructorEmail: string;
  curriculum: string;
  paymentInstructions: string;
  paymentMethods: string;
  isFree: boolean;
}

// ── Enrollment types ────────────────────────────────────────────────────────

export type EnrollmentStatus =
  | "pending"
  | "under-review"
  | "accepted"
  | "rejected"
  | "enrolled";

export interface Enrollment {
  id: string;
  courseId: string;
  courseName: string;
  fullName: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  dateOfBirth: string | null;
  gender: string;
  address: string;
  educationBackground: string;
  relevantExperience: string;
  additionalInformation: string;
  status: EnrollmentStatus;
  adminNotes: string;
  reference: string;
  createdAt: string;
  updatedAt: string;
}

// ── Course application types ───────────────────────────────────────────────

export type CourseApplicationStatus =
  | "pending-review"
  | "under-review"
  | "approved"
  | "rejected"
  | "awaiting-payment"
  | "payment-submitted"
  | "payment-verified"
  | "enrollment-confirmed";

export type PaymentStatus = "none" | "submitted" | "verified" | "rejected";

export interface CourseApplication {
  id: string;
  courseId: string;
  courseName: string;
  courseSlug: string;
  studentId: string;
  studentUserId: string;
  fullName: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  country: string;
  district: string;
  address: string;
  dateOfBirth: string | null;
  gender: string;
  highestQualification: string;
  institution: string;
  occupation: string;
  relevantExperience: string;
  deliveryPreference: string;
  courseFee: number;
  currency: string;
  enrollmentDate: string | null;
  whyJoin: string;
  relevantSkills: string;
  additionalInformation: string;
  reference: string;
  status: CourseApplicationStatus;
  paymentStatus: PaymentStatus;
  receiptFileId: string;
  receiptFileName: string;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationStatusHistoryEntry {
  id: string;
  applicationId: string;
  status: CourseApplicationStatus;
  changedBy: string;
  changedByEmail: string;
  changedByRole: string;
  changedAt: string;
  notes: string;
}

export interface CoursePayment {
  id: string;
  applicationId: string;
  courseId: string;
  courseName: string;
  studentEmail: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionReference: string;
  paymentDate: string | null;
  receiptFileId: string;
  receiptFileName: string;
  status: PaymentStatus;
  rejectionReason: string;
  verifiedBy: string;
  verifiedByEmail: string;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseFormField {
  id: string;
  courseId: string;
  fieldType: string;
  label: string;
  name: string;
  description: string;
  required: boolean;
  position: number;
  options: string[];
  placeholder: string;
}

// ── Elevate 360 project types ───────────────────────────────────────────────

export interface ElevateProject {
  id: string;
  name: string;
  slug: string;
  description: string;
  objectives: string;
  category: string;
  imageIds: string[];
  status: ProjectStatus;
  launchDate: string | null;
  participationInfo: string;
  featured: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Jallal Tech project types ───────────────────────────────────────────────

export interface TechProject {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  imageIds: string[];
  status: ProjectStatus;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Audit log types ─────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  module: string;
  recordId: string;
  timestamp: string;
  details: string;
}

// ── Course category types ───────────────────────────────────────────────────

export interface CourseCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Site settings types ─────────────────────────────────────────────────────

export interface SiteSetting {
  id: string;
  key: string;
  value: string;
  updatedBy: string;
  updatedAt: string;
}

// ── RBAC types ──────────────────────────────────────────────────────────────

export type AdminRole =
  | "admin"
  | "jallal-tech-admin"
  | "jallal-institute-admin"
  | "jallal-properties-admin"
  | "elevate-360-admin"
  | "content-editor"
  | "program-administrator"
  | "instructor";

export type AdminPermission =
  | "companies.manage"
  | "properties.manage"
  | "propertyProjects.manage"
  | "courses.manage"
  | "enrollments.manage"
  | "courseApplications.manage"
  | "coursePayments.manage"
  | "elevateProjects.manage"
  | "techProjects.manage"
  | "projects.manage"
  | "auditLogs.view"
  | "users.manage"
  | "settings.manage"
  | "content.manage"
  | "activities.manage"
  | "applicationForms.manage"
  | "applications.manage"
  | "students.manage"
  | "programs.manage";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  labels: string[];
  roles: AdminRole[];
  permissions: AdminPermission[];
  isSuperAdmin: boolean;
}

/** Role → permissions mapping. Super admin ("admin") gets every permission. */
export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  admin: [
    "companies.manage",
    "properties.manage",
    "propertyProjects.manage",
    "courses.manage",
    "enrollments.manage",
    "elevateProjects.manage",
    "techProjects.manage",
    "projects.manage",
    "auditLogs.view",
    "users.manage",
    "settings.manage",
    "content.manage",
  ],
  "jallal-tech-admin": ["techProjects.manage", "content.manage"],
  "jallal-institute-admin": [
    "courses.manage",
    "enrollments.manage",
    "courseApplications.manage",
    "coursePayments.manage",
  ],
  "jallal-properties-admin": ["properties.manage", "propertyProjects.manage"],
  "elevate-360-admin": ["elevateProjects.manage"],
  "content-editor": ["content.manage"],
  "program-administrator": [
    "activities.manage",
    "applicationForms.manage",
    "applications.manage",
    "students.manage",
    "programs.manage",
  ],
  instructor: ["programs.manage"],
};

/** Module label → required permission, used by the admin sidebar. */
export const MODULE_PERMISSIONS: Record<string, AdminPermission> = {
  "jallal-tech": "techProjects.manage",
  "jallal-institute": "courses.manage",
  "jallal-institute-enrollments": "enrollments.manage",
  "jallal-institute-categories": "courses.manage",
  "jallal-institute-course-applications": "courseApplications.manage",
  "jallal-institute-payments": "coursePayments.manage",
  "jallal-properties": "properties.manage",
  "jallal-properties-projects": "propertyProjects.manage",
  "elevate-360": "elevateProjects.manage",
  "digital-ventures": "content.manage",
  "projects": "projects.manage",
  "projects-events": "projects.manage",
  "partnership-inquiries": "companies.manage",
  "user-management": "users.manage",
  "admin-roles": "users.manage",
  "audit-logs": "auditLogs.view",
  "notifications": "content.manage",
  "site-settings": "settings.manage",
  "media-library": "content.manage",
  "reports": "auditLogs.view",
  "general-settings": "settings.manage",
  "security-settings": "settings.manage",
  "training-activities": "activities.manage",
  "training-application-forms": "applicationForms.manage",
  "training-applications": "applications.manage",
  "training-students": "students.manage",
  "training-programs": "programs.manage",
};
