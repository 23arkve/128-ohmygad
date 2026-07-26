"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";

export async function deleteUser(userId: string) {
	await supabaseAdmin.auth.admin.deleteUser(userId);

	const { error } = await supabaseAdmin
		.from("profile")
		.delete()
		.eq("id", userId);

	if (error) {
		throw new Error("Failed to delete user.");
	}

	return { success: true };
}

export async function deleteUsers(userIds: string[]) {
	for (const id of userIds) {
		await supabaseAdmin.auth.admin.deleteUser(id);
	}

	const { error } = await supabaseAdmin
		.from("profile")
		.delete()
		.in("id", userIds);

	if (error) throw new Error("Failed to delete selected users.");
	return { success: true };
}
