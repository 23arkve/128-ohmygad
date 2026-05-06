"use client";

import { useEffect, useState } from "react";
import "react-day-picker/dist/style.css";
import { Card } from "@/components/ui";
import { CalendarCheck, CheckCircle2, ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { deriveStatus } from "@/components/admin/survey-form";

import {
	CircularProgressbarWithChildren,
	buildStyles,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export default function RightPanel() {
	const [gsoCount, setGsoCount] = useState<number>(0);
	const [ashoCount, setAshoCount] = useState<number>(0);
	const [pendingSurveysCount, setPendingSurveysCount] = useState<number>(0);

	useEffect(() => {
		async function fetchAttendance() {
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (user) {
				const { data } = await supabase
					.from("profile")
					.select("gso_attended, asho_attended")
					.eq("id", user.id)
					.single();

				if (data) {
					setGsoCount(data.gso_attended ?? 0);
					setAshoCount(data.asho_attended ?? 0);
				}

				// ── Fetch surveys already responded to by this user ──
				// Mirrors the same dual-check logic used in surveys-take-page.tsx:
				// 1) localStorage (fast, user-specific key)  2) DB (source of truth)

				// Step 1: Get all surveys for attended events
				const { data: attended } = await supabase
					.from("event_registration")
					.select("event_id")
					.eq("user_id", user.id)
					.eq("attended", true);

				const attendedEventIds = (attended ?? []).map((r) => r.event_id as string);

				if (attendedEventIds.length > 0) {
					const { data: surveys } = await supabase
						.from("survey")
						.select("id, open_at, close_at")
						.in("event_id", attendedEventIds);

					if (surveys) {
						// Step 2: For each open survey, check localStorage then DB
						// (same key format as surveys-take-page.tsx)
						const { data: responses } = await supabase
							.from("survey_responses")
							.select("survey_id")
							.eq("response_token", user.id);

						const dbSubmittedIds = new Set<string>(
							(responses ?? []).map((r) => r.survey_id as string)
						);

						const pendingCount = surveys.filter((s) => {
							const currentStatus = deriveStatus(s.open_at, s.close_at);
							if (currentStatus !== "open") return false;

							// Check localStorage first (same key format as take page)
							const localKey = `survey_${s.id}_submitted_${user.id}`;
							const locallySubmitted =
								typeof window !== "undefined" &&
								localStorage.getItem(localKey) === "true";

							// Check DB
							const dbSubmitted = dbSubmittedIds.has(s.id as string);

							return !locallySubmitted && !dbSubmitted;
						}).length;

						setPendingSurveysCount(pendingCount);
					}
				}
			}
		}

		fetchAttendance();
	}, []);

	return (
		<aside className="flex flex-col gap-4 w-full shrink-0 pb-8">
			{/* GSOs attended */}
			<Card
				variant="no-hover"
				className="flex flex-col gap-3 p-4 transition-all"
			>
				<div className="flex items-center gap-3">
					<CalendarCheck
						size={18}
						style={{ color: "var(--periwinkle)" }}
					/>
					<p className="body">GSOs Attended</p>
				</div>

				<div className="flex flex-col items-center justify-center gap-2 py-2">
					<div className="w-28 h-28 shrink-0">
						<CircularProgressbarWithChildren
							value={gsoCount}
							maxValue={2}
							styles={buildStyles({
								pathColor: "var(--periwinkle)",
								trailColor: "rgba(150, 150, 150, 0.2)",
							})}
						>
							<div className="flex items-baseline m-0">
								<span className="heading-xl">{gsoCount}</span>
								<span className="heading-sm">/2</span>
							</div>
						</CircularProgressbarWithChildren>
					</div>
					<p className="caption text-center">Sessions completed</p>
				</div>
			</Card>

			{/* ASHOs attended */}
			<Card
				variant="no-hover"
				className="flex flex-col gap-3 p-4 transition-all"
			>
				<div className="flex items-center gap-3">
					<CalendarCheck
						size={18}
						style={{ color: "var(--periwinkle)" }}
					/>
					<p className="body">ASHOs Attended</p>
				</div>

				<div className="flex flex-col items-center justify-center gap-2 py-2">
					<div className="w-28 h-28 shrink-0">
						<CircularProgressbarWithChildren
							value={ashoCount}
							maxValue={2}
							styles={buildStyles({
								pathColor: "var(--periwinkle)",
								trailColor: "rgba(150, 150, 150, 0.2)",
							})}
						>
							<div className="flex items-baseline m-0">
								<span className="heading-xl">{ashoCount}</span>
								<span className="heading-sm">/2</span>
							</div>
						</CircularProgressbarWithChildren>
					</div>
					<p className="caption text-center">Sessions completed</p>
				</div>
			</Card>

			{/* pending surveys */}
			<Card
				variant="no-hover"
				className="flex flex-row gap-2 p-4 transition-all justify-between"
			>
				<div className="flex items-center gap-3">
					<ClipboardList
						size={18}
						style={{ color: "var(--periwinkle)" }}
					/>
					<p className="body">Pending Surveys</p>
				</div>
				<p className="heading-xl">{pendingSurveysCount}</p>
			</Card>
		</aside>
	);
}
