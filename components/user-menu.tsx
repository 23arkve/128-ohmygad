"use client";

import { useEffect, useState } from "react";
import { User, Settings, LogOut } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { Dropdown, DropdownItem, DropdownDivider } from "@/components/ui";

type Role = "admin" | "student" | "faculty";

const supabase = createBrowserClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
``;

export default function UserMenu() {
	const [role, setRole] = useState<Role | null>(null);
	const [displayName, setDisplayName] = useState("");
	const router = useRouter();

	useEffect(() => {
		async function fetchUser() {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return;

			const { data: profile } = await supabase
				.from("profile")
				.select("role, full_name")
				.eq("id", user.id)
				.single();

			if (profile?.role) setRole(profile.role as Role);
			if (profile?.full_name) setDisplayName(profile.full_name.trim());
		}
		fetchUser();
	}, []);

	const handleSignOut = async () => {
		await supabase.auth.signOut();
		router.push("/auth/login");
	};

	const getProfilePath = () => (role ? `/${role}/profile` : "/auth/login");
	const getSettingsPath = () => (role ? `/${role}/settings` : "/auth/login");

	return (
		<Dropdown
			trigger={
				<button
					aria-label="User menu"
					className="flex items-center gap-2 cursor-pointer border-none bg-transparent select-none hover:opacity-80 transition-opacity duration-150"
				>
					<div className="w-9 h-9 bg-[var(--primary-dark)] rounded-full flex items-center justify-center shrink-0 text-white">
						<User size={17} />
					</div>
					{displayName && (
						<span className="hidden sm:block text-md font-semibold truncate max-w-[150px]">
							{displayName.split(" ")[0]}
						</span>
					)}
				</button>
			}
		>
			<DropdownItem
				icon={<User size={15} />}
				onClick={() => router.push(getProfilePath())}
			>
				My Profile
			</DropdownItem>

			<DropdownItem
				icon={<Settings size={15} />}
				onClick={() => router.push(getSettingsPath())}
			>
				Settings
			</DropdownItem>

			<DropdownDivider />

			<DropdownItem
				icon={<LogOut size={15} />}
				danger
				onClick={handleSignOut}
			>
				Sign out
			</DropdownItem>
		</Dropdown>
	);
}
