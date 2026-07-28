"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/store/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  const { logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Settings</h1>

      <Card className="flex items-center justify-between">
        <span className="text-sm font-medium">Theme</span>
        <ThemeToggle />
      </Card>

      <Card className="flex items-center justify-between">
        <span className="text-sm font-medium">Session</span>
        <Button variant="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </Card>
    </div>
  );
}
