"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";

interface PaymentVerifyFormProps {
  payment: {
    id: string;
    status: string;
    applicationId: string;
    courseName: string;
    studentEmail: string;
    amount: number;
    currency: string;
  };
}

export function PaymentVerifyForm({
  payment,
}: PaymentVerifyFormProps) {
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);

  const formattedAmount = new Intl.NumberFormat("en-SL", {
    style: "currency",
    currency: payment.currency,
  }).format(payment.amount);

  async function handleAction(act: "verify" | "reject") {
    setServerError(null);
    if (act === "reject" && !reason.trim()) {
      setServerError("A rejection reason is required.");
      return;
    }
    setStatus("saving");
    try {
      const res = await fetch(`/api/admin/payments/${payment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: act,
          reason: act === "reject" ? reason.trim() : "",
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
      };
      if (res.ok && payload.ok) {
        setStatus("saved");
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setServerError(payload.message ?? "Failed to update payment.");
        setStatus("error");
      }
    } catch {
      setServerError("Network error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <section className="rounded-lg border border-line bg-white p-6 shadow-card">
      <h3 className="label-caps text-accent mb-4">Verify payment evidence</h3>
      <p className="text-body-sm text-muted mb-4">
        Compare the submitted amount <span className="font-semibold text-ink">{formattedAmount}</span>
        with the required course fee before deciding. Uploading a receipt does
        not mean payment has been received.
      </p>
      {serverError && (
        <div role="alert" className="mb-4 rounded-md border border-danger/30 bg-danger/5 p-3 text-body-sm text-danger">
          {serverError}
        </div>
      )}
      <div className="space-y-3">
        <Button
          type="button"
          onClick={() => handleAction("verify")}
          disabled={status === "saving"}
          variant="accent"
          className="w-full"
        >
          {status === "saving" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying…
            </>
          ) : (
            "Approve payment"
          )}
        </Button>
        <Button
          type="button"
          onClick={() => setShowReject(true)}
          disabled={status === "saving"}
          variant="secondary"
          className="w-full"
        >
          Reject payment
        </Button>
      </div>
      {showReject && (
        <div className="mt-4">
          <Field
            label="Rejection reason*"
            htmlFor="reason"
            required
            hint="Tell the applicant why the receipt was rejected."
          >
            <Textarea
              id="reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={status === "saving"}
            />
          </Field>
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              onClick={() => handleAction("reject")}
              disabled={status === "saving" || !reason.trim()}
              variant="danger"
              className="w-full"
            >
              Confirm rejection
            </Button>
            <Button
              type="button"
              onClick={() => setShowReject(false)}
              variant="ghost"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      {status === "saved" && (
        <p className="mt-2 text-xs text-forest font-semibold">
          Payment record updated and student notified.
        </p>
      )}
    </section>
  );
}
