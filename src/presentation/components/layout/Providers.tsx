"use client";

import React, { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  const bp = process.env.NEXT_PUBLIC_BASE_PATH || "/wer-rta";
  const authBasePath = `${bp}/api/auth`;

  useEffect(() => {
    if (typeof window !== "undefined" && bp) {
      const originalFetch = window.fetch;
      window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
        if (typeof input === "string" && input.startsWith("/api/") && !input.startsWith(bp)) {
          input = `${bp}${input}`;
        }
        return originalFetch(input, init);
      };
    }
  }, [bp]);

  return (
    <SessionProvider basePath={authBasePath}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="dark"
        forcedTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        {children}
      </NextThemesProvider>
    </SessionProvider>
  );
}
