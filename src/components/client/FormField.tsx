"use client";

import { useId, forwardRef } from "react";

const BASE_INPUT = [
  "w-full rounded-xl border border-white/[0.08] bg-white/[0.04]",
  "px-3.5 py-2.5 text-sm text-white placeholder:text-white/25",
  "outline-none transition",
  "focus:border-sky-500/40 focus:bg-white/[0.06]",
  "disabled:opacity-40 disabled:cursor-not-allowed",
].join(" ");

export function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-semibold text-white/50 mb-1.5">
      {children}
      {required && <span className="ml-0.5 text-red-400">*</span>}
    </label>
  );
}

function ErrorMsg({ id, msg }: { id: string; msg: string }) {
  return (
    <p id={id} role="alert" className="mt-1 text-xs text-red-400">
      {msg}
    </p>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:    string;
  error?:    string;
  hint?:     string;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, required, className = "", ...props },
  ref,
) {
  const uid     = useId();
  const errId   = `${uid}-err`;
  const hintId  = `${uid}-hint`;
  const described = [error ? errId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-0">
      {label && <FieldLabel htmlFor={uid} required={required}>{label}</FieldLabel>}
      <input
        ref={ref}
        id={uid}
        className={`${BASE_INPUT} ${error ? "border-red-500/40 focus:border-red-500/60" : ""} ${className}`}
        aria-invalid={!!error}
        aria-describedby={described}
        {...props}
      />
      {hint  && !error && <p id={hintId} className="mt-1 text-xs text-white/30">{hint}</p>}
      {error && <ErrorMsg id={errId} msg={error} />}
    </div>
  );
});

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:    string;
  error?:    string;
  hint?:     string;
  required?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, required, className = "", ...props },
  ref,
) {
  const uid   = useId();
  const errId = `${uid}-err`;
  const described = error ? errId : undefined;

  return (
    <div className="space-y-0">
      {label && <FieldLabel htmlFor={uid} required={required}>{label}</FieldLabel>}
      <textarea
        ref={ref}
        id={uid}
        className={`${BASE_INPUT} resize-none ${error ? "border-red-500/40 focus:border-red-500/60" : ""} ${className}`}
        aria-invalid={!!error}
        aria-describedby={described}
        {...props}
      />
      {hint  && !error && <p className="mt-1 text-xs text-white/30">{hint}</p>}
      {error && <ErrorMsg id={errId} msg={error} />}
    </div>
  );
});

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?:    string;
  error?:    string;
  hint?:     string;
  required?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, required, className = "", children, ...props },
  ref,
) {
  const uid   = useId();
  const errId = `${uid}-err`;
  const described = error ? errId : undefined;

  return (
    <div className="space-y-0">
      {label && <FieldLabel htmlFor={uid} required={required}>{label}</FieldLabel>}
      <select
        ref={ref}
        id={uid}
        className={`${BASE_INPUT} ${error ? "border-red-500/40" : ""} ${className}`}
        style={{ colorScheme: "dark" }}
        aria-invalid={!!error}
        aria-describedby={described}
        {...props}
      >
        {children}
      </select>
      {hint  && !error && <p className="mt-1 text-xs text-white/30">{hint}</p>}
      {error && <ErrorMsg id={errId} msg={error} />}
    </div>
  );
});
