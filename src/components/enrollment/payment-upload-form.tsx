"use client";

import { useState } from "react";
import { ArrowRight, FileText, Loader2, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";

interface PaymentUploadFormProps {
  application: {
    id: string;
    reference: string;
    courseName: string;
    courseFee: number;
    currency: string;
    email: string;
    paymentStatus: string;
    status: string;
  };
  course?: {
    paymentInstructions: string;
    paymentMethods: string;
  } | null;
  existingPayment?: {
    id: string;
    status: string;
    rejectionReason: string;
    receiptFileId: string;
    receiptFileName: string;
    transactionReference: string;
    amount: number;
    currency: string;
    createdAt: string;
    updatedAt: string;
  } | null;
}

const PAYMENT_METHODS = [
  "Bank transfer",
  "Mobile money",
  "Cash deposit",
  "Cheque",
  "Other",
] as const;

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-SL", {
    style: "currency",
    currency,
  }).format(value);
}

export function PaymentUploadForm({
  application,
  course,
  existingPayment,
}: PaymentUploadFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const [values, setValues] = useState({
    paymentMethod: "",
    transactionReference: "",
    paymentDate: "",
    amountPaid: String(application.courseFee || 0),
  });

  const paymentMethods = course?.paymentMethods
    ? (() => {
        try {
          const parsed = JSON.parse(course.paymentMethods);
          return Array.isArray(parsed) && parsed.length > 0
            ? (parsed as string[])
            : PAYMENT_METHODS;
        } catch {
          return PAYMENT_METHODS;
        }
      })()
    : PAYMENT_METHODS;

  function setField(field: string, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setError("Only PDF, JPG, JPEG and PNG files are accepted.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be smaller than 10 MB.");
      return;
    }
    setReceiptFile(file);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!values.paymentMethod.trim()) {
      setError("Please select a payment method.");
      return;
    }
    if (!values.transactionReference.trim()) {
      setError("Transaction reference is required.");
      return;
    }
    if (!values.paymentDate) {
      setError("Payment date is required.");
      return;
    }
    const amount = parseFloat(values.amountPaid);
    if (!amount || amount <= 0) {
      setError("Please enter a valid amount paid.");
      return;
    }
    if (!receiptFile) {
      setError("Please upload a payment receipt.");
      return;
    }

    const formData = new FormData();
    formData.append("applicationId", application.id);
    formData.append("paymentMethod", values.paymentMethod);
    formData.append("transactionReference", values.transactionReference.trim());
    formData.append("paymentDate", values.paymentDate);
    formData.append("amountPaid", values.amountPaid);
    formData.append("receipt", receiptFile);

    setSubmitting(true);
    setUploading(true);
    try {
      const res = await fetch("/api/student/payments", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Payment submission failed.");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment submission failed.");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-lg border border-success/40 bg-success-soft/20 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-success">
            <FileText className="h-5 w-5" />
          </div>
          <span className="font-semibold text-success">
            Payment evidence submitted
          </span>
        </div>
        <p className="text-body-sm text-success">
          Your payment receipt has been uploaded and is awaiting administrative
          verification. You will be notified once your payment is reviewed.
        </p>
        <p className="mt-2 text-body-sm text-muted">
          Reference: <span className="font-mono text-ink">{application.reference}</span>
        </p>
      </div>
    );
  }

  const isResubmission = existingPayment && existingPayment.status === "rejected";

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-line bg-white p-5">
        <h3 className="label-caps text-accent mb-3">Submit payment evidence</h3>
        <p className="text-body-sm text-muted mb-4">
          Upload a receipt or proof of payment for{" "}
          <span className="font-semibold text-ink">{application.courseName}</span>.
        </p>

        {course?.paymentInstructions && (
          <div className="mb-5 rounded-md border border-line bg-sunken p-4">
            <p className="label-caps text-muted mb-2">Payment instructions</p>
            <p className="text-body-sm text-ink/90 whitespace-pre-line">
              {course.paymentInstructions}
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-danger/40 bg-danger/5 p-4 text-body-sm text-danger mb-4">
            {error}
          </div>
        )}

        {isResubmission && existingPayment?.rejectionReason && (
          <div className="rounded-md border border-danger/30 bg-danger/5 p-4 text-body-sm text-danger mb-4">
            <p className="label-caps text-danger mb-1">
              Previous submission rejected
            </p>
            <p className="text-body-sm">
              {existingPayment.rejectionReason}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field label="Payment method*" htmlFor="paymentMethod" required>
            <Select
              id="paymentMethod"
              value={values.paymentMethod}
              onChange={(e) => setField("paymentMethod", e.target.value)}
              disabled={submitting}
            >
              <option value="">Select payment method</option>
              {paymentMethods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Amount paid*" htmlFor="amountPaid" required>
            <Input
              id="amountPaid"
              type="number"
              step="0.01"
              min="0"
              value={values.amountPaid}
              onChange={(e) => setField("amountPaid", e.target.value)}
              disabled={submitting}
            />
          </Field>

          <Field label="Transaction reference*" htmlFor="transactionReference" required
            hint="Reference number from your bank or payment provider.">
            <Input
              id="transactionReference"
              value={values.transactionReference}
              onChange={(e) => setField("transactionReference", e.target.value)}
              disabled={submitting}
            />
          </Field>

          <Field label="Payment date*" htmlFor="paymentDate" required>
            <Input
              id="paymentDate"
              type="date"
              value={values.paymentDate}
              onChange={(e) => setField("paymentDate", e.target.value)}
              disabled={submitting}
            />
          </Field>

          <Field
            label="Payment receipt (PDF, JPG, JPEG, PNG)*"
            htmlFor="receipt"
            required
            hint="Upload a clear photo or scan of your payment receipt. Max 10 MB."
          >
            <input
              id="receipt"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              disabled={submitting}
              className="block w-full text-body-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-ink hover:file:bg-accent/90"
            />
            {receiptFile && (
              <p className="mt-1 text-xs text-success flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {receiptFile.name} ready to upload
              </p>
            )}
          </Field>

          <div className="pt-4">
            <Button
              type="submit"
              variant="accent"
              size="lg"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {uploading ? "Uploading receipt…" : "Submitting…"}
                </>
              ) : isResubmission ? (
                "Re-submit payment evidence"
              ) : (
                <>
                  Submit payment evidence <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {existingPayment && (
        <div className="rounded-lg border border-line bg-white p-5">
          <h3 className="label-caps text-muted mb-3">Submission history</h3>
          <dl className="grid grid-cols-1 gap-3 text-body-sm">
            <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
              <dt className="text-muted">Status</dt>
              <dd className={cn("text-ink font-semibold", existingPayment.status === "verified" ? "text-success" : existingPayment.status === "rejected" ? "text-danger" : "text-ink")}>
                {existingPayment.status.charAt(0).toUpperCase() + existingPayment.status.slice(1)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
              <dt className="text-muted">Transaction reference</dt>
              <dd className="text-ink font-mono text-xs">{existingPayment.transactionReference}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
              <dt className="text-muted">Amount</dt>
              <dd className="text-ink">{formatCurrency(existingPayment.amount, existingPayment.currency)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
              <dt className="text-muted">Submitted</dt>
              <dd className="text-ink">{new Date(existingPayment.createdAt).toLocaleDateString("en-GB")}</dd>
            </div>
            {existingPayment.receiptFileId && (
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">Receipt</dt>
                <dd className="text-ink">
                  <a
                    href={`https://fra.cloud.appwrite.io/v1/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID}/files/${existingPayment.receiptFileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-accent flex items-center gap-1"
                  >
                    <FileText className="h-4 w-4" />
                    View receipt {existingPayment.receiptFileName}
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      <div className="rounded-md border border-line bg-sunken p-4 text-center">
        <p className="text-body-sm text-muted">
          Important: Uploading a receipt does not mean your payment has been
          received. An administrator must verify the evidence before your
          enrolment is confirmed.
        </p>
      </div>
    </div>
  );
}
