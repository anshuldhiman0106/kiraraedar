"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type AuthCtaProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
};

export function AuthCta({
  title = "Sign in required",
  description = "Please sign in to continue.",
  actionLabel = "Go to login",
  actionHref = "/login",
}: AuthCtaProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-6 text-center space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button asChild className="w-full">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      </Card>
    </div>
  );
}
