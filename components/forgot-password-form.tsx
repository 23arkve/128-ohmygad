"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { MailCheck } from "lucide-react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("card max-w-md w-full mx-auto", className)} {...props}>
      {success ? (
        <div className="flex flex-col items-center text-center py-6">
            
          <div className="w-16 h-16 rounded-full bg-[var(--periwinkle-light)] text-[var(--periwinkle)] flex items-center justify-center mb-6">
            <MailCheck className="w-8 h-8" strokeWidth={2.5} />
          </div>
          <h2 className="heading-lg mb-2">Check Your Email</h2>
          <p className="body text-[var(--gray)] mb-8">
            If you registered using your email, you will receive a password reset link shortly.
          </p>
          <Link href="/auth/login" className="btn btn-ghost w-full justify-center">
            Return to Login
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center mb-6 text-center">
            <h2 className="heading-lg">Reset Password</h2>
            <p className="body text-[var(--gray)] mt-1">
              Enter your email and we&apos;ll send you instructions to reset your password.
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="flex flex-col gap-5">
            <div className="input-wrap">
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
              />
            </div>

            {error && (
              <div className="toast toast-error mt-1">
                <span className="font-semibold text-[var(--error)]">{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-periwinkle w-full justify-center mt-2" 
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>

            <div className="mt-2 text-center">
              <p className="body">
                Remember your password?{" "}
                <Link
                  href="/auth/login"
                  className="font-bold text-[var(--primary-dark)] hover:text-[var(--periwinkle)] transition-colors"
                >
                  Log in
                </Link>
              </p>
            </div>
          </form>
        </>
      )}
    </div>
  );
}