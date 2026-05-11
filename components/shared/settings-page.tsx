"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Mail, Lock, KeyRound, AlertCircle
} from "lucide-react";

import { Card, Input, Button, Toast } from "@/components/ui";

type ToastState = { type: "success" | "error" | "info"; message: string } | null;

export default function SharedSettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  // states
  const [loading, setLoading] = useState(true);
  const [currentEmail, setCurrentEmail] = useState("");
  
  // email form states
  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  // password form states
  const [hasPasswordLogin, setHasPasswordLogin] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  // auto-hide toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function fetchUser() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/auth/login");
      return;
    }

    setCurrentEmail(user.email ?? "");

    // true only if they signed up with email and password
    const hasEmail = user.identities?.some((i) => i.provider === "email") ?? false;
    setHasPasswordLogin(hasEmail);

    setLoading(false);
  }

  // handle email update
  async function handleUpdateEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail || newEmail === currentEmail) return;

    setEmailError(null);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      
      if (error) {
        setEmailError(error.message);
        return;
      }
      
      setToast({ 
        type: "info", 
        message: "Verification links sent! Please check both your old and new email inboxes to confirm the change." 
      });
      setNewEmail(""); // clear input
    } catch (error: any) {
      setToast({ type: "error", message: "Failed to update email. Please try again." });
    } finally {
      setSavingEmail(false);
    }
  }

  // handle password update
  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);

        if (!currentPassword) {
            setPasswordError("Please enter your current password.");
            return;
        }
        
        if (newPassword.length < 6) {
            setPasswordError("Password must be at least 6 characters long.");
            return;
        }
        
        if (newPassword !== confirmPassword) {
            setPasswordError("Passwords do not match.");
            return;
        }

        setSavingPassword(true);

        try {
            // 1. verify current password by signing in again
            const { error: signInError } = await supabase.auth.signInWithPassword(
                {
                    email: currentEmail,
                    password: currentPassword,
                }
            );
            if (signInError) {
                setPasswordError("Current password is incorrect.");
                return;
            }

            // 2. current password is correct
            const { error } = await supabase.auth.updateUser({ password: newPassword });
        
            if (error) throw error;
        
            setToast({
                type: "success",
                message: "Password updated successfully!"
            });

            setNewPassword("");
            setConfirmPassword("");
        }   catch (error: any) {
                setPasswordError(error.message || "Failed to update password. Please try again.");
        }   finally {
                setSavingPassword(false);
            }
        }

        if (loading) {
            return (
            <div className="flex-1 flex items-center justify-center h-full min-h-0">
                <div className="w-8 h-8 border-4 border-[var(--periwinkle-light)] border-t-[var(--periwinkle)] rounded-full animate-spin"></div>
            </div>
        );
    }

  return (
    <div className="w-full mx-auto flex flex-col gap-4 lg:gap-6 animate-in fade-in duration-500 pb-24 lg:pb-6">

      {/* content cards wrapper */}
      <div className="flex flex-col md:flex-row gap-6">

        {/* email section */}
        <Card className="flex flex-col gap-4">
          
          {/* description side */}
          <div className="w-full shrink-0">
            <h2 className="heading-md mb-2">Change Email Address</h2>
            <p className="body leading-relaxed">
              Update the email address associated with your account. We will send a verification link to your new address to confirm ownership.
            </p>
          </div>

          {/* form side */}
          <form onSubmit={handleUpdateEmail} className="w-full flex flex-col gap-3">
            <Input
              label="Current Email"
              value={currentEmail}
              disabled
              prefixIcon={<Lock size={15} />}
            />
            <Input
              label="New Email"
              type="email"
              placeholder="e.g. new.email@up.edu.ph"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              prefixIcon={<Mail size={15} />}
            />

            {emailError && (
              <div className="toast toast-error py-2 px-3 mt-1">
                <span className="text-xs font-semibold text-[var(--error)]">{emailError}</span>
              </div>
            )}
            <div className="flex justify-end mt-2">
              <Button 
                type="submit" 
                variant="primary" 
                disabled={savingEmail || !newEmail || newEmail === currentEmail}
                className="w-full md:w-auto px-8"
              >
                {savingEmail ? "Sending Verification..." : "Update Email"}
              </Button>
            </div>
          </form>
        </Card>

        {/* password section */}
        {hasPasswordLogin ? (
            <Card className="flex flex-col gap-4">
            
            {/* description side */}
            <div className="w-full shrink-0">
                <h2 className="heading-md mb-2">Change Password</h2>
                <p className="text-sm text-[var(--gray)] leading-relaxed">
                Ensure your account is using a long, random password to stay secure. It must be at least 6 characters long.
                </p>
            </div>

            {/* form side */}
            <form onSubmit={handleUpdatePassword} className="w-full flex flex-col gap-3">
                <Input
                    label="Current Password"
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    maxLength={16}
                    prefixIcon={<KeyRound size={15} />}
                />
                <Input
                    label="New Password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    maxLength={16}
                    prefixIcon={<KeyRound size={15} />}
                />
                <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    maxLength={16}
                    prefixIcon={<KeyRound size={15} />}
                />
                
                {/* inline error */}
                {passwordError && (
                  <div className="toast toast-error py-2 px-3 mt-1">
                    <span className="text-xs font-semibold text-[var(--error)]">{passwordError}</span>
                  </div>
                )}

                <div className="flex justify-end mt-2">
                <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                    className="w-full md:w-auto px-8"
                >
                    {savingPassword ? "Updating..." : "Update Password"}
                </Button>
                </div>
            </form>
            </Card>
        ) : (
            <Card className="flex flex-col gap-4">
                <h2 className="heading-md mb-2">Change Password</h2>
                <div className="flex flex-col items-center justify-center flex-1">
                    <p className="body text-center">
                        Your account uses Google Sign-In. Password management is handled through your Google account.
                    </p>
                </div>
                
            </Card>
        )}
        
      </div>

      {/* fixed toast notification */}
      {toast && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-6 z-[9999] animate-in fade-in-50">
          <Toast variant={toast.type === "info" ? "warning" : toast.type} title={toast.message} />
        </div>
      )}
    </div>
  );
}