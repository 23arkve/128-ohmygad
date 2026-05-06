"use client";

import { useEffect, useState, useMemo } from "react";
import {
	Users,
	Calendar,
	UserCheck,
	ClipboardList,
	BookOpen,
} from "lucide-react";
import {
	Card,
	StatCard,
	Button,
	MiniCalendar,
	TodayTimeline,
	DateRangePicker,
	DashboardFilter,
	EmptyFilters,
	Modal,
	SearchBar,
} from "@/components/ui";
import { Pagination } from "@/components/pagination";
import type { DateRange, DashboardFilters } from "@/components/ui";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	Legend,
	BarChart,
	Bar,
	LabelList,
} from "recharts";
import { useDashboardData } from "./hooks/use-dashboard-data";
import { useSurveyCompletionRates } from "./hooks/use-survey-completion-rates";
import GlobalSearch from "@/components/global-search";
import EventForm from "@/components/admin/event-form";
import UserForm from "@/components/admin/user-form";
import CourseForm from "@/components/admin/course-form";
import SurveyForm from "@/components/admin/survey-form";

// constants ------------------------------------------------
const BRAND_COLORS = [
	"#B8B5E8",
	"#F4A7B9",
	"#6DC5A0",
	"#F4C97A",
	"#9B9BB4",
	"#2D2A4A",
];
const AXIS_COLOR = "rgba(45,42,74,0.10)";
const TICK_COLOR = "rgba(45,42,74,0.45)";

const SURVEY_COMPLETED_COLOR = "var(--success)";
const SURVEY_INCOMPLETE_COLOR = "var(--warning)";

const COLLEGE_COLORS: Record<string, string> = {
	CS: "#6DC5A0",
	CAC: "#F4A7B9",
	CSS: "#B8B5E8",
};

const SEX_COLORS: Record<string, string> = {
	Male: "#B8B5E8",
	Female: "#F4A7B9",
	Intersex: "#6DC5A0",
	"Prefer not to say": "#9B9BB4",
};

const GENDER_COLORS: Record<string, string> = {
	Man: "#B8B5E8",
	Woman: "#F4A7B9",
	"Non-binary": "#6DC5A0",
	Genderqueer: "#F4C97A",
	Genderfluid: "#9B9BB4",
	"Prefer not to say": "#9B9BB4",
};

function colorFor(map: Record<string, string>, key: string, idx: number) {
	return map[key] ?? BRAND_COLORS[idx % BRAND_COLORS.length];
}

// tooltip ------------------------------------------------
interface TooltipEntry {
	color?: string;
	payload?: {
		fill?: string;
		eventTitle?: string;
		completedCount?: number;
		respondentCount?: number;
		totalRegistrations?: number;
	};
	name?: string;
	dataKey?: string;
	value?: number | string;
}
function CustomTooltip({
	active,
	payload,
	label,
}: {
	active?: boolean;
	payload?: TooltipEntry[];
	label?: string;
}) {
	if (!active || !payload?.length) return null;
	const firstPayload =
		payload.find((entry) => entry.payload?.respondentCount !== undefined || entry.payload?.completedCount !== undefined || entry.payload?.totalRegistrations !== undefined)
			?.payload ?? payload[0]?.payload;
	const eventTitle = firstPayload?.eventTitle;
	const totalRespondents = firstPayload?.respondentCount ?? firstPayload?.completedCount;
	const totalAttendees = firstPayload?.totalRegistrations;
	return (
		<div className="bg-white/90 backdrop-blur-md border border-black/[0.07] shadow-[var(--shadow-float)] rounded-xl p-2 min-w-[160px]">
			{label && (
				<p className="body uppercase tracking-wider mb-1.5">{label}</p>
			)}
			{eventTitle && (
				<p className="caption text-[var(--gray)] mb-1">Linked event: {eventTitle}</p>
			)}
			{typeof totalRespondents === "number" && typeof totalAttendees === "number" && (
				<p className="caption text-[var(--gray)] mb-1">
					Respondents: {totalRespondents} / {totalAttendees} attendees
				</p>
			)}
			{typeof totalRespondents === "number" && typeof totalAttendees !== "number" && (
				<p className="caption text-[var(--gray)] mb-1">
					Respondents: {totalRespondents}
				</p>
			)}
			{typeof totalAttendees === "number" && typeof totalRespondents !== "number" && (
				<p className="caption text-[var(--gray)] mb-1">
					Attendees: {totalAttendees}
				</p>
			)}
			{payload.map((e: TooltipEntry, i: number) => (
				<div key={i} className="flex items-center gap-2">
					<span
						className="w-4 h-4 rounded-full shrink-0"
						style={{ background: e.color ?? e.payload?.fill }}
					/>
					<span className="caption capitalize">
						{e.name ?? e.dataKey}: {e.value}{(e.name === "Completed" || e.name === "Incomplete") ? "%" : ""}
					</span>
				</div>
			))}
		</div>
	);
}

