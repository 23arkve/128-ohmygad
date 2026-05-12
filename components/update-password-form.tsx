"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { Lock } from "lucide-react";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // update the password
      const { data: authData, error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      if (!authData.user) throw new Error("No user session found.");

      // fetch the user profile to chcek their role
      const { data: profile, error: profileError } = await supabase
        .from("profile")
        .select("role, is_onboarded")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("No profile found. Please contact the administrator.");
      }

      // redirect based on onboarding status and role
      if (!profile.is_onboarded) {
        router.push("/auth/onboarding");
        return;
      }
      switch (profile.role) {
        case "admin":
          router.push("/admin");
          break;
        case "faculty":
          router.push("/faculty");
          break;
        case "student":
          router.push("/student");
          break;
        default:
          throw new Error("Your account role is not recognized. Please contact the administrator.");
      }

    } catch (error: unknown) {
      setError("Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("card max-w-md w-full mx-auto h-fit", className)} {...props}>
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="flex flex-col items-center mb-6 text-center">
            <Image
                src="/kasarian-upb-logo.svg"
                alt="UPB Kasarian Gender Studies Program Logo"
                width={120}
                height={120}
                className="w-[70px] h-[70px] md:w-[120px] md:h-[120px]"
            />
            <div className="flex flex-col items-center">
                <p className="body">UP BAGUIO</p>
                <h1 className="heading-lg md:heading-xl uppercase">
                    Kasarian
                </h1>
            </div>
        </div>
        <h2 className="heading-md">Update Password</h2>
        <p className="caption text-[var(--gray)] mt-1">
          Please enter your new password below.
        </p>
      </div>

      <form onSubmit={handleUpdatePassword} className="flex flex-col gap-5">
        
        {/* New Password Input */}
        <div className="input-wrap">
          <label htmlFor="password" className="label">New Password</label>
          <div className="input-icon-wrap">
            <Lock className="input-prefix-icon w-4 h-4" />
            <input
              id="password"
              type="password"
              placeholder="Enter new password"
              required
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </div>
          <span className="hint">Must be at least 8 characters long.</span>
        </div>

        {/* Error Toast */}
        {error && (
          <div className="toast toast-error mt-1">
            <span className="font-semibold text-[var(--error)]">{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button 
          type="submit" 
          className="btn btn-periwinkle w-full justify-center mt-2" 
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save new password"}
        </button>

      </form>
    </div>
  );
}