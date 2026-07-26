import { NextRequest, NextResponse } from "next/server";

const locales = ["fr", "es", "pt", "it", "de"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders =
    new Headers(request.headers);

  requestHeaders.set(
    "x-moorish-public-pathname",
    pathname
  );

  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  const isLocalizedRoute = locales.includes(firstSegment);

  if (!isLocalizedRoute) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const pathnameWithoutLocale = "/" + segments.slice(1).join("/");

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname =
    pathnameWithoutLocale === "/" ? "/" : pathnameWithoutLocale;

  return NextResponse.rewrite(
    rewriteUrl,
    {
      request: {
        headers: requestHeaders,
      },
    }
  );
}

export const config = {
  matcher: [
    "/((?!api|_next|favicon.ico|images|flags|.*\\..*).*)",
  ],
};
