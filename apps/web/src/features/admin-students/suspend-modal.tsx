"use client";

import { useState } from "react";
import { suspendStudent } from "@/lib/api";
import { useAdminAuth } from "@/store/admin-auth-context";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SuspendModal({ studentId, open, onClose, onSuspended }: { studentId: string; open: boolean; onClose: () => void; onSuspended: () => void }) {
  const { token } = useAdminAuth();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSuspend() {
    if (!reason.trim()) return;
    setIsSubmitting(true);
    setError(null);
    const res = await suspendStudent(token as string, studentId, { reason });
    setIsSubmitting(false);
    if (res.success) {
      setReason("");
      onSuspended();
      onClose();
    } else {
      setError(res.message || "Could not suspend student");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Suspend Student">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Reason</label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for suspension" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSuspend} disabled={isSubmitting || !reason.trim()}>
            {isSubmitting ? "Suspending..." : "Suspend"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
