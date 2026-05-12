/*
How to use this component?
Input · Select · SearchBar · Toggle · Checkbox · RadioGroup · Slider

Input --------------------------------------------------------
PROPS
  label       string      — field label rendered above the input
  hint        string      — helper text shown below (green when success)
  error       string      — error message; also applies error border
  success     boolean     — applies success (green) border state
  prefixIcon  ReactNode   — icon placed inside the left of the input
  className   string      — extra CSS classes for the <input>
  ...props    any native <input> attribute (type, placeholder, value, onChange, disabled, maxLength, …)
 
  SAMPLE USAGE
  // Default
  <Input label="Full Name" placeholder="e.g. Maria Santos" />
 
  // Controlled
  const [name, setName] = useState("");
  <Input label="Full Name" value={name} onChange={e => setName(e.target.value)} />
 
  // With prefix icon
  import { User } from "lucide-react";
  <Input label="Student ID" prefixIcon={<User size={15} />} placeholder="2021-12345" />
 
  // Validation states
  <Input label="Email" success hint="Valid UP email" value="mc@up.edu.ph" />
  <Input label="Password" error="Must be at least 8 characters" type="password" />
 
  // Disabled
  <Input label="System ID" disabled defaultValue="SYS-00042" />
 
Select --------------------------------------------------------
 
PROPS
  label    string                                        optional
  options  { value: string; label: string }[]            (required)
  ...props any native <select> attribute (value, onChange, disabled, …)
 
  SAMPLE USAGE
  const [college, setCollege] = useState("");
  <Select
    label="College"
    value={college}
    onChange={e => setCollege(e.target.value)}
    options={[
      { value: "",     label: "Select college…" },
      { value: "css", label: "College of Social Sciences" },
      { value: "cs",   label: "College of Science" },
    ]}
  />
 
SearchBar --------------------------------------------------------
 
  PROPS
  containerStyle  CSSProperties   — applied to the outer wrapper div
  ...props        any native <input> attribute (placeholder, value, onChange, …)
 
  SAMPLE USAGE
  const [q, setQ] = useState("");
  <SearchBar
    placeholder="Search events, guidelines…"
    value={q}
    onChange={e => setQ(e.target.value)}
    containerStyle={{ maxWidth: 400 }}
  />
 
Toggle --------------------------------------------------------
 
  PROPS
  label      string      — label text shown to the right of the switch
  defaultOn  boolean     — initial on/off state                default false
  onChange   (on: boolean) => void
 
  SAMPLE USAGE
  <Toggle label="Registrations Open" defaultOn={true} onChange={setOpen} />
  <Toggle label="Email Notifications" />
 
Checkbox --------------------------------------------------------
 
  PROPS
  label           string     (required)
  defaultChecked  boolean                                      default false
  onChange        (checked: boolean) => void
 
  SAMPLE USAGE
  <Checkbox label="I agree to the terms" onChange={setAgreed} />
  <Checkbox label="Attended GSO Session 1" defaultChecked />
 
RadioGroup --------------------------------------------------------
 
  PROPS
  options       { value: string; label: string }[]             (required)
  defaultValue  string   — initially selected option value     default options[0].value
  onChange      (value: string) => void
 
  SAMPLE USAGE
  <RadioGroup
    options={[
      { value: "student", label: "Student" },
      { value: "faculty", label: "Faculty" },
      { value: "admin",   label: "Administrator" },
    ]}
    defaultValue="student"
    onChange={setRole}
  />
 
Slider --------------------------------------------------------
 
  PROPS
  label     string   — field label above the slider
  minLabel  string   — caption at the left end
  maxLabel  string   — caption at the right end
  ...props  any native <input type="range"> attribute (min, max, value, step, onChange, …)
 
  SAMPLE USAGE
  const [cap, setCap] = useState(50);
  <Slider
    label={`Capacity: ${cap}`}
    min={0}
    max={200}
    value={cap}
    onChange={e => setCap(Number(e.target.value))}
    minLabel="0"
    maxLabel="200 participants"
  />
*/

"use client";

import React, { useState } from "react";

// Input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  success?: boolean;
  prefixIcon?: React.ReactNode;
}

