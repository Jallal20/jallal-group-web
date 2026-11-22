import "server-only";

import { ID, Query, type Models } from "node-appwrite";
import { adminTablesDB } from "@/lib/appwrite";
import { env, isAppwriteConfigured } from "@/lib/env";
import { writeAuditLog } from "@/lib/audit";

export class BackendNotConfiguredError extends Error {
  constructor() {
    super("The Appwrite backend is not configured for this deployment.");
    this.name = "BackendNotConfiguredError";
  }
}

export type FormStatus = "draft" | "open" | "closed";

export type FieldType =
  | "fullName"
  | "email"
  | "phone"
  | "dateOfBirth"
  | "gender"
  | "institution"
  | "educationalLevel"
  | "courseOfStudy"
  | "address"
  | "emergencyContact"
  | "shortText"
  | "longText"
  | "dropdown"
  | "multipleChoice"
  | "checkboxes"
  | "date"
  | "fileUpload"
  | "cvUpload"
  | "idUpload"
  | "motivationStatement"
  | "previousExperience"
  | "customQuestion";

export interface FormField {
  id: string;
  formId: string;
  fieldType: FieldType;
  label: string;
  name: string;
  description: string;
  required: boolean;
  position: number;
  options: string[];
  minLength: number | null;
  maxLength: number | null;
  acceptedFileTypes: string[];
  maxFileSizeMB: number | null;
  placeholder: string;
}

export interface ApplicationForm {
  id: string;
  activityId: string;
  activityTitle: string;
  title: string;
  description: string;
  confirmationMessage: string;
  allowEditingAfterSubmit: boolean;
  status: FormStatus;
  published: boolean;
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
}

type FormRow = Models.Row & {
  activityId: string;
  activityTitle: string;
  title: string;
  description: string;
  confirmationMessage: string;
  allowEditingAfterSubmit: boolean;
  status: FormStatus;
  published: boolean;
};

type FieldRow = Models.Row & {
  formId: string;
  fieldType: string;
  label: string;
  name: string;
  description: string;
  required: boolean;
  position: number;
  options: string;
  minLength: number | null;
  maxLength: number | null;
  acceptedFileTypes: string;
  maxFileSizeMB: number | null;
  placeholder: string;
};

function toFormField(row: FieldRow): FormField {
  return {
    id: row.$id,
    formId: row.formId,
    fieldType: row.fieldType as FieldType,
    label: row.label,
    name: row.name,
    description: row.description,
    required: row.required,
    position: row.position,
    options: safeParseJsonArray(row.options),
    minLength: row.minLength,
    maxLength: row.maxLength,
    acceptedFileTypes: safeParseJsonArray(row.acceptedFileTypes),
    maxFileSizeMB: row.maxFileSizeMB,
    placeholder: row.placeholder,
  };
}

function safeParseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function toForm(row: FormRow, fields: FormField[]): ApplicationForm {
  return {
    id: row.$id,
    activityId: row.activityId,
    activityTitle: row.activityTitle,
    title: row.title,
    description: row.description,
    confirmationMessage: row.confirmationMessage,
    allowEditingAfterSubmit: row.allowEditingAfterSubmit,
    status: row.status,
    published: row.published,
    fields,
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
}

function requireBackend(): void {
  if (!isAppwriteConfigured()) throw new BackendNotConfiguredError();
}

const FORM_TABLE_ID = env.applicationFormsId;
const FIELD_TABLE_ID = env.formFieldsId;

export type FormInput = {
  activityId: string;
  activityTitle: string;
  title: string;
  description: string;
  confirmationMessage: string;
  allowEditingAfterSubmit: boolean;
  status: FormStatus;
  published: boolean;
};

export type FieldInput = {
  formId: string;
  fieldType: FieldType;
  label: string;
  name: string;
  description: string;
  required: boolean;
  position: number;
  options: string[];
  minLength: number | null;
  maxLength: number | null;
  acceptedFileTypes: string[];
  maxFileSizeMB: number | null;
  placeholder: string;
};

export async function listApplicationForms(): Promise<ApplicationForm[]> {
  requireBackend();

  const db = adminTablesDB();
  const result = await db.listRows<FormRow>({
    databaseId: env.databaseId,
    tableId: FORM_TABLE_ID,
    queries: [Query.orderDesc("$createdAt"), Query.limit(100)],
    total: false,
  });

  const formsWithFields = await Promise.all(
    result.rows.map(async (row) => {
      const fields = await listFormFields(row.$id);
      return toForm(row, fields);
    }),
  );

  return formsWithFields;
}

export async function getApplicationForm(id: string): Promise<ApplicationForm | null> {
  requireBackend();

  try {
    const row = await adminTablesDB().getRow<FormRow>({
      databaseId: env.databaseId,
      tableId: FORM_TABLE_ID,
      rowId: id,
    });
    const fields = await listFormFields(id);
    return toForm(row, fields);
  } catch {
    return null;
  }
}

export async function getApplicationFormByActivity(
  activityId: string,
): Promise<ApplicationForm | null> {
  requireBackend();

  try {
    const result = await adminTablesDB().listRows<FormRow>({
      databaseId: env.databaseId,
      tableId: FORM_TABLE_ID,
      queries: [Query.equal("activityId", activityId), Query.limit(1)],
      total: false,
    });
    if (result.rows.length === 0) return null;
    const fields = await listFormFields(result.rows[0].$id);
    return toForm(result.rows[0], fields);
  } catch {
    return null;
  }
}

export async function listFormFields(formId: string): Promise<FormField[]> {
  requireBackend();

  const db = adminTablesDB();
  const result = await db.listRows<FieldRow>({
    databaseId: env.databaseId,
    tableId: FIELD_TABLE_ID,
    queries: [Query.equal("formId", formId), Query.orderAsc("position"), Query.limit(100)],
    total: false,
  });
  return result.rows.map(toFormField);
}

export async function createApplicationForm(
  input: FormInput,
  admin?: { id: string; email: string },
): Promise<ApplicationForm> {
  requireBackend();

  const db = adminTablesDB();
  const row = await db.createRow<FormRow>({
    databaseId: env.databaseId,
    tableId: FORM_TABLE_ID,
    rowId: ID.unique(),
    data: {
      activityId: input.activityId,
      activityTitle: input.activityTitle,
      title: input.title,
      description: input.description,
      confirmationMessage: input.confirmationMessage,
      allowEditingAfterSubmit: input.allowEditingAfterSubmit,
      status: input.status,
      published: input.published,
    },
  });

  const form = toForm(row, []);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "create",
      module: "application_forms",
      recordId: form.id,
      details: `Created application form "${form.title}" for activity ${input.activityId}`,
    });
  }

  return form;
}

export async function updateApplicationForm(
  id: string,
  input: Partial<FormInput>,
  admin?: { id: string; email: string },
): Promise<ApplicationForm> {
  requireBackend();

  const existing = await getApplicationForm(id);
  if (!existing) {
    throw new Error(`Application form with id "${id}" not found.`);
  }

  const data: Record<string, unknown> = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.confirmationMessage !== undefined)
    data.confirmationMessage = input.confirmationMessage;
  if (input.allowEditingAfterSubmit !== undefined)
    data.allowEditingAfterSubmit = input.allowEditingAfterSubmit;
  if (input.status !== undefined) data.status = input.status;
  if (input.published !== undefined) data.published = input.published;

  const row = await adminTablesDB().updateRow<FormRow>({
    databaseId: env.databaseId,
    tableId: FORM_TABLE_ID,
    rowId: id,
    data,
  });

  const fields = await listFormFields(id);
  const form = toForm(row, fields);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "update",
      module: "application_forms",
      recordId: id,
      details: `Updated application form "${form.title}"`,
    });
  }

  return form;
}

