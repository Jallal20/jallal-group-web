"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/field";
import { FileText, Image, Play, Clock, Mail, Phone, MapPin, GraduationCap, Building2, User } from "lucide-react";

type FormField = {
  id: string;
  fieldType: string;
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

const FIELD_TYPE_ICONS: Record<string, typeof FileText> = {
  fullName: User,
  email: Mail,
  phone: Phone,
  dateOfBirth: Clock,
  gender: User,
  institution: Building2,
  educationalLevel: GraduationCap,
  courseOfStudy: GraduationCap,
  address: MapPin,
  emergencyContact: User,
  shortText: FileText,
  longText: FileText,
  dropdown: FileText,
  multipleChoice: FileText,
  checkboxes: FileText,
  date: Clock,
  fileUpload: FileText,
  cvUpload: FileText,
  idUpload: Image,
  motivationStatement: FileText,
  previousExperience: FileText,
  customQuestion: FileText,
};

export default function ApplyForm({
  activityId,
  activityTitle,
  fields,
  confirmationMessage,
}: {
  activityId: string;
  activityTitle: string;
  fields: FormField[];
  confirmationMessage: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [fileMap, setFileMap] = useState<Record<string, string>>({});
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});

  const sortedFields = [...fields].sort((a, b) => a.position - b.position);

  const handleFileUpload = async (fieldName: string, file: File) => {
    setUploadingFiles((prev) => new Set([...prev, fieldName]));
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/student/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setFileMap((prev) => ({ ...prev, [fieldName]: data.file.fileId }));
    } catch {
      alert("Failed to upload file.");
    } finally {
      setUploadingFiles((prev) => {
        const next = new Set(prev);
        next.delete(fieldName);
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      const data: Record<string, unknown> = {};
      const fileIds: string[] = [];

      for (const field of sortedFields) {
        if (field.fieldType.startsWith("file") || field.fieldType === "cvUpload" || field.fieldType === "idUpload") {
          const fid = fileMap[field.name];
          if (fid) {
            data[field.name] = fid;
            fileIds.push(fid);
          } else if (field.required) {
            throw new Error(`${field.label} is required.`);
          }
        } else {
          data[field.name] = formValues[field.name] ?? "";
        }
      }

      const res = await fetch("/api/student/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId, formData: data, fileIds }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to submit application.");
      }

      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-lg border border-line bg-white p-10 text-center shadow-card">
        <svg className="h-16 w-16 text-success mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
        <h2 className="text-headline-md font-bold text-ink">Application submitted!</h2>
        <p className="text-body-sm text-muted mt-2">{confirmationMessage || "Thank you for your application."}</p>
        <p className="mt-4 text-body-sm text-ink font-mono">
          You can track your application status from your dashboard.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitError && (
        <div className="rounded-lg border border-danger/40 bg-danger/5 p-4 text-body-sm text-danger">
          {submitError}
        </div>
      )}
      {sortedFields.map((field) => {
        const Icon = FIELD_TYPE_ICONS[field.fieldType] || FileText;
        const isFile = field.fieldType.startsWith("file") || field.fieldType === "cvUpload" || field.fieldType === "idUpload";
        return (
          <div key={field.id} className="flex flex-col gap-2">
            <Label className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted shrink-0" />
              <span className="text-body-sm font-semibold text-ink">{field.label}</span>
              {field.required && <span className="text-danger">*</span>}
            </Label>
            {field.description && <p className="text-xs text-muted">{field.description}</p>}
            {isFile ? (
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id={field.name}
                  accept={field.acceptedFileTypes.join(",")}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(field.name, f);
                  }}
                  className="block w-full text-body-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-ink hover:file:bg-accent/90"
                />
                {fileMap[field.name] && (
                  <span className="text-xs text-success">
                    <FileText className="h-3 w-3 mr-1" /> Uploaded
                  </span>
                )}
                {uploadingFiles.has(field.name) && <span className="text-xs text-muted">Uploading…</span>}
              </div>
            ) : field.fieldType === "dropdown" || field.fieldType === "multipleChoice" ? (
              <Select defaultValue="" onChange={(e) => setFormValues((prev) => ({ ...prev, [field.name]: e.target.value }))}>
                <option value="">Select an option</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </Select>
            ) : field.fieldType === "date" || field.fieldType === "dateOfBirth" ? (
              <input
                id={field.name}
                type="date"
                onChange={(e) => setFormValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
                className="block w-full rounded-md border border-line bg-white px-3 py-2 text-body-sm shadow-sm focus:border-accent focus:outline-none"
              />
            ) : field.fieldType === "longText" ? (
              <Textarea id={field.name} rows={4} placeholder={field.placeholder} onChange={(e) => setFormValues((prev) => ({ ...prev, [field.name]: e.target.value }))} />
            ) : field.fieldType === "email" ? (
              <Input id={field.name} type="email" placeholder={field.placeholder} onChange={(e) => setFormValues((prev) => ({ ...prev, [field.name]: e.target.value }))} />
            ) : field.fieldType === "phone" ? (
              <Input id={field.name} type="tel" placeholder={field.placeholder} onChange={(e) => setFormValues((prev) => ({ ...prev, [field.name]: e.target.value }))} />
            ) : (
              <Input id={field.name} placeholder={field.placeholder} onChange={(e) => setFormValues((prev) => ({ ...prev, [field.name]: e.target.value }))} />
            )}
          </div>
        );
      })}
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Submitting…" : "Submit application"}
      </Button>
    </form>
  );
}
