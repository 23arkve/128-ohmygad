import React from "react";
import { CalendarDays, Clock, MapPin } from "lucide-react";

type CardVariant = "default" | "pink" | "periwinkle" | "dark" | "glass" | "no-shadow" | "no-hover" | "ghost";

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
  style?: React.CSSProperties;
  noPadding?: boolean;
}

export function Card({ children, variant = "default", className = "", style, noPadding }: CardProps) {
  const variantClass =
    variant === "pink" ? "card-pink"
    : variant === "periwinkle" ? "card-periwinkle"
    : variant === "dark" ? "card-dark"
    : variant === "glass" ? "card-glass"
    : variant === "no-shadow" ? "card-no-shadow"
    : variant === "no-hover" ? "card-no-hover"
    : variant === "ghost" ? "card-ghost"
    : "card";

  return (
    <div
      className={`${variantClass} ${className}`.trim()}
      style={{ ...(noPadding ? { padding: 0 } : {}), ...style }}
    >
      {children}
    </div>
  );
}

// statcard
interface StatCardProps {
  icon: React.ReactNode;
  iconBg?: string;
  value: string | number;
  label: string;
  variant?: CardVariant;
}

export function StatCard({ icon, iconBg = "var(--pink-light)", value, label, variant = "default" }: StatCardProps) {
  return (
    <Card variant={variant}>
      <div className="stat-item">
        <div className="stat-icon-wrap" style={{ background: iconBg }}>
          {icon}
        </div>
        <div>
          <div className="stat-value">{value}</div>
          <div className="stat-label">{label}</div>
        </div>
      </div>
    </Card>
  );
}

// eventcard
export interface EventCardProps {
  title: string;
  category: string;
  date: string;
  time: string;
  location: string;
  registered: number;
  capacity: number;
  gradient: string;
  onRegister?: (e?: React.MouseEvent) => void;
  registerLabel?: string;
  registerDisabled?: boolean;
  isRegistered?: boolean;
}

export function EventCard({
  title, category, date, time, location,
  registered, capacity, gradient, onRegister, registerDisabled, registerLabel, isRegistered
}: EventCardProps) {
  const pct = Math.round((registered / capacity) * 100);
  
  return (
    <div className="event-card">
      <div className="event-cover" style={{ background: gradient }}>
        <span className="badge badge-ghost">
          {category}
        </span>
      </div>
      <div className="event-info">
        <div className="event-title truncate" title={title}>{title}</div>
        <div className="event-meta" style={{ marginBottom: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <CalendarDays size={12} color="var(--primary-dark)" className="opacity-70" /> {date}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <Clock size={12} color="var(--primary-dark)" className="opacity-70" /> {time}
          </span>
          <span className="truncate" style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
            <MapPin size={12} color="var(--primary-dark)" className="opacity-70" style={{ flexShrink: 0 }} /> 
            <span className="truncate">{location}</span>
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span className="caption">{registered}/{capacity} registered</span>
          <span className="caption">{pct}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div style={{ marginTop: 14 }}>
          <button
            className={`btn btn-sm w-full flex justify-center transition-opacity ${
              isRegistered 
                ? "btn-ghost" 
                : "btn-primary"
            }`}
            onClick={onRegister}
            disabled={registerDisabled}
          >
           {registerLabel ?? "Register"}
          </button>
        </div>
      </div>
    </div>
  );
}


// coursecard
export interface CourseCardProps {
  title: string;
  category: string;
  time: string;
  gradient: string;
  onRegister?: (e?: React.MouseEvent) => void;
  registerLabel?: string;
  registerDisabled?: boolean;
  isRegistered?: boolean;
}

// participantcard
interface ParticipantCardProps {
  name: string;
  studentId: string;
  college: string;
  role: string;
  gsoCount: string;
}

export function ParticipantCard({ name, studentId, college, role, gsoCount }: ParticipantCardProps) {
  return (
    <div className="credit-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4, fontWeight: 600, letterSpacing: "0.08em" }}>
            KASARIAN · PARTICIPANT
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700 }}>{name}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: "var(--radius-sm)", padding: "6px 10px", fontSize: 12, fontWeight: 700 }}>
          {role.toUpperCase()}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 4 }}>Student ID</div>
        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "0.12em" }}>{studentId}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ fontSize: 12, opacity: 0.8 }}>{college}</div>
        <div style={{ fontSize: 12, fontWeight: 700 }}>GSO: {gsoCount}</div>
      </div>
    </div>
  );
}