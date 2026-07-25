"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { Provider } from "@supabase/supabase-js";
import { createClientForServer } from "@/lib/supabase/server";

const getSiteUrl = async () => {
	try {
		const headerList = await headers();
		const host = headerList.get("host");
		const proto =
			headerList.get("x-forwarded-proto") ||
			(host?.includes("localhost") || host?.includes("127.0.0.1") ? "http" : "https");
		if (host) {
			return `${proto}://${host}`;
		}
	} catch {
		// fallback
	}
	const url = process.env.SITE_URL || "http://localhost:3000";
	return url.trim().replace(/\/+$/, "");
};

const signInWith = (provider: Provider) => async (formData?: FormData) => {
	const supabase = await createClientForServer();
	const eventId = formData?.get("eventId") as string | undefined;
	if (eventId) {
		const cookieStore = await cookies();
		cookieStore.set("event_redirect_id", eventId, { path: "/", maxAge: 600 });
	}
	const siteUrl = await getSiteUrl();
	const auth_callback_url = `${siteUrl}/auth/callback`;

	const { data, error } = await supabase.auth.signInWithOAuth({
		provider,
		options: {
			redirectTo: auth_callback_url,
		},
	});

	if (error) {
		console.error(error);
		return;
	}

	if (data.url) {
		redirect(data.url);
	}
};

const signUpWithGoogle = async (formData?: FormData) => {
	const supabase = await createClientForServer();
	const eventId = formData?.get("eventId") as string | undefined;
	if (eventId) {
		const cookieStore = await cookies();
		cookieStore.set("event_redirect_id", eventId, { path: "/", maxAge: 600 });
	}
	const siteUrl = await getSiteUrl();
	const auth_callback_url = `${siteUrl}/auth/callback?next=onboarding`;

	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: "google",
		options: {
			redirectTo: auth_callback_url,
		},
	});

	if (error) {
		console.error(error);
		return;
	}

	if (data.url) {
		redirect(data.url);
	}
};

const signInWithGoogle = signInWith("google");

export { signInWithGoogle, signUpWithGoogle };
