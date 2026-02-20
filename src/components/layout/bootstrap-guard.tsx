"use client";

import { useEffect } from "react";
import { api } from "@/lib/trpc/client";

export function BootstrapGuard() {
  const bootstrapMutation = api.auth.bootstrap.useMutation();

  useEffect(() => {
    bootstrapMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
