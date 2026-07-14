"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type State =
  | { status: "verifying" }
  | { status: "check_email"; email: string; festival: string }
  | { status: "error"; message: string };

export default function JoinPage() {
  return (
    <Suspense fallback={<LoadingView />}>
      <JoinContent />
    </Suspense>
  );
}

function JoinContent() {
  const params = useSearchParams();
  const [state, setState] = useState<State>({ status: "verifying" });

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setState({ status: "error", message: "No verification token found in URL." });
      return;
    }

    fetch("/api/verify-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setState({ status: "error", message: data.error ?? "Verification failed." });
          return;
        }

        // Server returns the verified email — use it to send the magic link
        const email: string = data.email;
        const supabase = createClient();
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            shouldCreateUser: false, // user was already created server-side
          },
        });

        if (otpError) {
          setState({ status: "error", message: "Ticket verified but we couldn't send your sign-in email. Please try again." });
          return;
        }

        setState({
          status: "check_email",
          email,
          festival: data.event?.festival_name ?? "the festival",
        });
      })
      .catch(() => {
        setState({ status: "error", message: "Something went wrong. Please try again." });
      });
  }, [params]);

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center">
      {state.status === "verifying" && (
        <>
          <Spinner />
          <p className="mt-6 text-lg font-medium text-ink">Verifying your ticket…</p>
          <p className="mt-2 text-sm text-ink/50">This only takes a second.</p>
        </>
      )}

      {state.status === "check_email" && (
        <>
          <div className="w-16 h-16 rounded-full bg-brand-500 flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-serif font-bold text-ink">Ticket verified</h1>
          <p className="mt-3 text-ink/70">
            You&apos;re confirmed for <span className="text-ink font-semibold">{state.festival}</span>.
          </p>
          <div className="mt-8 w-full bg-card rounded-2xl p-5 text-left border border-sunken">
            <p className="text-sm text-ink/50 mb-1">Sign-in link sent to</p>
            <p className="text-ink font-medium">{state.email}</p>
          </div>
          <p className="mt-6 text-sm text-ink/50 leading-relaxed">
            Check your email and click the link to finish setting up your profile.
            It expires in 24 hours.
          </p>
        </>
      )}

      {state.status === "error" && (
        <>
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-serif font-bold text-ink">Verification failed</h1>
          <p className="mt-3 text-ink/60">{state.message}</p>
          <p className="mt-6 text-sm text-ink/40">
            If you think this is a mistake, contact support or try clicking the button
            in your ticket confirmation email again.
          </p>
        </>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-12 h-12 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function LoadingView() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center">
      <Spinner />
      <p className="mt-6 text-lg font-medium text-ink">Loading…</p>
    </div>
  );
}
