import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    // If user token is found but inactive, redirect to login with error
    if (token && (token as any).isActive === false) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "PendingApproval");
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Must be logged in and active
        if (!token) return false;
        if ((token as any).isActive === false) return false;
        return true;
      },
    },
    pages: {
      signIn: "/login",
      error: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/personnel/:path*",
    "/loss-reports/:path*",
    "/benefit-tracking/:path*",
    "/calculator/:path*",
    "/claims/:path*",
    "/documents/:path*",
    "/family/:path*",
    "/heirs/:path*",
    "/import/:path*",
    "/reports/:path*",
    "/rules/:path*",
    "/settings/:path*",
    "/users/:path*",
  ],
};