export function Input({ label, hint, error, success, prefixIcon, className = "", ...props }: InputProps) {
  const stateClass = error ? "input-error" : success ? "input-success" : "";
  return (
    <div className="input-wrap">
      {label && <label className="label">{label}</label>}
      {prefixIcon ? (
        <div className="input-icon-wrap">
          <span className="input-prefix-icon">{prefixIcon}</span>
          <input className={`input ${stateClass} ${className}`.trim()} {...props} />
        </div>
      ) : (
        <input className={`input ${stateClass} ${className}`.trim()} {...props} />
      )}
      {error && <span className="hint hint-error">{error}</span>}
      {hint && !error && <span className="hint">{hint}</span>}
    </div>
  );
}

// Select
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string; disabled?: boolean }[];
}

export function Select({ label, options, className = "", ...props }: SelectProps) {
  return (
    <div className="input-wrap">
      {label && <label className="label">{label}</label>}
      <select className={`select ${className}`.trim()} {...props}>
        {options.map((o, idx) => (
          <option 
            key={o.value} 
            value={o.value} 
            disabled={o.disabled || (idx === 0 && o.value === "")}
          >
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---------------------------- SearchBar ----------------------------
import { Search, X } from "lucide-react";

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerStyle?: React.CSSProperties;
  onClear?: () => void;
}

export function SearchBar({ containerStyle, className = "", onClear, ...props }: SearchBarProps) {
  return (
    <div className="search-wrap" style={containerStyle}>
      <span className="search-icon"><Search size={16} /></span>
      <input className={`search-input ${className}`.trim()} {...props} />
      {props.value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gray)] hover:text-[var(--primary-dark)] bg-transparent border-none cursor-pointer p-1 rounded-full hover:bg-[var(--lavender)] transition-all flex items-center justify-center"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}

// Toggle
interface ToggleProps {
  label?: string;
  defaultOn?: boolean;
  onChange?: (on: boolean) => void;
}

export function Toggle({ label, defaultOn = false, onChange }: ToggleProps) {
  const [on, setOn] = useState(defaultOn);

  function handleClick() {
    const next = !on;
    setOn(next);
    onChange?.(next);
  }

  return (
    <label className="toggle-wrap" onClick={handleClick}>
      <div className={`toggle-track${on ? " active" : ""}`}>
        <div className="toggle-thumb" />
      </div>
      {label && (
        <span style={{ fontSize: 14, color: "var(--primary-dark)", fontWeight: 500 }}>{label}</span>
      )}
    </label>
  );
}

// Checkbox
import { Check } from "lucide-react";

interface CheckboxProps {
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
}

export function Checkbox({ label, checked: controlledChecked, defaultChecked = false, onChange }: CheckboxProps) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;

  function handleClick() {
    const next = !checked;
    if (!isControlled) setInternalChecked(next);
    onChange?.(next);
  }

  return (
    <div className="checkbox-wrap" onClick={handleClick}>
      <div className={`checkbox${checked ? " checked" : ""}`}>
        {checked && <Check size={12} color="white" />}
      </div>
      <span className="checkbox-label">{label}</span>
    </div>
  );
}

// RadioGroup
interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  options: RadioOption[];
  defaultValue?: string;
  onChange?: (value: string) => void;
}

export function RadioGroup({ options, defaultValue, onChange }: RadioGroupProps) {
  const [val, setVal] = useState(defaultValue ?? options[0]?.value);

  function handleClick(value: string) {
    setVal(value);
    onChange?.(value);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {options.map((opt) => (
        <div key={opt.value} className="radio-wrap" onClick={() => handleClick(opt.value)}>
          <div className={`radio${val === opt.value ? " checked" : ""}`}>
            <div className="radio-dot" />
          </div>
          <span className="checkbox-label">{opt.label}</span>
        </div>
      ))}
    </div>
  );
}

// Slider
interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  minLabel?: string;
  maxLabel?: string;
}

export function Slider({ label, minLabel, maxLabel, ...props }: SliderProps) {
  return (
    <div>
      {label && <label className="label" style={{ display: "block", marginBottom: 8 }}>{label}</label>}
      <input type="range" className="slider" {...props} />
      {(minLabel || maxLabel) && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span className="caption">{minLabel}</span>
          <span className="caption">{maxLabel}</span>
        </div>
      )}
    </div>
  );
}