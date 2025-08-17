"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/supabaseClient";
import { Tabs } from "@/components/ui/Tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import { FormField, TextInput } from "@/components/ui/FormField";
import { BrandButton } from "@/components/ui/BrandButton";

/* -------------------- Helpers -------------------- */
function validateUsername(u: string) {
  const v = u.trim();
  if (v.length < 3) return "Must be at least 3 characters";
  if (v.length > 20) return "Must be 20 characters or fewer";
  if (!/^[a-z0-9_.]+$/i.test(v))
    return "Only letters, numbers, _ and . allowed";
  return null;
}

function looksLikeEmail(s: string) {
  return /\S+@\S+\.\S+/.test(s);
}

/* -------------------- Sign In -------------------- */
/* -------------------- Sign In -------------------- */
function SignInForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = React.useState(""); // email OR username
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  // resend state
  const [resending, setResending] = React.useState(false);
  const [resendMsg, setResendMsg] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!identifier) return setError("Email or username is required");
    if (!password) return setError("Password is required");

    setLoading(true);
    try {
      let email = identifier.trim();

      // Resolve username -> email
      if (!looksLikeEmail(email)) {
        const { data, error: rpcErr } = await supabase.rpc(
          "email_for_username",
          {
            p_username: email,
          }
        );
        if (rpcErr) throw rpcErr;
        if (!data) {
          setError("No account found with that username");
          return;
        }
        email = data as string;
      }

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInErr) throw signInErr;

      router.replace("/");
    } catch (err: any) {
      setError(err?.message ?? "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  async function resendVerification() {
    setResendMsg(null);
    const input = identifier.trim();
    if (!input) {
      setResendMsg("Enter your email or username first.");
      return;
    }

    try {
      setResending(true);

      let email = input;
      if (!looksLikeEmail(email)) {
        const { data, error: rpcErr } = await supabase.rpc(
          "email_for_username",
          {
            p_username: email,
          }
        );
        if (rpcErr) throw rpcErr;
        if (!data) {
          setResendMsg("No account found with that username.");
          return;
        }
        email = data as string;
      }

      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      if (error) throw error;

      setResendMsg("Verification email sent. Check your inbox (and spam).");
    } catch (err: any) {
      setResendMsg(err?.message ?? "Could not send verification email.");
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormField label="Email or Username" required>
        <TextInput
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="you@example.com or jay_quiz"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </FormField>

      <FormField label="Password" required>
        <TextInput
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </FormField>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {resendMsg && (
        <p className="text-sm mt-1">
          {resendMsg.includes("sent") ? (
            <span className="text-green-600">{resendMsg}</span>
          ) : (
            <span className="text-red-600">{resendMsg}</span>
          )}
        </p>
      )}

      <BrandButton type="submit" loading={loading} className="w-full">
        Sign in
      </BrandButton>

      {/* Help links */}
      <div className="mt-4 flex flex-col gap-2 text-sm text-center">
        <a
          href="/forgot-password"
          className="text-brand font-medium hover:underline"
        >
          Forgotten your password? Click here
        </a>

        <button
          type="button"
          onClick={resendVerification}
          disabled={resending}
          className="text-brand font-medium hover:underline disabled:opacity-50"
        >
          {resending ? "Sending…" : "Resend verification email"}
        </button>
      </div>
    </form>
  );
}

/* -------------------- Sign Up -------------------- */
function SignUpForm() {
  const router = useRouter();
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState<any>({});
  const [checking, setChecking] = React.useState(false);
  const [available, setAvailable] = React.useState<null | boolean>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      const err = validateUsername(username);
      if (err) {
        setAvailable(null);
        return;
      }
      if (!username) return;
      setChecking(true);
      const { data, error } = await supabase.rpc("username_available", {
        p_username: username,
      });
      if (active) {
        setAvailable(error ? null : !!data);
        setChecking(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [username]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: any = {};

    const uErr = validateUsername(username);
    if (uErr) next.username = uErr;
    if (!email || !looksLikeEmail(email))
      next.email = "A valid email is required";
    if (!password || password.length < 6) next.password = "Min 6 characters";
    if (available === false) next.username = "That username is taken";

    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setErrors({});
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      router.push("/auth/check-email");
    } catch (err: any) {
      setErrors({ form: err?.message || "Sign up failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormField
        label="Username"
        required
        hint="3–20 chars. Letters, numbers, _ and ."
        error={errors.username}
      >
        <TextInput
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="jay_quiz"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <p className="mt-1 text-xs">
          {checking && (
            <span className="text-textc-muted">Checking availability…</span>
          )}
          {!checking && available === true && (
            <span className="text-green-600">Available ✓</span>
          )}
          {!checking && available === false && (
            <span className="text-red-600">Taken ✕</span>
          )}
        </p>
      </FormField>

      <FormField label="Email" required error={errors.email}>
        <TextInput
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </FormField>

      <FormField label="Password" required error={errors.password}>
        <TextInput
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </FormField>

      {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}

      <BrandButton type="submit" loading={loading} className="w-full">
        Create account
      </BrandButton>
    </form>
  );
}

/* -------------------- Page -------------------- */
export default function AuthPageInner() {
  const params = useSearchParams();
  const initialTab = (params.get("tab") as "signin" | "signup") ?? "signin";
  const [tab, setTab] = React.useState<"signin" | "signup">(initialTab);

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 via-purple-100 to-purple-900 px-4 py-10">
      <div className="mx-auto max-w-5xl grid gap-8 lg:grid-cols-2">
        {/* Left: Brand pitch */}
        <section className="rounded-lg border borderc bg-white dark:bg-surface-inverted/60 p-6 shadow-card">
          <h1 className="font-heading text-3xl text-textc">
            Join Jay’s Quiz Hub
          </h1>
          <p className="mt-2 text-textc-muted">
            Track scores, climb leaderboards, and get quiz recaps. Your profile
            syncs across JDQ and JVQ.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-textc">
            <li>• Add & edit your scores</li>
            <li>• See your rank on global boards</li>
            <li>• And soon play live against other quizzers!</li>
          </ul>
        </section>

        {/* Right: Auth card */}
        <Card className="self-start">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Sign in or create a new account</CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs
              items={[
                { id: "signin", label: "Sign in" },
                { id: "signup", label: "Sign up" },
              ]}
              value={tab}
              onChange={(id) => setTab(id as "signin" | "signup")}
              fullWidth
            />

            <div className="mt-6">
              {tab === "signin" ? <SignInForm /> : <SignUpForm />}
            </div>
          </CardContent>

          <CardFooter />
        </Card>
      </div>
    </main>
  );
}
