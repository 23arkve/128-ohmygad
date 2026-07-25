"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Mail, Lock, KeyRound
} from "lucide-react";

import { Card, Input, Button, Toast, PulsingLoader } from "@/components/ui";

type ToastState = { type: "success" | "error" | "info"; message: string } | null;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export default function SharedSettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  // states
  const [loading, setLoading] = useState(true);
  const [currentEmail, setCurrentEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  
  // email form states
  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  // password form states
  const [hasPasswordLogin, setHasPasswordLogin] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const [toast, setToast] = useState<ToastState>(null);
  const lastEmailValidationToast = useRef<string | null>(null);
  const lastPasswordValidationToast = useRef<string | null>(null);

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

  function notifyEmailValidation(message: string | null) {
    if (!message) {
      lastEmailValidationToast.current = null;
      return;
    }
    if (lastEmailValidationToast.current !== message) {
      setToast({ type: "error", message });
      lastEmailValidationToast.current = message;
    }
  }

  function notifyPasswordValidation(message: string | null) {
    if (!message) {
      lastPasswordValidationToast.current = null;
      return;
    }
    if (lastPasswordValidationToast.current !== message) {
      setToast({ type: "error", message });
      lastPasswordValidationToast.current = message;
    }
  }

  function getEmailValidationError(email: string) {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return "Please enter a new email address.";
    if (trimmedEmail === currentEmail) {
      return "New email must be different from your current email.";
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return "Please enter a valid email address.";
    }
    return null;
  }

  function getPasswordValidationError(values: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }, touched: {
    current: boolean;
    next: boolean;
    confirm: boolean;
  }) {
    if (touched.current && !values.currentPassword) {
      return "Please enter your current password.";
    }
    if (touched.next) {
      if (!values.newPassword) {
        return "Please enter a new password.";
      }
      if (values.newPassword.length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
      }
      if (values.currentPassword && values.newPassword === values.currentPassword) {
        return "New password must be different from your current password.";
      }
    }
    if (touched.confirm) {
      if (!values.confirmPassword) {
        return "Please confirm your new password.";
      }
      if (values.newPassword && values.confirmPassword && values.newPassword !== values.confirmPassword) {
        return "Passwords do not match.";
      }
    }
    return null;
  }

  // handle email update
  async function handleUpdateEmail(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = newEmail.trim();
    const validationError = getEmailValidationError(trimmedEmail);
    if (validationError) {
      setEmailTouched(true);
      notifyEmailValidation(validationError);
      return;
    }

    setSavingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: trimmedEmail });
      
      if (error) {
        setToast({ type: "error", message: error.message });
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
    const validationError = getPasswordValidationError({
      currentPassword,
      newPassword,
      confirmPassword,
    }, { current: true, next: true, confirm: true });
    if (validationError) {
      setPasswordTouched({ current: true, next: true, confirm: true });
      notifyPasswordValidation(validationError);
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
                setToast({ type: "error", message: "Current password is incorrect." });
                return;
            }

            // 2. current password is correct
            const { error } = await supabase.auth.updateUser({ password: newPassword });
        
            if (error) throw error;
        
            setToast({
                type: "success",
                message: "Password updated successfully!"
            });

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        }   catch (error: any) {
                setToast({ type: "error", message: error.message || "Failed to update password. Please try again." });
        }   finally {
                setSavingPassword(false);
            }
        }

        if (loading) {
            return (
				<div className="flex-1 flex items-center justify-center h-full min-h-0">
					<PulsingLoader variant="breath" />
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
              onChange={(e) => {
                const value = e.target.value;
                setNewEmail(value);
                setEmailTouched(true);
                const error = getEmailValidationError(value);
                if (emailTouched || value) notifyEmailValidation(error);
              }}
              required
              prefixIcon={<Mail size={15} />}
            />

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
                Ensure your account is using a long, random password to stay secure. It must be at least 8 characters long.
                </p>
            </div>

            {/* form side */}
            <form onSubmit={handleUpdatePassword} className="w-full flex flex-col gap-3">
                <Input
                    label="Current Password"
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCurrentPassword(value);
                      setPasswordTouched((prev) => ({ ...prev, current: true }));
                      const error = getPasswordValidationError(
                        { currentPassword: value, newPassword, confirmPassword },
                        { ...passwordTouched, current: true },
                      );
                      notifyPasswordValidation(error);
                    }}
                    required
                    maxLength={16}
                    prefixIcon={<KeyRound size={15} />}
                />
                <Input
                    label="New Password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewPassword(value);
                      setPasswordTouched((prev) => ({ ...prev, next: true }));
                      const error = getPasswordValidationError(
                        { currentPassword, newPassword: value, confirmPassword },
                        { ...passwordTouched, next: true },
                      );
                      notifyPasswordValidation(error);
                    }}
                    required
                    maxLength={16}
                    prefixIcon={<KeyRound size={15} />}
                />
                <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      const value = e.target.value;
                      setConfirmPassword(value);
                      setPasswordTouched((prev) => ({ ...prev, confirm: true }));
                      const error = getPasswordValidationError(
                        { currentPassword, newPassword, confirmPassword: value },
                        { ...passwordTouched, confirm: true },
                      );
                      notifyPasswordValidation(error);
                    }}
                    required
                    maxLength={16}
                    prefixIcon={<KeyRound size={15} />}
                />

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