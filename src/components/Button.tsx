import { type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "cta";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-light-gray text-near-black border border-light-gray",
  secondary:
    "bg-pure-white text-button-text-dark border border-border-light",
  cta:
    "bg-pure-black text-pure-white border border-pure-black",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-pill px-6 py-2.5 font-body font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${className}`}
      {...props}
    />
  );
}
