import { type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, id, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm text-mid-gray font-body">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`bg-pure-white border border-light-gray rounded-pill px-5 py-2.5 font-body text-pure-black placeholder:text-silver focus:outline-none focus:ring-2 focus:ring-ring-blue/50 ${className}`}
        {...props}
      />
    </div>
  );
}
