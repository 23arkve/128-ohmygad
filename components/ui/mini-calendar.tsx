"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

interface MiniCalendarProps {
	/** days where an event starts. shows a pink dot. */
	eventDays?: Set<number>;
	/** days where an event is ongoing but didn't start that day. shows a periwinkle dot. */
	ongoingDays?: Set<number>;
	/** called when the user clicks a specific day number. */
	onDayClick?: (date: Date) => void;
}

export function MiniCalendar({
	eventDays = new Set(),
	ongoingDays,
	onDayClick,
}: MiniCalendarProps) {
	const today = new Date();
	const [year, setYear] = useState(today.getFullYear());
	const [month, setMonth] = useState(today.getMonth());

	function prevMonth() {
		if (month === 0) {
			setMonth(11);
			setYear((y) => y - 1);
		} else setMonth((m) => m - 1);
	}
	function nextMonth() {
		if (month === 11) {
			setMonth(0);
			setYear((y) => y + 1);
		} else setMonth((m) => m + 1);
	}

	const firstDay = new Date(year, month, 1).getDay();
	const startOffset = firstDay;
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const cells: (number | null)[] = [
		...Array(startOffset).fill(null),
		...Array.from({ length: daysInMonth }, (_, i) => i + 1),
	];
	while (cells.length % 7 !== 0) cells.push(null);

	const isToday = (d: number | null) =>
		d !== null &&
		d === today.getDate() &&
		month === today.getMonth() &&
		year === today.getFullYear();

	return (
		<div className="flex flex-col gap-1">
			{/* header */}
			<div className="flex items-center justify-between">
				<span className="heading-sm">
					{MONTHS[month]} {year}
				</span>
				<div className="flex items-center gap-1">
					<button
						onClick={prevMonth}
						aria-label="Previous month"
						className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--gray)] hover:bg-[var(--periwinkle-light)] hover:text-[var(--primary-dark)] transition-colors cursor-pointer border-none bg-transparent"
					>
						<ChevronLeft size={13} />
					</button>
					<button
						onClick={nextMonth}
						aria-label="Next month"
						className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--gray)] hover:bg-[var(--periwinkle-light)] hover:text-[var(--primary-dark)] transition-colors cursor-pointer border-none bg-transparent"
					>
						<ChevronRight size={13} />
					</button>
				</div>
			</div>

			{/* grid */}
			<div className="grid grid-cols-7">
				{DAYS.map((d) => (
					<div
						key={d}
						className="aspect-square flex items-center justify-center text-[10px] font-bold text-[var(--gray)] uppercase tracking-wide"
					>
						{d}
					</div>
				))}
				{cells.map((d, i) => (
					<div
						key={i}
						className="aspect-square flex items-center justify-center p-[2px]"
					>
						{d !== null ? (
							<button
								onClick={() =>
									onDayClick?.(new Date(year, month, d))
								}
								className={`w-full h-full rounded-full flex items-center justify-center text-[12px] font-medium transition-all duration-100 border-none relative ${
									isToday(d)
										? "bg-[var(--periwinkle)] text-white font-bold cursor-pointer"
										: "text-[var(--primary-dark)] cursor-pointer bg-transparent hover:bg-[var(--periwinkle-light)] hover:text-[var(--primary-dark)]"
								}`}
							>
								{d}
								{(eventDays.has(d) || ongoingDays?.has(d)) && (
									<span className="absolute bottom-[3px] left-1/2 -translate-x-1/2 flex items-center gap-[2px]">
										{eventDays.has(d) && (
											<span className={`w-[3px] h-[3px] rounded-full shrink-0 ${isToday(d) ? "bg-white" : "bg-[var(--soft-pink)]"}`} />
										)}
										{ongoingDays?.has(d) && (
											<span className={`w-[3px] h-[3px] rounded-full shrink-0 ${isToday(d) ? "bg-white/60" : "bg-[var(--periwinkle)]"}`} />
										)}
									</span>
								)}
							</button>
						) : null}
					</div>
				))}
			</div>
			{/* legend */}
			<div className="flex flex-col gap-1 mt-3 px-2">
				<div className="flex items-center gap-2">
					<span className="w-[4px] h-[4px] rounded-full bg-[var(--soft-pink)] shrink-0" />
					<span className="text-[12px] uppercase tracking-wide text-[var(--gray)]">Event starts</span>
				</div>
				<div className="flex items-center gap-2">
					<span className="w-[4px] h-[4px] rounded-full bg-[var(--periwinkle)] shrink-0" />
					<span className="text-[12px] uppercase tracking-wide text-[var(--gray)]">Event ongoing</span>
				</div>
			</div>
		</div>
	);
}
