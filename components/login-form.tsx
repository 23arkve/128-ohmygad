"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { signInWithGoogle } from "@/lib/supabase/actions";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PulsingLoader } from "./ui";
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
					"auth-card w-full flex items-center justify-center p-12 min-h-[320px]",
					className,
				)}
				{...props}
			>
				<PulsingLoader variant="breath" />
			</div>
		);
	}

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
		} catch (error: unknown) {
			setError(ERR.auth);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className={cn("auth-card w-full", className)} {...props}>
			<div className="mb-2     flex flex-col items-center text-center">
				<h2 className="heading-lg m-1">Welcome!</h2>
				<p className="caption">Sign in to your account to continue.</p>
			</div>

			{eventId && (
				<div className="rounded-full mb-4 p-3 bg-[var(--lavender)] text-[var(--primary-dark)] text-center text-sm font-semibold border border-[var(--soft-pink)]">
					Please log in to register for this event!
				</div>
			)}

			{/* Sign in With Google */}
			{/* https://developers.google.com/identity/branding-guidelines */}
			<form
				action={signInWithGoogle}
				className="flex flex-col gap-4 pt-4 items-center"
			>
				{eventId && (
					<input type="hidden" name="eventId" value={eventId} />
				)}

				<Button type="submit" variant="ghost" className="w-full">
					<svg
						version="1.1"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 48 48"
						xmlnsXlink="http://www.w3.org/1999/xlink"
						style={{
							display: "block",
							width: 20,
							height: 20,
							flexShrink: 0,
						}}
					>
						<path
							fill="#EA4335"
							d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
						></path>
						<path
							fill="#4285F4"
							d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
						></path>
						<path
							fill="#FBBC05"
							d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
						></path>
						<path
							fill="#34A853"
							d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
						></path>
						<path fill="none" d="M0 0h48v48H0z"></path>
					</svg>
					Sign in with Google
				</Button>
			</form>

			{/* Footer Link */}
			<div className="mt-4 text-center">
				<p className="body">
					Don&apos;t have an account?{" "}
					<Link
						href={
							eventId
								? `/auth/sign-up?event=${eventId}`
								: "/auth/sign-up"
						}
						className="font-bold text-[var(--soft-pink)] hover:text-[var(--primary-dark)] transition-colors"
					>
						Sign up
					</Link>
				</p>
			</div>
		</div>
	);
}
