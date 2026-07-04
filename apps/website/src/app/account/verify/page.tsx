"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { getDictionary, getLocaleFromPath } from "../../../lib/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function localizePath(path: string, locale: string) {
  if (locale === "en") return path;
  if (path === "/") return `/${locale}`;
  return `/${locale}${path}`;
}

function VerifyAccountContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const locale = getLocaleFromPath(pathname);
  const t = getDictionary(locale);

  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function verifyEmail() {
      if (!token) {
        setStatus("error");
        setMessage(t.accountVerify.missingToken);
        return;
      }

      try {

        console.log('Attempts');
        const response = await fetch(
          `${API_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`
        );

        const data = await response.json();

        if (!response.ok) {
          setStatus("error");
          setMessage(t.accountVerify.errorMessage);
          return;
        }

        setStatus("success");
        setMessage(t.accountVerify.successMessage);
      } catch {
        setStatus("error");
        setMessage(t.accountVerify.errorMessage);
      }
    }

    verifyEmail();
  }, [token, t.accountVerify.missingToken, t.accountVerify.errorMessage, t.accountVerify.successMessage]);

  return (
    <section className="mx-auto grid min-h-[70vh] max-w-3xl place-items-center px-4 py-20">
      <div className="w-full rounded-[2rem] bg-white p-6 text-center card-shadow md:p-8">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-700">
          {t.accountVerify.eyebrow}
        </p>

        {status === "loading" && (
          <>
            <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-700">
              <Loader2 size={34} className="animate-spin" />
            </div>

            <h1 className="mt-6 text-3xl font-black text-zinc-950">
              {t.accountVerify.loadingTitle}
            </h1>

            <p className="mt-3 text-zinc-600">
              {t.accountVerify.loadingDescription}
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-700">
              <CheckCircle2 size={36} />
            </div>

            <h1 className="mt-6 text-3xl font-black text-zinc-950">
              {t.accountVerify.successTitle}
            </h1>

            <p className="mt-3 text-zinc-600">{message}</p>

            <Link
              href={localizePath("/?auth=login", locale)}
              className="mt-7 inline-flex rounded-full bg-orange-600 px-7 py-4 font-black text-white transition hover:bg-orange-700"
            >
              {t.accountVerify.backToLogin}
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-700">
              <XCircle size={36} />
            </div>

            <h1 className="mt-6 text-3xl font-black text-zinc-950">
              {t.accountVerify.errorTitle}
            </h1>

            <p className="mt-3 text-zinc-600">{message}</p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={localizePath("/contact", locale)}
                className="rounded-full bg-zinc-950 px-7 py-4 font-black text-white transition hover:bg-orange-700"
              >
                {t.accountVerify.contactSupport}
              </Link>

              <Link
                href={localizePath("/", locale)}
                className="rounded-full border border-zinc-200 px-7 py-4 font-black text-zinc-800 transition hover:bg-orange-50"
              >
                {t.accountVerify.backToWebsite}
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default function VerifyAccountPage() {
  return (
    <Suspense fallback={null}>
      <VerifyAccountContent />
    </Suspense>
  );
}