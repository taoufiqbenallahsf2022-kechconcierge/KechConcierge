"use client";

import { Suspense, useEffect } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { useAuthStore } from "@/store/auth.store";
import { PageVisitTracker } from "./PageVisitTracker";
import TripExperience from "./TripExperience";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {

  const restoreAuth = useAuthStore(
    (state) => state.restoreAuth
  );

  useEffect(() => {
    restoreAuth();
  }, [restoreAuth]);

  return (
    <GoogleOAuthProvider
      clientId={
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!
      }
    >
      <Suspense fallback={null}>
        <PageVisitTracker />
      </Suspense>
      {children}
      <TripExperience />
    </GoogleOAuthProvider>
  );
}
