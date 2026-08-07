"use client";

import { useState } from "react";
import { grantStudentPoints } from "@/lib/api";
import { useAdminAuth } from "@/store/admin-auth-context";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function GrantPointsModal({ studentId, open, onClose, onGranted }: { studentId: string; open: boolean; onClose: () => void; onGranted: () => void }) {
  const { token } = useAdminAuth();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGrant() {
    const parsedAmount = Number(amount);
    if (!parsedAmount || !reason.trim()) return;
    setIsSubmitting(true);
    setError(null);
    const res = await grantStudentPoints(token as string, studentId, { amount: parsedAmount, reason });
    setIsSubmitting(false);
    if (res.success) {
      setAmount("");
      setReason("");
      onGranted();
      onClose();
    } else {
      setError(res.message || "Could not grant points");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Grant Study Points">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Amount</label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 100" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Reason</label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Contest prize" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleGrant} disabled={isSubmitting || !amount || !reason.trim()}>
            {isSubmitting ? "Granting..." : "Grant"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
