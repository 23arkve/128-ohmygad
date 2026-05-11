"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EventPanel } from "@/components/shared/event-panel";
import { Card } from "@/components/ui";
import ScrollToTop from "../ui/scroll-to-top";
import GlobalSearch from "../global-search";

interface DashboardPageProps {
	role?: "admin" | "staff" | "faculty" | "student";
	rightPanel?: React.ReactNode;
}

export default function DashboardPage({
	role = "student",
	rightPanel,
}: DashboardPageProps) {
	const [displayName, setDisplayName] = useState<string>("...");

	useEffect(() => {
		const fetchName = async () => {
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) return;

			const { data } = await supabase
				.from("profile")
				.select("display_name, full_name")
				.eq("id", user.id)
				.single();

			setDisplayName(data?.display_name || data?.full_name || "User");
		};

		fetchName();
	}, []);

	return (
		<div className="w-full flex flex-col gap-4 md:gap-6 animate-in fade-in duration-500">
			{/* dashboard header */}
			<div className="shrink-0 animate-in slide-in-from-bottom-2 duration-500 w-full flex">
				<div className="flex flex-col gap-2 md:gap-4 w-full">
					<p className="heading-md">Good day, {displayName}!</p>
					<div>
						<GlobalSearch
							role={role}
							placeholder="Search events, guidelines, surveys..."
						/>
					</div>
				</div>
			</div>

			{/* main grid: events panel left, right panel right on lg+ devices */}
			<div className="flex gap-4 md:gap-6 md:mb-2 flex-1 min-h-10 w-full">
				<Card
					variant="no-hover"
					className="flex flex-col overflow-y-auto min-h-0 flex-1 min-w-0"
				>
					<EventPanel />
				</Card>

				{rightPanel && (
					<div className="hidden lg:flex flex-col gap-4 min-h-0 overflow-y-scroll w-[340px] shrink-0">
						{rightPanel}
					</div>
				)}
			</div>

			{rightPanel && (
				<div className="flex lg:hidden flex-col gap-4 md:px-10">
					{rightPanel}
				</div>
			)}

			{/* scroll to top */}
			<ScrollToTop />
		</div>
	);
}
