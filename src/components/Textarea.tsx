import { type TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({
  label,
  id,
  className = "",
  ...props
}: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm text-mid-gray font-body">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`bg-pure-white border border-light-gray rounded-container px-5 py-3 font-body text-pure-black placeholder:text-silver focus:outline-none focus:ring-2 focus:ring-ring-blue/50 resize-y ${className}`}
        {...props}
      />
    </div>
  );
}
