"use client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Direction, Tooltip } from "radix-ui";

/** Radix primitives read direction from context, not the <html dir> attribute. */
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } }));
  return (
    <QueryClientProvider client={client}>
      <Direction.Provider dir="rtl">
        <Tooltip.Provider delayDuration={200}>{children}</Tooltip.Provider>
      </Direction.Provider>
    </QueryClientProvider>
  );
}
