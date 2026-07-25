"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { signUpWithGoogle } from "@/lib/supabase/actions";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { validateFullName, validatePassword } from "@/lib/validation";
import { Input, PulsingLoader } from "./ui";
import { ERR } from "@/lib/user-error";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event");
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const checkExistingSession = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profile")
          .select("role, is_onboarded")
          .eq("id", user.id)
          .single();

        if (profile && profile.is_onboarded) {
          const roleRoutes: Record<string, string> = {
            admin: "/admin/events",
            staff: "/staff/events",
            faculty: "/faculty/events",
            student: "/student/events",
          };

          const defaultRoleRoutes: Record<string, string> = {
            admin: "/admin",
            staff: "/staff",
            faculty: "/faculty",
            student: "/student",
          };

          const targetRoute = eventId
            ? `${roleRoutes[profile.role] ?? "/student/events"}?event=${eventId}`
            : (defaultRoleRoutes[profile.role] ?? "/");

          router.push(targetRoute);
          return;
        }
      }
      setIsCheckingSession(false);
    };

    checkExistingSession();
  }, [eventId, router]);

  if (isCheckingSession) {
    return (
      <div
        className={cn(
          "auth-card max-w-md w-full mx-auto flex items-center justify-center p-12 min-h-[360px]",
          className,
        )}
        {...props}
      >
        <PulsingLoader variant="breath" />
      </div>
    );
  }

  const handleSignUp = async (e: React.FormEvent) => {
		e.preventDefault();
		const supabase = createClient();
		setIsLoading(true);
		setError(null);

		// ----------- TO ADD IN DEPLOYMENT -----------
		// if(!email.endsWith("@up.edu.ph")) {
		//   setError("Please use your UP Mail (@up.edu.ph) to sign up.");
		//   setIsLoading(false);
		//   return;
		// }

		if (password !== repeatPassword) {
			setError("Passwords do not match");
			setIsLoading(false);
			return;
		}

		if (full_name) {
			const nameErr = validateFullName(full_name);
			if (nameErr) {
				setError(nameErr);
				setIsLoading(false);
				return;
			}
		}

		const pwErr = validatePassword(password);
		if (pwErr) {
			setError(pwErr);
			setIsLoading(false);
			return;
		}

		try {
			const { error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					emailRedirectTo: `${window.location.origin}/auth/onboarding`, // redirect to onboarding after email confirm
					data: {
						full_name, // passed to trigger via raw_user_meta_data
					},
				},
			});
			if (error) throw error;
			router.push("/auth/sign-up-success");
		} catch (error: unknown) {
			setError(
				ERR.auth,
			);
		} finally {
			setIsLoading(false);
		}
  };

  return (
    <div className={cn("auth-card max-w-md w-full mx-auto", className)} {...props}>
      <div className="mb-6 flex flex-col items-center text-center">
        <h2 className="heading-lg m-1">Sign up</h2>
        <p className="caption">Create an account to get started.</p>
      </div>

      {eventId && (
        <div className="mb-4 p-3 rounded-lg bg-[var(--lavender)] text-[var(--primary-dark)] text-center text-sm font-semibold border border-[var(--soft-pink)]">
          Please sign up to register for this event!
        </div>
      )}

      <form onSubmit={handleSignUp} className="flex flex-col gap-3">

        {/* Full Name Input */}
        <div className="input-wrap">
          <label htmlFor="full_name" className="label">Full Name</label>
          <div className="input-icon-wrap">
            <User className="input-prefix-icon w-4 h-4" />
            <Input
              id="full_name"
              type="text"
              required
              value={full_name}
              onChange={(e) => setFullName(e.target.value)}
              className="input"
              maxLength={64}
            />
          </div>
        </div>

        {/* Email Input */}
        <div className="input-wrap">
          <label htmlFor="email" className="label">UP Mail</label>
          <div className="input-icon-wrap">
            <Mail className="input-prefix-icon w-4 h-4" />
            <Input
              id="email"
              type="email"
              placeholder="jmdelacruz@up.edu.ph"
              required
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
              required
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
        </div>

        {/* Repeat Password Input */}
        <div className="input-wrap">
          <label htmlFor="repeat-password" className="label">Repeat Password</label>
          <div className="input-icon-wrap">
            <Lock className="input-prefix-icon w-4 h-4" />
            <Input
              id="repeat-password"
              type={showRepeatPassword ? "text" : "password"}
              required
              maxLength={128}
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              className={cn(
                "input",
                password && repeatPassword && password !== repeatPassword && "input-error"
              )}
            />
            <button
              type="button"
              onClick={() => setShowRepeatPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gray)] hover:text-[var(--text)] transition-colors"
              tabIndex={-1}
            >
              {showRepeatPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
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
          disabled={!email || !password || !repeatPassword || isLoading}
          variant="primary"
          className="mt-2"
        >
          {isLoading ? "Creating an account..." : "Sign up"}
        </Button>

        {/* Footer Link */}
        <div className="mt-2 text-center">
          <p className="body">
            Already have an account?{" "}
            <Link
              href={eventId ? `/auth/login?event=${eventId}` : "/auth/login"}
              className="font-bold text-[var(--periwinkle)] hover:text-[var(--primary-dark)] transition-colors"
            >
              Login
            </Link>
          </p>
        </div>
      </form>

      {/* Sign in With Google */}
        {/* https://developers.google.com/identity/branding-guidelines */}
        <form action={signUpWithGoogle} className="flex flex-col gap-4 pt-4 items-center">
            {eventId && <input type="hidden" name="eventId" value={eventId} />}
            <hr className="w-full border-[var(--gray)] m-4" />
            <Button type="submit" variant="ghost" className="w-full">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlnsXlink="http://www.w3.org/1999/xlink" style={{ display: 'block', width: 20, height: 20, flexShrink: 0 }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
            Sign up with UP Mail
            </Button>
        </form>
    </div>
  );
}