// dummy data for line chart to see
const DUMMY_ATTENDANCE = [
	{ month: "Aug", attendees: 24 },
	{ month: "Sep", attendees: 61 },
	{ month: "Oct", attendees: 45 },
	{ month: "Nov", attendees: 78 },
	{ month: "Dec", attendees: 32 },
	{ month: "Jan", attendees: 55 },
	{ month: "Feb", attendees: 90 },
	{ month: "Mar", attendees: 67 },
	{ month: "Apr", attendees: 41 },
	{ month: "May", attendees: 83 },
];

// ------------------------------------------------ DASHBOARD PAGE ------------------------------------------------
export default function DashboardPage() {
	const [attendanceRange, setAttendanceRange] = useState<DateRange>(() => {
		const now = new Date();
		const start = new Date(now);
		start.setDate(start.getDate() - 7);
		const iso = (d: Date) =>
			`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
		return { from: iso(start), to: iso(now) };
	});
	const [filters, setFilters] = useState<DashboardFilters>(EmptyFilters);
	const [surveySearch, setSurveySearch] = useState("");
	const [surveyPage, setSurveyPage] = useState(1);

	// quick action modals
	const [activeModal, setActiveModal] = useState<
		"event" | "user" | "course" | "survey" | null
	>(null);
	const closeModal = () => setActiveModal(null);

	const {
		eventAttendanceData,
		sexAtBirthData,
		genderIdentityData,
		breakdownData,
		userStats,
		gadEventsCount,
		surveysCount,
		todayEvents,
		filterOptions,
		loading,
		attendanceLoading,
	} = useDashboardData(attendanceRange, filters);

	const { data: surveyCompletionData, loading: surveyCompletionLoading } =
		useSurveyCompletionRates();

	const filteredColleges = useMemo(
		() =>
			(breakdownData ?? []).filter((item: { category?: string }) =>
				["CS", "CAC", "CSS"].some((c) =>
					item.category?.toUpperCase().includes(c),
				),
			),
		[breakdownData],
	);
	const filteredGenders = useMemo(
		() =>
			(genderIdentityData ?? []).filter(
				(item: { name?: string; category?: string }) => {
					const label = item.name ?? item.category ?? "";
					return [
						"Man",
						"Woman",
						"Non-binary",
						"Genderqueer",
						"Genderfluid",
						"Prefer not to say",
					].some((g) => label.includes(g));
				},
			),
		[genderIdentityData],
	);

	const surveyCompletionFiltered = useMemo(() => {
		const searchTerm = surveySearch.trim().toLowerCase();
		return [...(surveyCompletionData ?? [])]
			.filter((item) =>
				(item.title ?? "").toLowerCase().includes(searchTerm),
			)
			.sort((a, b) => b.completedPct - a.completedPct);
	}, [surveyCompletionData, surveySearch]);

	const surveyPageCount = Math.max(
		1,
		Math.ceil(surveyCompletionFiltered.length / 4),
	);
	const surveyCompletionChartData = useMemo(() => {
		const startIndex = (surveyPage - 1) * 4;
		return surveyCompletionFiltered
			.slice(startIndex, startIndex + 4)
			.map((item) => ({
				...item,
				respondentCount: item.respondentCount ?? item.completedCount,
			}));
	}, [surveyCompletionFiltered, surveyPage]);

	useEffect(() => {
		if (surveyPage > surveyPageCount) {
			setSurveyPage(1);
		}
	}, [surveyPage, surveyPageCount]);

	return (
		<div className="flex flex-col gap-5 w-full animate-in fade-in duration-500">
			{/* greeting ------------------------------------------------ */}
			<div className="flex items-center justify-between w-full">
				<h2 className="heading-md">Good day, Admin!</h2>
				<DashboardFilter
					value={filters}
					onChange={setFilters}
					options={filterOptions}
				/>
			</div>

			{/* ------------------------------------------------ MAIN CONTENT ------------------------------------------------*/}
			<div className="flex flex-col xl:flex-row gap-5">
				<div className="flex flex-col gap-5 flex-1 min-w-0 pb-2">
					{/* KPI section ------------------------------------------------ */}
					<div className="flex flex-col gap-5">
						<GlobalSearch
							role="admin"
							placeholder="Search events, courses, surveys..."
						/>
						<div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
							<StatCard
								variant="no-hover"
								icon={
									<Users
										size={20}
										className="text-[var(--periwinkle)]"
									/>
								}
								iconBg="var(--periwinkle-light)"
								value={userStats?.total ?? 0}
								label="Registered Users"
							/>
							<StatCard
								variant="no-hover"
								icon={
									<UserCheck
										size={20}
										className="text-[var(--success)]"
									/>
								}
								iconBg="rgba(109,197,160,0.15)"
								value={userStats?.onboarded ?? 0}
								label="Onboarded Users"
							/>
							<StatCard
								variant="no-hover"
								icon={
									<Calendar
										size={20}
										className="text-[var(--soft-pink)]"
									/>
								}
								iconBg="var(--pink-light)"
								value={gadEventsCount ?? 0}
								label="Total Events"
							/>
							<StatCard
								variant="no-hover"
								icon={
									<ClipboardList
										size={20}
										className="text-[var(--warning)]"
									/>
								}
								iconBg="rgba(244,201,122,0.18)"
								value={surveysCount}
								label="Active Surveys"
							/>
						</div>
					</div>

					{/* attendance and quick actions ------------------------------------------------ */}
					<div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">
						{/* attendance over time */}
						<Card variant="no-hover" className="flex flex-col p-4 min-h-[320px]" >
							<div className="flex flex-wrap items-start justify-between gap-3 mb-4 shrink-0">
								<div>
									<h2 className="heading-md"> {" "} Attendance Over Time{" "} </h2>
									<p className="caption mt-0.5"> {" "} Total event attendees per period{" "} </p>
								</div>
								<DateRangePicker
									value={attendanceRange}
									onChange={setAttendanceRange}
								/>
							</div>
							<div className="flex-1 w-full min-h-[200px] cursor-default select-none relative">
								{attendanceLoading ? (
									<div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-xl z-10">
										<span className="caption animate-pulse">
											{" "}
											Loading…{" "}
										</span>
									</div>
								) : eventAttendanceData?.length === 0 ? (
									<div className="flex items-center justify-center h-full">
										<span className="caption text-[var(--gray)]">
											{" "}
											No attendance data for the selected
											period.{" "}
										</span>
									</div>
								) : null}
								{!(
									!attendanceLoading &&
									eventAttendanceData?.length === 0
								) && (
									<ResponsiveContainer width="100%" height={220} >
										<LineChart
											responsive
											data={ eventAttendanceData ?? DUMMY_ATTENDANCE }
											margin={{ top: 10, right: 5, left: 10, bottom: 25, }}
										>
											<CartesianGrid
												strokeDasharray="3 3"
												stroke={AXIS_COLOR}
												vertical={false}
											/>
											<XAxis
												dataKey="month"
												stroke={AXIS_COLOR}
												tick={{
													fill: TICK_COLOR,
													fontSize: 11,
												}}
												tickLine={false}
												axisLine={false}
												dy={10}
												label={{
													value: "Month",
													position: "insideBottom",
													offset: -25,
													fill: "var(--primary-dark)",
													fontSize: 13,
												}}
											/>
											<YAxis
												stroke={AXIS_COLOR}
												tick={{
													fill: TICK_COLOR,
													fontSize: 11,
												}}
												tickLine={false}
												axisLine={false}
												allowDecimals={false}
												label={{
													value: "Number of Attendees",
													angle: -90,
													fill: "var(--primary-dark)",
													fontSize: 13,
													offset: 5,
												}}
											/>
											<Tooltip
												content={<CustomTooltip />}
												cursor={{
													stroke: AXIS_COLOR,
													strokeWidth: 1,
													strokeDasharray: "4 4",
												}}
											/>
											<Line
												type="monotone"
												dataKey="attendees"
												name="Attendees"
												stroke="var(--periwinkle)"
												strokeWidth={2.5}
												dot={{
													fill: "var(--periwinkle)",
													stroke: "var(--periwinkle)",
													strokeWidth: 2,
													r: 3,
												}}
												activeDot={{
													r: 5,
													fill: "var(--primary-dark)",
													stroke: "white",
													strokeWidth: 2,
												}}
											/>
										</LineChart>
									</ResponsiveContainer>
								)}
							</div>
						</Card>

						{/* quick actions */}
						<Card variant="no-hover" className="flex flex-col justify-around p-4 gap-3" >
							<div>
								<h2 className="heading-sm">Quick Actions</h2>
							</div>
							<div className="flex flex-col gap-2">
								<Button
									variant="soft"
									className="w-full justify-between"
									onClick={() => setActiveModal("event")}
								>
									<Calendar size={16} /> New Event
								</Button>
								<Button
									variant="soft"
									className="w-full justify-between"
									onClick={() => setActiveModal("user")}
								>
									<Users size={16} /> New User
								</Button>
								<Button
									variant="soft"
									className="w-full justify-between"
									onClick={() => setActiveModal("course")}
								>
									<BookOpen size={16} /> New Guideline
								</Button>
								<Button
									variant="soft"
									className="w-full justify-between"
									onClick={() => setActiveModal("survey")}
								>
									<ClipboardList size={16} /> New Survey
								</Button>
							</div>
						</Card>
					</div>

					{/* other analytics ------------------------------------------------ */}
					<div>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							{/* users per college */}
							<Card variant="no-hover" className="flex flex-col p-5 min-h-[250px]" >
								<h2 className="heading-md mb-0.5"> {" "} Users per College{" "} </h2>
								<p className="caption mb-3"> {" "} Registered student breakdown{" "} </p>
								<div className="flex-1 w-full min-h-[170px] cursor-default select-none">
									{loading ? (
										<div className="flex items-center justify-center h-full">
											<span className="caption animate-pulse"> Loading… </span>
										</div>
									) : filteredColleges.length === 0 ? (
										<Card variant="no-shadow" className="flex flex-col items-center justify-center text-center min-h-[220px] gap-3" >
											<div className="w-14 h-14 rounded-full bg-[var(--lavender)] flex items-center justify-center">
												<Users
													size={26}
													className="text-[var(--periwinkle)]"
												/>
											</div>
											<div>
												<p className="label text-[var(--primary-dark)]"> {" "} No user data{" "} </p>
											</div>
										</Card>
									) : (
										<ResponsiveContainer width="100%" height={250} >
											<BarChart
												data={filteredColleges}
												margin={{ top: 8, right: 0, left: -25, bottom: 0, }}
											>
												<CartesianGrid
													strokeDasharray="3 3"
													vertical={false}
													stroke={AXIS_COLOR}
												/>
												<XAxis
													dataKey="category"
													stroke={AXIS_COLOR}
													tick={{
														fill: TICK_COLOR,
														fontSize: 11,
													}}
													tickLine={false}
													axisLine={false}
													dy={8}
												/>
												<YAxis
													stroke={AXIS_COLOR}
													tick={{
														fill: TICK_COLOR,
														fontSize: 11,
													}}
													tickLine={false}
													axisLine={false}
													allowDecimals={false}
												/>
												<Tooltip
													content={<CustomTooltip />}
													cursor={{
														fill: "rgba(45,42,74,0.03)",
													}}
												/>
												<Bar
													dataKey="value"
													name="Users"
													radius={[6, 6, 0, 0]}
													barSize={36}
												>
													{filteredColleges.map(
														(
															item: { category: string; },
															idx: number,
														) => (
															<Cell
																key={`col-${idx}`}
																fill={colorFor( COLLEGE_COLORS, item.category, idx, )}
															/>
														),
													)}
												</Bar>
											</BarChart>
										</ResponsiveContainer>
									)}
								</div>
							</Card>

							{/* sex at birth */}
							<Card variant="no-hover" className="flex flex-col p-5 min-h-[250px]" >
								<h2 className="heading-md mb-0.5"> Users Sex at Birth </h2>
								<div className="flex-1 w-full min-h-[190px] cursor-default select-none">
									{loading ? (
										<div className="flex items-center justify-center h-full">
											<span className="caption animate-pulse"> Loading… </span>
										</div>
									) : !sexAtBirthData?.length ? (
										<Card variant="no-shadow" className="flex flex-col items-center justify-center text-center min-h-[220px] gap-3" >
											<div className="w-14 h-14 rounded-full bg-[var(--lavender)] flex items-center justify-center">
												<Users
													size={26}
													className="text-[var(--periwinkle)]"
												/>
											</div>
											<div>
												<p className="label text-[var(--primary-dark)]"> {" "} No user data{" "} </p>
											</div>
										</Card>
									) : (
										<ResponsiveContainer width="100%" height={280} >
											<PieChart>
												<Pie
													data={sexAtBirthData}
													cx="50%"
													cy="45%"
													innerRadius="55%"
													outerRadius="78%"
													paddingAngle={2}
													dataKey="value"
													nameKey="name"
												>
													{sexAtBirthData.map(
														(
															item: {
																name: string;
															},
															i: number,
														) => (
															<Cell
																key={`sex-${i}`}
																fill={colorFor(
																	SEX_COLORS,
																	item.name,
																	i,
																)}
															/>
														),
													)}
												</Pie>
												<Tooltip
													content={<CustomTooltip />}
												/>
												<Legend
													verticalAlign="bottom"
													align="center"
													iconType="circle"
													wrapperStyle={{
														paddingTop: 14,
													}}
													formatter={(v) => (
														<span className="caption tracking-wider">
															{v}
														</span>
													)}
												/>
											</PieChart>
										</ResponsiveContainer>
									)}
								</div>
							</Card>

							{/* gender identity */}
							<Card variant="no-hover" className="flex flex-col p-5 min-h-[260px]" >
								<h2 className="heading-md mb-0.5"> Users Gender Identity </h2>
								<div className="flex-1 w-full min-h-[190px] cursor-default select-none">
									{loading ? (
										<div className="flex items-center justify-center h-full">
											<span className="caption animate-pulse"> Loading… </span>
										</div>
									) : !filteredGenders.length ? (
										<Card
											variant="no-shadow"
											className="flex flex-col items-center justify-center text-center min-h-[220px] gap-3"
										>
											<div className="w-14 h-14 rounded-full bg-[var(--lavender)] flex items-center justify-center">
												<Users
													size={26}
													className="text-[var(--periwinkle)]"
												/>
											</div>
											<div>
												<p className="label text-[var(--primary-dark)]"> {" "} No user data{" "} </p>
											</div>
										</Card>
									) : (
										<ResponsiveContainer width="100%" height={280} >
											<PieChart>
												<Pie
													data={filteredGenders}
													cx="50%"
													cy="45%"
													innerRadius="55%"
													outerRadius="78%"
													paddingAngle={2}
													dataKey="value"
													nameKey="name"
												>
													{filteredGenders.map(
														(
															item: { name?: string; category?: string; },
															i: number,
														) => (
															<Cell
																key={`gender-${i}`}
																fill={colorFor( GENDER_COLORS, item.name ?? item.category ?? "", i, )}
															/>
														),
													)}
												</Pie>
												<Tooltip
													content={<CustomTooltip />}
												/>
												<Legend
													verticalAlign="bottom"
													align="center"
													iconType="circle"
													wrapperStyle={{
														paddingTop: 14,
													}}
													formatter={(v) => (
														<span className="caption tracking-wider">
															{v}
														</span>
													)}
												/>
											</PieChart>
										</ResponsiveContainer>
									)}
								</div>
							</Card>
						</div>
					</div>

					{/* survey completion analytics ------------------------------------------------ */}
					<div>
						<Card variant="no-hover" className="flex flex-col p-5 min-h-[320px]" >
							<div className="flex flex-wrap items-center justify-between gap-3 mb-4">
								<div>
									<h2 className="heading-md mb-0.5">Response Rate by Survey</h2>
									<p className="caption">Completed vs incomplete response percentage per survey</p>
								</div>
								<SearchBar
									placeholder="Search all surveys…"
									value={surveySearch}
									onChange={(e) =>
										setSurveySearch(e.target.value)
									}
									onClear={() => setSurveySearch("")}
									className="min-w-[220px] max-w-full"
								/>
							</div>

							<div className="w-full min-h-[220px] cursor-default select-none mt-2">
								{surveyCompletionLoading ? (
									<div className="flex items-center justify-center h-full">
										<span className="caption animate-pulse"> Loading survey data… </span>
									</div>
								) : (surveyCompletionData?.length ?? 0) ===
								  0 ? (
									<div className="flex items-center justify-center h-full">
										<span className="caption text-[var(--gray)]"> No survey completion data available. </span>
									</div>
								) : surveyCompletionChartData.length === 0 ? (
									<div className="flex items-center justify-center h-full">
										<span className="caption text-[var(--gray)]"> No surveys match your search. </span>
									</div>
								) : (
									<>
										<ResponsiveContainer width="100%" height={320} >
											<BarChart
												layout="vertical"
												data={surveyCompletionChartData}
												margin={{
													top: 24,
													right: 100,
													left: 20,
													bottom: 5,
												}}
												barCategoryGap="30%"
											>
												<CartesianGrid
													strokeDasharray="3 3"
													vertical={false}
													stroke={AXIS_COLOR}
												/>
												<XAxis
													type="number"
													stroke={AXIS_COLOR}
													tick={{
														fill: TICK_COLOR,
														fontSize: 11,
													}}
													tickLine={false}
													axisLine={false}
													domain={[0, 100]}
													tickFormatter={(value) =>
														`${value}%`
													}
												/>
												<YAxis
													type="category"
													dataKey="title"
													stroke={AXIS_COLOR}
													tick={{
														fill: TICK_COLOR,
														fontSize: 11,
													}}
													tickLine={false}
													axisLine={false}
													width={175}
													interval={0}
													tickMargin={20}
												/>
												<Tooltip
													content={<CustomTooltip />}
													cursor={{
														fill: "transparent",
														stroke: "transparent",
													}}
												/>
												<Legend
													verticalAlign="top"
													align="right"
													wrapperStyle={{
														paddingBottom: 20,
													}}
													iconType="circle"
													formatter={(v) => (
														<span className="caption tracking-wider">{v}</span>
													)}
												/>
												<Bar
													dataKey="completedPct"
													name="Completed"
													stackId="a"
													fill={
														SURVEY_COMPLETED_COLOR
													}
													radius={[6, 0, 0, 6]}
													barSize={24}
												>
													{/*--<LabelList
														dataKey="completedPct"
														position="right"
														formatter={(value) =>
															`${value}%`
														}
														fill="var(--primary-dark)"
													/>--*/}
												</Bar>
												<Bar
													dataKey="incompletePct"
													name="Incomplete"
													stackId="a"
													fill={
														SURVEY_INCOMPLETE_COLOR
													}
													radius={[0, 6, 6, 0]}
													barSize={24}
												>
													{/*--<LabelList
														dataKey="incompletePct"
														position="insideRight"
														formatter={(value) =>
															typeof value ===
																"number" &&
															value > 0
																? `${value}%`
																: ""
														}
														fill="var(--primary-dark)"
													/>--*/}
												</Bar>
											</BarChart>
										</ResponsiveContainer>
										{surveyPageCount > 1 && (
											<div className="mt-4 flex items-center justify-end">
												<Pagination
													page={surveyPage}
													total={surveyPageCount}
													onChange={setSurveyPage}
												/>
											</div>
										)}
									</>
								)}
							</div>
						</Card>
					</div>
				</div>

				{/* right panel ------------------------------------------------------------------------------------------------ */}
				<aside className="flex flex-col gap-5 xl:w-[268px] shrink-0 pb-8">
					{/* calendar */}
					<Card variant="no-hover" className="p-4">
						<div className="[&_button]:cursor-default [&_*]:cursor-default">
						<MiniCalendar
							eventDays={new Set([3, 10, 14])}
							onDayClick={(date) => console.log(date)}
						/>
						</div>
					</Card>

					{/* timeline */}
					<Card variant="no-hover" className="p-4">
						<TodayTimeline events={todayEvents} loading={loading} />
					</Card>
				</aside>
			</div>
			{/* end xl:flex-row */}

			{/* quick action modals */}
			{/* -------------------------------------- event modal -------------------------------------- */}
			<Modal
				open={activeModal === "event"}
				onClose={closeModal}
				title="New Event"
				modalStyle={{ maxWidth: 900 }}
			>
				<EventForm
					mode="create"
					onSuccess={closeModal}
					onCancel={closeModal}
				/>
			</Modal>

			{/* -------------------------------------- user modal -------------------------------------- */}
			<Modal
				open={activeModal === "user"}
				onClose={closeModal}
				title="Add User"
			>
				<UserForm onSuccess={closeModal} />
			</Modal>

			{/* -------------------------------------- guideline modal -------------------------------------- */}
			<Modal
				open={activeModal === "course"}
				onClose={closeModal}
				title="Add Guideline"
				modalStyle={{ maxWidth: 860 }}
			>
				<CourseForm
					mode="create"
					onSuccess={closeModal}
					onCancel={closeModal}
				/>
			</Modal>

			{/* -------------------------------------- survey modal -------------------------------------- */}
			<Modal
				open={activeModal === "survey"}
				onClose={closeModal}
				title="New Survey"
				modalStyle={{ maxWidth: 780 }}
			>
				<SurveyForm
					mode="create"
					onSuccess={closeModal}
					onCancel={closeModal}
				/>
			</Modal>
		</div>
	);
}
