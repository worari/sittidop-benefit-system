"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || "/wer-rta").replace(/\/$/, "");

// Patch window.fetch synchronously at module evaluation time so ALL child components'
// initial useEffect fetches (which run before parent useEffect) are prefixed with /wer-rta.
if (typeof window !== "undefined" && BASE_PATH && !(window as any).__werRtaFetchPatched) {
  (window as any).__werRtaFetchPatched = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    if (typeof input === "string" && input.startsWith("/api/") && !input.startsWith(`${BASE_PATH}/`)) {
      input = `${BASE_PATH}${input}`;
    } else if (input instanceof URL && input.origin === window.location.origin && input.pathname.startsWith("/api/") && !input.pathname.startsWith(`${BASE_PATH}/`)) {
      input = new URL(`${BASE_PATH}${input.pathname}${input.search}${input.hash}`, input.origin);
    }
    return originalFetch(input, init);
  };
}

export function Providers({ children }: { children: React.ReactNode }) {
  const authBasePath = `${BASE_PATH}/api/auth`;

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
