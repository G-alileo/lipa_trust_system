import React from "react";

export function Button({
  variant = "primary",
  size = "base",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}) {
  const baseClass = "btn";
  const variantClass = `btn-${variant}`;
  const sizeClass = size !== "base" ? `btn-${size}` : "";
  const classes = `${baseClass} ${variantClass} ${sizeClass} ${className}`.trim();

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="btn-spinner"></span>
          Loading...
        </>
      ) : children}
    </button>
  );
}

export function Card({ variant = "glass", className = "", children, ...props }) {
  return (
    <div className={`card ${variant} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function Input({ label, error, className = "", ...props }) {
  return (
    <div className={`field-group ${className}`}>
      {label && <label className="label">{label}</label>}
      <input className={`input ${error ? "error" : ""}`} {...props} />
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}

export function ProgressBar({ progress, variant = "default", className = "" }) {
  const pct = Math.min(100, Math.max(0, progress));
  return (
    <div className={`progress-wrap ${variant} ${className}`}>
      <div className="progress-bar" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Badge({ status, className = "", children }) {
  const statusClass = `badge-${status?.toLowerCase() || 'default'}`;

  return (
    <span
      className={`badge ${statusClass} ${className}`}
    >
      {children || status}
    </span>
  );
}

export function Select({
  label,
  error,
  className = "",
  options = [],
  ...props
}) {
  return (
    <div className={`field-group ${className}`}>
      {label && <label className="label">{label}</label>}
      <select className={`input ${error ? "error" : ""}`} {...props}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}