export async function deleteApplicationForm(
  id: string,
  admin?: { id: string; email: string },
): Promise<void> {
  requireBackend();

  const existing = await getApplicationForm(id);
  if (!existing) {
    throw new Error(`Application form with id "${id}" not found.`);
  }

  // Delete associated fields first.
  const fields = await listFormFields(id);
  for (const field of fields) {
    await deleteFormField(field.id);
  }

  await adminTablesDB().deleteRow({
    databaseId: env.databaseId,
    tableId: FORM_TABLE_ID,
    rowId: id,
  });

  if (admin && existing) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "delete",
      module: "application_forms",
      recordId: id,
      details: `Deleted application form "${existing.title}"`,
    });
  }
}

export async function createFormField(
  input: FieldInput,
  admin?: { id: string; email: string },
): Promise<FormField> {
  requireBackend();

  const db = adminTablesDB();
  const row = await db.createRow<FieldRow>({
    databaseId: env.databaseId,
    tableId: FIELD_TABLE_ID,
    rowId: ID.unique(),
    data: {
      formId: input.formId,
      fieldType: input.fieldType,
      label: input.label,
      name: input.name,
      description: input.description,
      required: input.required,
      position: input.position,
      options: JSON.stringify(input.options),
      minLength: input.minLength,
      maxLength: input.maxLength,
      acceptedFileTypes: JSON.stringify(input.acceptedFileTypes),
      maxFileSizeMB: input.maxFileSizeMB,
      placeholder: input.placeholder,
    },
  });

  const field = toFormField(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "create",
      module: "form_fields",
      recordId: field.id,
      details: `Added form field "${field.label}" to form ${input.formId}`,
    });
  }

  return field;
}

export async function updateFormField(
  id: string,
  input: Partial<FieldInput>,
  admin?: { id: string; email: string },
): Promise<FormField> {
  requireBackend();

  const db = adminTablesDB();
  const existing = await adminTablesDB().getRow<FieldRow>({
    databaseId: env.databaseId,
    tableId: FIELD_TABLE_ID,
    rowId: id,
  });

  const data: Record<string, unknown> = {};
  if (input.fieldType !== undefined) data.fieldType = input.fieldType;
  if (input.label !== undefined) data.label = input.label;
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.required !== undefined) data.required = input.required;
  if (input.position !== undefined) data.position = input.position;
  if (input.options !== undefined) data.options = JSON.stringify(input.options);
  if (input.minLength !== undefined) data.minLength = input.minLength;
  if (input.maxLength !== undefined) data.maxLength = input.maxLength;
  if (input.acceptedFileTypes !== undefined)
    data.acceptedFileTypes = JSON.stringify(input.acceptedFileTypes);
  if (input.maxFileSizeMB !== undefined) data.maxFileSizeMB = input.maxFileSizeMB;
  if (input.placeholder !== undefined) data.placeholder = input.placeholder;

  const row = await db.updateRow<FieldRow>({
    databaseId: env.databaseId,
    tableId: FIELD_TABLE_ID,
    rowId: id,
    data,
  });

  const field = toFormField(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "update",
      module: "form_fields",
      recordId: id,
      details: `Updated form field ${id}`,
    });
  }

  return field;
}

export async function deleteFormField(id: string): Promise<void> {
  requireBackend();

  await adminTablesDB().deleteRow({
    databaseId: env.databaseId,
    tableId: FIELD_TABLE_ID,
    rowId: id,
  });
}

export async function reorderFormFields(
  fieldIds: string[],
  admin?: { id: string; email: string },
): Promise<void> {
  requireBackend();

  const db = adminTablesDB();
  for (let i = 0; i < fieldIds.length; i += 1) {
    await db.updateRow({
      databaseId: env.databaseId,
      tableId: FIELD_TABLE_ID,
      rowId: fieldIds[i],
      data: { position: i },
    });
  }

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "reorder",
      module: "form_fields",
      recordId: fieldIds.join(","),
      details: `Reordered form fields`,
    });
  }
}
