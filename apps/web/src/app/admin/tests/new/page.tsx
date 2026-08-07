"use client";

import { useRouter } from "next/navigation";
import { createAdminTest } from "@/lib/api";
import { useAdminAuth } from "@/store/admin-auth-context";
import { Card } from "@/components/ui/card";
import { TestForm } from "@/features/admin-tests/test-form";

export default function AdminTestNewPage() {
  const { token } = useAdminAuth();
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">New Test</h1>
      <Card>
        <TestForm
          submitLabel="Create Test"
          onSubmit={async (input) => {
            const res = await createAdminTest(token as string, input);
            if (res.success) {
              router.push(`/admin/tests/${res.data.id}`);
            }
            return res;
          }}
        />
      </Card>
    </div>
  );
}
