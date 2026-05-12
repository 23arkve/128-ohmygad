"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { signInWithGoogle } from "@/lib/supabase/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "./ui";
import { ERR } from "@/lib/user-error";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		const supabase = createClient();
		setIsLoading(true);
		setError(null);

		// ----------- TO ADD IN DEPLOYMENT -----------
		// if (!email.endsWith("@up.edu.ph")) {
		// 	setError("Please use your UP Mail (@up.edu.ph) to sign in.");
		// 	setIsLoading(false);
		// 	return;
		// }

		try {
			const { data: authData, error: authError } =
				await supabase.auth.signInWithPassword({ email, password });

			if (authError) throw authError;

			const { data: profile, error: profileError } = await supabase
				.from("profile")
				.select("role, is_onboarded")
				.eq("id", authData.user.id)
				.single();

			if (profileError || !profile) {
				await supabase.auth.signOut();
				throw new Error(
					"No profile found for this account. Please contact the administrator.",
				);
			}

			if (!profile.is_onboarded) {
				router.push("/auth/onboarding");
				return;
			}

			switch (profile.role) {
				case "admin":
					router.push("/admin");
					break;
				case "staff":
					router.push("/staff");
					break;
				case "faculty":
					router.push("/faculty");
					break;
				case "student":
					router.push("/student");
					break;
				default:
					await supabase.auth.signOut();
					throw new Error(
						"Your account role is not recognized. Please contact the administrator.",
					);
			}
		} catch (error: unknown) {
			setError(
				ERR.auth,
			);
		} finally {
			setIsLoading(false);
		}
  };

  return (
    <div className={cn("auth-card w-full", className)} {...props}>
      <div className="mb-6 flex flex-col items-center text-center">
        <h2 className="heading-lg m-1">Welcome!</h2>
        <p className="caption">Sign in to your account to continue.</p>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-5">
        
        {/* Email Input */}
        <div className="input-wrap">
          <label htmlFor="email" className="label">UP Mail</label>
          <div className="input-icon-wrap">
            <Mail className="input-prefix-icon w-4 h-4" />
            <Input
              id="email"
              type="email"
              placeholder="jmdelacruz@up.edu.ph"
            //   required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="input-wrap">
          <label htmlFor="password" className="label">Password</label>
          <div className="input-icon-wrap">
            <Lock className="input-prefix-icon w-4 h-4" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
            //   required
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gray)] hover:text-[var(--text)] transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex justify-end">
            <Link
              href="/auth/forgot-password"
              className="caption hover:text-[var(--primary-dark)] hover:underline underline-offset-4 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Error Toast */}
        {error && (
          <div className="toast toast-error mt-1">
            <span className="font-semibold text-[var(--error)]">{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!email || !password || isLoading}
          variant="primary"
          className="mt-2"
        >
          {isLoading ? "Logging in..." : "Login"}
        </Button>

      </form>

    {/* Sign in With Google */}
    {/* https://developers.google.com/identity/branding-guidelines */}
      <form action={signInWithGoogle} className="flex flex-col gap-4 pt-4 items-center">
        <hr className="w-full border-[var(--gray)] m-4" />
        <Button type="submit" variant="ghost" className="w-full">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlnsXlink="http://www.w3.org/1999/xlink" style={{ display: 'block', width: 20, height: 20, flexShrink: 0 }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
          Sign in with UP Mail
        </Button>
      </form>

      {/* Footer Link */}
      <div className="mt-4 text-center">
        <p className="body">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/sign-up"
            className="font-bold text-[var(--soft-pink)] hover:text-[var(--primary-dark)] transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}