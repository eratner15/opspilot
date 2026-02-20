import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-6 text-center px-4">
        <FileQuestion className="h-16 w-16 text-muted-foreground" />
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">404 — Page Not Found</h1>
          <p className="text-muted-foreground max-w-sm">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
