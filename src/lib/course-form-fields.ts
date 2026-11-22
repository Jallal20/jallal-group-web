import "server-only";

import { ID, Query, type Models } from "node-appwrite";
import { adminTablesDB } from "@/lib/appwrite";
import { env, isAppwriteConfigured } from "@/lib/env";
import type { CourseFormField } from "@/lib/types";

export class BackendNotConfiguredError extends Error {
  constructor() {
    super("The Appwrite backend is not configured for this deployment.");
    this.name = "BackendNotConfiguredError";
  }
}

type CourseFormFieldRow = Models.Row & {
  courseId: string;
  fieldType: string;
  label: string;
  name: string;
  description: string;
  required: boolean;
  position: number;
  options: string;
  placeholder: string;
};

function toCourseFormField(row: CourseFormFieldRow): CourseFormField {
  return {
    id: row.$id,
    courseId: row.courseId,
    fieldType: row.fieldType,
    label: row.label,
    name: row.name,
    description: row.description,
    required: row.required,
    position: row.position,
    options: safeParseJsonArray(row.options),
    placeholder: row.placeholder,
  };
}

function safeParseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((v) => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

function requireBackend(): void {
  if (!isAppwriteConfigured()) throw new BackendNotConfiguredError();
}

const TABLE_ID = "course_form_fields";

export type CourseFormFieldInput = {
  courseId: string;
  fieldType: string;
  label: string;
  name: string;
  description?: string;
  required: boolean;
  position: number;
  options?: string[];
  placeholder?: string;
};

export async function listCourseFormFields(
  courseId: string,
): Promise<CourseFormField[]> {
  requireBackend();

  const result = await adminTablesDB().listRows<CourseFormFieldRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    queries: [
      Query.equal("courseId", courseId),
      Query.orderAsc("position"),
      Query.limit(100),
    ],
    total: false,
  });

  return result.rows.map(toCourseFormField);
}

export async function getCourseFormField(
  id: string,
): Promise<CourseFormField | null> {
  requireBackend();

  try {
    const row = await adminTablesDB().getRow<CourseFormFieldRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      rowId: id,
    });
    return toCourseFormField(row);
  } catch {
    return null;
  }
}

export async function createCourseFormField(
  input: CourseFormFieldInput,
): Promise<CourseFormField> {
  requireBackend();

  const db = adminTablesDB();
  const row = await db.createRow<CourseFormFieldRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: ID.unique(),
    data: {
      courseId: input.courseId,
      fieldType: input.fieldType,
      label: input.label,
      name: input.name,
      description: input.description ?? "",
      required: input.required,
      position: input.position,
      options: JSON.stringify(input.options ?? []),
      placeholder: input.placeholder ?? "",
    },
  });

  return toCourseFormField(row);
}

export async function updateCourseFormField(
  id: string,
  input: Partial<CourseFormFieldInput>,
): Promise<CourseFormField> {
  requireBackend();

  const existing = await getCourseFormField(id);
  if (!existing) {
    throw new Error(`Course form field with id "${id}" not found.`);
  }

  const data: Record<string, unknown> = {};
  if (input.fieldType !== undefined) data.fieldType = input.fieldType;
  if (input.label !== undefined) data.label = input.label;
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.required !== undefined) data.required = input.required;
  if (input.position !== undefined) data.position = input.position;
  if (input.options !== undefined) data.options = JSON.stringify(input.options);
  if (input.placeholder !== undefined) data.placeholder = input.placeholder;

  const row = await adminTablesDB().updateRow<CourseFormFieldRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: id,
    data,
  });

  return toCourseFormField(row);
}

export async function deleteCourseFormField(id: string): Promise<void> {
  requireBackend();

  const existing = await getCourseFormField(id);
  if (!existing) {
    throw new Error(`Course form field with id "${id}" not found.`);
  }

  await adminTablesDB().deleteRow({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: id,
  });
}
