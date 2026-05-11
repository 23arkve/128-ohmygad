"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, Clock, ChevronLeft, ChevronRight, X, Check, AlignHorizontalJustifyEnd } from "lucide-react";
import { Button } from "@/components/ui";

// 
// HELPERS
// 
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstDOW(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function pad(n: number) { return String(n).padStart(2, "0"); }

// 
// TYPES
// 
export type DateTimeMode = "date" | "time" | "datetime";

export interface DateTimePickerProps {
  label?: string;
  mode?: DateTimeMode;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  minDate?: Date;
  maxDate?: Date;
  required?: boolean;
  error?: string;
}

// 
// SPINNER sub-component
// 
function Spinner({ value, onUp, onDn, format }: {
  value: number;
  onUp: () => void;
  onDn: () => void;
  format: (v: number) => string;
}) {
  return (
    <div className="dtp-spinner">
      <button type="button" className="dtp-spin-btn" onClick={onUp}>
        <ChevronLeft size={14} style={{ transform: "rotate(90deg)" }} />
      </button>
      <span className="dtp-spin-val">{format(value)}</span>
      <button type="button" className="dtp-spin-btn" onClick={onDn}>
        <ChevronRight size={14} style={{ transform: "rotate(90deg)" }} />
      </button>
    </div>
  );
}

// 
// MAIN COMPONENT
// 
export function DateTimePicker({
  label, mode = "datetime", placeholder,
  value, onChange, minDate = new Date(), maxDate, required, error,
}: DateTimePickerProps) {

  // parse incoming value 
  const parseValue = () => {
    if (!value) return { date: null as Date | null, hours: 12, minutes: 0, ampm: "AM" as "AM" | "PM" };
    if (mode === "time") {
      const [h, m] = value.split(":").map(Number);
      return { date: null as Date | null, hours: h % 12 || 12, minutes: m, ampm: (h >= 12 ? "PM" : "AM") as "AM" | "PM" };
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) return { date: null as Date | null, hours: 12, minutes: 0, ampm: "AM" as "AM" | "PM" };
    return { date: d, hours: d.getHours() % 12 || 12, minutes: d.getMinutes(), ampm: (d.getHours() >= 12 ? "PM" : "AM") as "AM" | "PM" };
  };

  const init = parseValue();
  const [selDate, setSelDate] = useState<Date | null>(init.date);
  const [hours, setHours] = useState(init.hours);
  const [minutes, setMinutes] = useState(init.minutes);
  const [ampm, setAmpm] = useState<"AM" | "PM">(init.ampm);
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<"cal" | "time">(mode === "time" ? "time" : "cal");
  const [calYear, setCalYear] = useState(init.date?.getFullYear() ?? new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(init.date?.getMonth() ?? new Date().getMonth());
  const rootRef = useRef<HTMLDivElement>(null);

  // sync internal state if `value` prop changes
  useEffect(() => {
    const p = parseValue();
    setSelDate(p.date);
    setHours(p.hours);
    setMinutes(p.minutes);
    setAmpm(p.ampm);
    if (p.date) {
      setCalYear(p.date.getFullYear());
      setCalMonth(p.date.getMonth());
    }
  }, [value, mode]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        if (open) {
          emit(selDate, hours, minutes, ampm);
        }
        setOpen(false);
        setPanel(mode === "time" ? "time" : "cal");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mode, open, selDate, hours, minutes, ampm]);

  // emit
  function emit(date: Date | null, h: number, m: number, ap: "AM" | "PM") {
    if (!onChange) return;
    let h24 = h % 12;
    if (ap === "PM") h24 += 12;
    if (mode === "date" && date) {
      onChange(date.toISOString().split("T")[0]);
    } else if (mode === "time") {
      onChange(`${pad(h24)}:${pad(m)}`);
    } else if (mode === "datetime" && date) {
      const d = new Date(date);
      d.setHours(h24, m, 0, 0);
      onChange(d.toISOString());
    }
  }

  // calendar nav
  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  }

  function pickDay(day: number) {
    const d = new Date(calYear, calMonth, day);
    setSelDate(d);
    if (mode === "date") {
      emit(d, hours, minutes, ampm);
      setOpen(false);
    } else {
      emit(d, hours, minutes, ampm);
      setPanel("time");
    }
  }

  function confirmTime() {
    emit(selDate, hours, minutes, ampm);
    setOpen(false);
    setPanel("cal");
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    setSelDate(null); setHours(12); setMinutes(0); setAmpm("AM");
    onChange?.("");
  }

  // calendar grid
  const totalDays = daysInMonth(calYear, calMonth);
  const cells: (number | null)[] = [
    ...Array(firstDOW(calYear, calMonth)).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function isDis(day: number) {
    const d = new Date(calYear, calMonth, day);
    if (minDate) { const mn = new Date(minDate); mn.setHours(0, 0, 0, 0); if (d < mn) return true; }
    if (maxDate) { const mx = new Date(maxDate); mx.setHours(23, 59, 59, 999); if (d > mx) return true; }
    return false;
  }

  // helper to check if a specific time is before the minDate
  const isTimeDis = (h: number, m: number, ap: "AM" | "PM") => {
    if (!minDate || !selDate || mode !== "datetime") return false;

    const isSameDay = 
      selDate.getFullYear() === minDate.getFullYear() &&
      selDate.getMonth() === minDate.getMonth() &&
      selDate.getDate() === minDate.getDate();

    if (!isSameDay) return false;

    let h24 = h % 12;
    if (ap === "PM") h24 += 12;

    const minH = minDate.getHours();
    const minM = minDate.getMinutes();

    if (h24 < minH) return true;
    if (h24 === minH && m < minM) return true;
    
    return false;
  };

  function isSel(day: number) {
    return !!selDate && selDate.getFullYear() === calYear
      && selDate.getMonth() === calMonth && selDate.getDate() === day;
  }
  function isToday(day: number) {
    const t = new Date();
    return t.getFullYear() === calYear && t.getMonth() === calMonth && t.getDate() === day;
  }

  // display string
  const timeStr = `${pad(hours)}:${pad(minutes)} ${ampm}`;
  let displayVal = "";
  if (mode === "time") {
    // Only show a value when the controlled `value` prop is set.
    displayVal = value ? timeStr : "";
  } else if (selDate) {
    const ds = `${MONTHS[selDate.getMonth()].slice(0, 3)} ${selDate.getDate()}, ${selDate.getFullYear()}`;
    displayVal = mode === "datetime" ? `${ds}  ·  ${timeStr}` : ds;
  }

  const ph = placeholder ?? (mode === "date" ? "Select date" : mode === "time" ? "Select time" : "Select date & time");
  const isDatetime = mode === "datetime";

  return (
    <div className="dtp-root" ref={rootRef}>
      {label && (
        <label className="label">
          {label}
          {required && <span style={{ color: "var(--soft-pink)", marginLeft: 3 }}></span>}
        </label>
      )}

      {/* Trigger */}
      <div
        className={`dtp-trigger${open ? " focused" : ""}${error ? " errored" : ""}`}
        onClick={() => setOpen(o => !o)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === "Enter" && setOpen(o => !o)}
      >
        <span className="dtp-icon">
          {mode === "time" ? <Clock size={15} /> : <Calendar size={15} />}
        </span>

        {/* Show chips when datetime has a full value */}
        {isDatetime && selDate ? (
          <div className="dtp-chip-row">
            <span className="dtp-chip"><Calendar size={11} />&nbsp;{MONTHS[selDate.getMonth()].slice(0, 3)} {selDate.getDate()}, {selDate.getFullYear()}</span>
            <span className="dtp-chip"><Clock size={11} />&nbsp;{timeStr}</span>
          </div>
        ) : (
          <span className={`dtp-val${!displayVal ? " ph" : ""}`}>
            {displayVal || ph}
          </span>
        )}

        {displayVal && (
          <button type="button" className="dtp-clear-btn" onClick={clear} tabIndex={-1}>
            <X size={12} />
          </button>
        )}
      </div>

      {error && <span className="hint hint-error" style={{ marginTop: 4, display: "block" }}>{error}</span>}

      {/* Popover */}
      {open && (
        <div className="dtp-popover">

          {/* CALENDAR PANEL */}
          {panel === "cal" && (
            <>
              <div className="dtp-cal-nav">
                <button type="button" className="dtp-nav-btn" onClick={prevMonth}><ChevronLeft size={15} /></button>
                <span className="dtp-nav-label">{MONTHS[calMonth]} {calYear}</span>
                <button type="button" className="dtp-nav-btn" onClick={nextMonth}><ChevronRight size={15} /></button>
              </div>

              <div className="dtp-dow-row">
                {DOW.map(d => <span key={d} className="dtp-dow">{d}</span>)}
              </div>

              <div className="dtp-grid">
                {cells.map((day, i) => (
                  <button
                    type="button"
                    key={i}
                    disabled={!day || isDis(day)}
                    onClick={() => day && !isDis(day) && pickDay(day)}
                    className={[
                      "dtp-day",
                      !day ? "empty" : "",
                      day && isSel(day) ? "selected" : "",
                      day && isToday(day) && !isSel(day) ? "today" : "",
                      day && isDis(day) && !isSel(day) ? "disabled" : "",
                    ].filter(Boolean).join(" ")}
                  >
                    {day ?? ""}
                  </button>
                ))}
              </div>

              {mode === "datetime" && (
                <div className="dtp-cal-footer">
                  {selDate ? (
                    <button type="button" className="dtp-switch-btn" onClick={() => setPanel("time")}>
                      <Clock size={13} /> Set time
                    </button>
                  ) : (
                    <span className="caption" style={{ padding: "8px 0", display: "block", textAlign: "center" }}>
                      Pick a date first
                    </span>
                  )}
                </div>
              )}
            </>
          )}

          {/* TIME PANEL */}
          {panel === "time" && (
            <div className="dtp-time-panel">
              {mode === "datetime" && (
                <button type="button" className="dtp-back-btn" onClick={() => setPanel("cal")}>
                  <ChevronLeft size={13} />
                  {selDate
                    ? `${MONTHS[selDate.getMonth()].slice(0, 3)} ${selDate.getDate()}, ${selDate.getFullYear()}`
                    : "Back"}
                </button>
              )}

              <p className="dtp-time-heading">Select Time</p>

              <div className="dtp-spinner-row">
                <Spinner value={hours} onUp={() => { const nh = hours === 12 ? 1 : hours + 1; setHours(nh); emit(selDate, nh, minutes, ampm); }} onDn={() => { const nh = hours === 1 ? 12 : hours - 1; setHours(nh); emit(selDate, nh, minutes, ampm); }} format={pad} />
                <span className="dtp-colon">:</span>
                <Spinner value={minutes} onUp={() => { const nm = (minutes + 30) % 60; setMinutes(nm); emit(selDate, hours, nm, ampm); }} onDn={() => { const nm = minutes === 0 ? 30 : minutes - 30; setMinutes(nm); emit(selDate, hours, nm, ampm); }} format={pad} />
                <div className="dtp-ampm-toggle">
                  {(["AM", "PM"] as const).map(ap => (
                    <button type="button" key={ap} className={`dtp-ampm-btn${ampm === ap ? " active" : ""}`} onClick={() => { setAmpm(ap); emit(selDate, hours, minutes, ap); }}>
                      {ap}
                    </button>
                  ))}
                </div>
              </div>

              <div className="dtp-presets">
                {[
                  { label: "7:30 AM", h: 7, m: 30, ap: "AM" as const },
                  { label: "9:00 AM", h: 9, m: 0, ap: "AM" as const },
                  { label: "10:30 AM", h: 10, m: 30, ap: "AM" as const },
                  { label: "12:00 PM", h: 12, m: 0, ap: "PM" as const },
                  { label: "1:30 PM", h: 1, m: 30, ap: "PM" as const },
                  { label: "3:00 PM", h: 3, m: 0, ap: "PM" as const },
                  { label: "4:30 PM", h: 4, m: 30, ap: "PM" as const },
                  { label: "6:00 PM", h: 6, m: 0, ap: "PM" as const },
                  { label: "7:30 PM", h: 7, m: 30, ap: "PM" as const },
                ].map(p => {
                  const disabled = isTimeDis(p.h, p.m, p.ap);
                  return (
                    <button
                      type="button"
                      key={p.label}
                      disabled={disabled}
                      className={`dtp-preset${hours === p.h && minutes === p.m && ampm === p.ap ? " active" : ""}${disabled ? " disabled" : ""}`}
                      onClick={() => { if(!disabled) { setHours(p.h); setMinutes(p.m); setAmpm(p.ap); emit(selDate, p.h, p.m, p.ap); } }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

                <Button 
                  type="button" 
                  variant={isTimeDis(hours, minutes, ampm) ? "ghost" : "primary"} 
                  className="dtp-confirm-btn w-full" 
                  disabled={isTimeDis(hours, minutes, ampm)} 
                  onClick={confirmTime}
                >
                  <Check size={14} /> Confirm
                </Button>
                
            </div>
          )}

        </div>
      )}
    </div>
  );
}