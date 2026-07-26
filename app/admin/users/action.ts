"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";

export async function deleteUser(userId: string) {
	const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
	if (authError) {
		console.error("Failed to delete user from Supabase Auth:", authError);
		throw new Error(authError.message || "Failed to delete user from Auth.");
	}

	const { error: profileError } = await supabaseAdmin
		.from("profile")
		.delete()
		.eq("id", userId);

	if (profileError) {
		console.error("Failed to delete user profile:", profileError);
		throw new Error("Failed to delete user profile.");
	}

	return { success: true };
}

export async function deleteUsers(userIds: string[]) {
	for (const id of userIds) {
		const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
		if (authError) {
			console.error(`Failed to delete user ${id} from Supabase Auth:`, authError);
		}
	}

	const { error: profileError } = await supabaseAdmin
		.from("profile")
		.delete()
		.in("id", userIds);

	if (profileError) {
		console.error("Failed to delete profiles:", profileError);
		throw new Error("Failed to delete selected user profiles.");
	}

	return { success: true };
}
