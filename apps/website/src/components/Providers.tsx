"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { usePathname } from "next/navigation";
import { getLocaleFromPath } from "../lib/i18n";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);

  return (
    <GoogleOAuthProvider
      clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}
    >
      {children}
    </GoogleOAuthProvider>
  );
}