"use client";

/*
  Chart components for survey analytics.
  Each component handles one question type.

  Used by:
    components/admin/survey-analytics-modal.tsx (QuestionCard)
*/

import { useState, useMemo, useRef, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { mean, median, stddev } from "@/lib/stats.utils";
import { BRAND_COLORS, AXIS_COLOR, TICK_COLOR, LIKERT_LABELS, LIKERT_COLORS, CustomTooltip } from "./survey-analytics.constants";

interface QuestionRow {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  is_required: boolean;
  order_index: number;
}

interface ResponseRow {
  question_id: string;
  response_value: string | null;
  response_token: string;
}

const RESPONSES_PER_PAGE = 5;

/*
  Multiple Choice → Horizontal Bar Chart
*/
export function MultipleChoiceChart({
  question,
  responses,
}: {
  question: QuestionRow;
  responses: ResponseRow[];
}) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;

    // initialize with defined options
    if (question.options) {
      for (const opt of question.options) counts[opt] = 0;
    }
    
    for (const r of responses) {
      if (r.response_value) {
        counts[r.response_value] = (counts[r.response_value] ?? 0) + 1;
        total++;
      }
    }

    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        pct: total ? Math.round((value / total) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [question.options, responses]);

  const MCTooltip = useCallback(
    ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
      if (!active || !payload?.length) return null;
      const entry = payload[0].payload; // original data object
      return (
        <div className="bg-white/95 backdrop-blur-md border border-black/[0.07] shadow-[var(--shadow-float)] rounded-xl p-3 min-w-[140px]">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-bold text-[var(--gray)] uppercase tracking-wider mb-0.5">
              {label}
            </p>
            <div className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full shrink-0"
                style={{ background: payload[0].color ?? payload[0].payload?.fill }}
              />
              <span className="text-[13px] font-bold text-[var(--primary-dark)]">
                {entry.value} ({entry.pct}%)
              </span>
            </div>
          </div>
        </div>
      );
    },
    [],
  );

  return (
    <div className="w-full min-h-[200px] cursor-default select-none" style={{ height: Math.max(200, data.length * 48) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 40, left: 30, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={AXIS_COLOR} horizontal={false} />
          <XAxis
            type="number"
            stroke={AXIS_COLOR}
            tick={{ fill: TICK_COLOR, fontSize: 13 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            label={{ value: "Number of Responses", position: "insideBottom", offset: -20, fill: TICK_COLOR, fontSize: 13, fontWeight: 750, style: { textAnchor: "middle" } }}
          />
          <YAxis
            dataKey="name"
            type="category"
            stroke={AXIS_COLOR}
            tick={{ fill: TICK_COLOR, fontSize: 14 }}
            tickLine={false}
            axisLine={false}
            width={120}
            label={{ value: "Options", angle: -90, position: "insideLeft", offset: -10, fill: TICK_COLOR, fontSize: 13, fontWeight: 750, style: { textAnchor: "middle" } }}
          />
          <Tooltip content={<MCTooltip />} cursor={{ fill: "rgba(45,42,74,0.03)" }} />
          <Bar dataKey="value" name="Responses" radius={[0, 6, 6, 0]} barSize={28}>
            {data.map((_, idx) => (
              <Cell key={`mc-${idx}`} fill={BRAND_COLORS[idx % BRAND_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/*
  Yes / No → Donut Pie Chart
*/
const YES_NO_COLORS = ["#6DC5A0", "#F47B7B"];

export function YesNoChart({ responses }: { responses: ResponseRow[] }) {
  const data = useMemo(() => {
    let yes = 0;
    let no = 0;
    let total = 0;
    for (const r of responses) {
      if (r.response_value?.toLowerCase() === "yes") { yes++; total++; }
      else if (r.response_value?.toLowerCase() === "no") { no++; total++; }
    }
    return [
      { name: "Yes", value: yes, pct: total ? Math.round((yes / total) * 100) : 0 },
      { name: "No", value: no, pct: total ? Math.round((no / total) * 100) : 0 },
    ].filter((d) => d.value > 0);
  }, [responses]);

  const YesNoTooltip = useCallback(
    ({ active, payload }: { active?: boolean; payload?: any[] }) => {
      if (!active || !payload?.length) return null;
      const entry = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-md border border-black/[0.07] shadow-[var(--shadow-float)] rounded-xl p-3 min-w-[120px]">
          <div className="flex items-center gap-2">
            <span
              className="w-4 h-4 rounded-full shrink-0"
              style={{ background: payload[0].color ?? payload[0].payload?.fill }}
            />
            <span className="text-[13px] font-bold text-[var(--primary-dark)]">
              {entry.name}: {entry.value} ({entry.pct}%)
            </span>
          </div>
        </div>
      );
    },
    [],
  );

  return (
    <div className="w-full min-h-[260px] cursor-default select-none">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius="55%"
            outerRadius="78%"
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
            stroke="white"
            strokeWidth={2}
          >
            {data.map((_, i) => (
              <Cell
                key={`yn-${i}`}
                fill={YES_NO_COLORS[i % YES_NO_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<YesNoTooltip />} />
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            wrapperStyle={{ paddingTop: 14 }}
            formatter={(v) => (
              <span className="caption tracking-wider">
                {v as string}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/*
  Likert Scale → Stacked Horizontal Bar + Statistics
*/
function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-[var(--radius-md)] bg-[var(--lavender)]">
      <span className="text-[13px] font-bold text-[var(--gray)] uppercase tracking-wider">
        {label}
      </span>
      <span className="text-xl font-bold text-[var(--primary-dark)]">{value}</span>
    </div>
  );
}

export function LikertChart({ responses }: { responses: ResponseRow[] }) {
  const hoveredBarKey = useRef<string | null>(null);

  const { chartData, stats } = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    const nums: number[] = [];

    for (const r of responses) {
      const v = parseInt(r.response_value ?? "", 10);
      if (v >= 1 && v <= 5) {
        counts[v - 1]++;
        nums.push(v);
      }
    }

    const total = nums.length;
    const row: Record<string, string | number> = { name: "Responses" };
    for (let i = 0; i < 5; i++) {
      const val = counts[i];
      const pct = total ? Math.round((val / total) * 100) : 0;
      row[`r${i + 1}`] = val;
      row[`r${i + 1}_pct`] = pct;
    }

    return {
      chartData: [row],
      stats: {
        avg: mean(nums),
        med: median(nums),
        sd: stddev(nums),
        counts,
        total,
      },
    };
  }, [responses]);

  const LikertTooltip = useCallback(
    ({ active, payload }: { active?: boolean; payload?: any[] }) => {
      if (!active || !payload?.length || !hoveredBarKey.current) return null;
      const entry = payload.find((p) => p.dataKey === hoveredBarKey.current);
      if (!entry) return null;
      
      const pctKey = `${hoveredBarKey.current}_pct`;
      const pct = entry.payload[pctKey];

      return (
        <div className="bg-white/95 backdrop-blur-md border border-black/[0.07] shadow-[var(--shadow-float)] rounded-xl p-3 min-w-[120px]">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full shrink-0" style={{ background: entry.color ?? entry.fill }} />
            <span className="text-[13px] font-semibold text-[var(--primary-dark)] capitalize">
              {entry.name}: {entry.value} ({pct}%)
            </span>
          </div>
        </div>
      );
    },
    [],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="w-full min-h-[80px] cursor-default select-none">
        <ResponsiveContainer width="100%" height={80}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 10, left: 20, bottom: 25 }}
            barCategoryGap={0}
          >
            <XAxis 
              type="number" 
              hide={false} 
              stroke={AXIS_COLOR} 
              tick={{ fill: TICK_COLOR, fontSize: 13 }}
              tickLine={false}
              axisLine={false}
              label={{ value: "Number of Responses", position: "insideBottom", offset: -20, fill: TICK_COLOR, fontSize: 13, fontWeight: 750, style: { textAnchor: "middle" } }}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              hide={false} 
              stroke={AXIS_COLOR} 
              tick={{ fill: TICK_COLOR, fontSize: 13 }}
              tickLine={false}
              axisLine={false}
              width={80}
              label={{ value: "Metrics", angle: -90, position: "insideLeft", offset: -25, fill: TICK_COLOR, fontSize: 13, fontWeight: 750, style: { textAnchor: "middle" } }}
            />
            <Tooltip content={<LikertTooltip />} cursor={false} />
            {[1, 2, 3, 4, 5].map((n) => (
              <Bar
                key={n}
                dataKey={`r${n}`}
                name={LIKERT_LABELS[n - 1]}
                stackId="stack"
                fill={LIKERT_COLORS[n - 1]}
                radius={
                  n === 1
                    ? [6, 0, 0, 6]
                    : n === 5
                      ? [0, 6, 6, 0]
                      : [0, 0, 0, 0]
                }
                onMouseEnter={() => { hoveredBarKey.current = `r${n}`; }}
                onMouseLeave={() => { hoveredBarKey.current = null; }}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {LIKERT_LABELS.map((label, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: LIKERT_COLORS[i] }}
            />
            <span className="caption tracking-wider">
              {label} ({stats.counts[i]})
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatBox label="Average" value={stats.avg.toFixed(2)} />
        <StatBox label="Median" value={stats.med.toFixed(1)} />
        <StatBox label="Std Dev" value={stats.sd.toFixed(2)} />
      </div>
    </div>
  );
}

/*
  Text (Open-ended) → Paginated List
*/
function TextResponseItem({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const words = text.trim().split(/\s+/);
  const isLong = words.length > 20;
  const displayText = !isLong || expanded ? text : words.slice(0, 20).join(" ") + "...";

  return (
    <div
      className={`px-4 py-3 rounded-[var(--radius-md)] bg-[var(--lavender)] border border-[rgba(45,42,74,0.06)] ${isLong ? "cursor-pointer transition-colors hover:bg-[rgba(45,42,74,0.04)]" : ""}`}
      onClick={() => { if (isLong) setExpanded(!expanded); }}
    >
      <p
        className="body text-[var(--primary-dark)]"
        style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, fontStyle: "italic" }}
      >
        &ldquo;{displayText}&rdquo;
      </p>
      {isLong && (
        <p className="text-[14px] text-[var(--periwinkle)] mt-1.5 font-medium hover:underline w-fit">
          {expanded ? "Show less" : "Read more"}
        </p>
      )}
    </div>
  );
}

export function TextResponses({ responses }: { responses: ResponseRow[] }) {
  const [page, setPage] = useState(1);

  const nonEmpty = useMemo(
    () => responses.filter((r) => r.response_value && r.response_value.trim() !== ""),
    [responses],
  );

  const totalPages = Math.max(1, Math.ceil(nonEmpty.length / RESPONSES_PER_PAGE));
  const pageItems = nonEmpty.slice(
    (page - 1) * RESPONSES_PER_PAGE,
    page * RESPONSES_PER_PAGE,
  );

  if (nonEmpty.length === 0) {
    return (
      <p className="caption text-[var(--gray)] py-4 text-center">
        No text responses submitted.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {pageItems.map((r, i) => (
        <TextResponseItem key={`${r.response_token}-${i}`} text={r.response_value || ""} />
      ))}

      <div className="flex items-center justify-between mt-1">
        <span className="body text-[var(--gray)]">
          Page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <button
            className="btn btn-icon"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            style={{ opacity: page <= 1 ? 0.35 : 1 }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="btn btn-icon"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            style={{ opacity: page >= totalPages ? 0.35 : 1 }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
