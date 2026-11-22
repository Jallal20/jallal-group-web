import { z } from "zod";

export const partnershipInquirySchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Please enter your full name.")
    .max(120, "Name must be 120 characters or fewer."),
  organization: z
    .string()
    .trim()
    .min(2, "Please enter your organisation.")
    .max(160, "Organisation must be 160 characters or fewer."),
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email address.")
    .email("Please enter a valid email address.")
    .max(200, "Email must be 200 characters or fewer."),
  phone: z
    .string()
    .trim()
    .min(5, "Please enter a phone number.")
    .max(40, "Phone must be 40 characters or fewer."),
  partnershipType: z
    .string()
    .trim()
    .min(1, "Please choose a partnership type.")
    .max(80, "Partnership type is too long."),
  message: z
    .string()
    .trim()
    .min(20, "Please provide at least 20 characters of context.")
    .max(4000, "Message must be 4000 characters or fewer."),
  /** Honeypot — must stay empty. Never shown to users. */
  website: z.string().max(0).optional().or(z.literal("")),
});

export type PartnershipInquiryInput = z.infer<typeof partnershipInquirySchema>;

export function formatZodErrors(
  error: z.ZodError,
): Record<string, string | undefined> {
  const issues: Record<string, string | undefined> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!issues[key]) issues[key] = issue.message;
  }
  return issues;
}
