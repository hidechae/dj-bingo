import { type ButtonHTMLAttributes, type ReactNode } from "react";

export type ButtonVariant = "primary" | "outline" | "ghost";
export type ButtonColor = "gray" | "blue" | "green" | "red";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
}

export const Button = ({
  variant = "primary",
  color = "blue",
  size = "md",
  fullWidth = false,
  disabled = false,
  className = "",
  children,
  ...props
}: ButtonProps) => {
  const baseStyles =
    "cursor-pointer rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variantStyles = {
    primary: {
      gray: "border-2 border-gray-600 bg-gray-600 text-white hover:border-gray-700 hover:bg-gray-700",
      blue: "border-2 border-blue-600 bg-blue-600 text-white hover:border-blue-700 hover:bg-blue-700",
      green:
        "border-2 border-green-600 bg-green-600 text-white hover:border-green-700 hover:bg-green-700",
      red: "border-2 border-red-600 bg-red-600 text-white hover:border-red-700 hover:bg-red-700",
    },
    outline: {
      gray: "border-2 border-gray-600 bg-white text-gray-600 hover:bg-gray-50",
      blue: "border-2 border-blue-600 bg-white text-blue-600 hover:bg-blue-50",
      green:
        "border-2 border-green-600 bg-white text-green-600 hover:bg-green-50",
      red: "border-2 border-red-600 bg-white text-red-600 hover:bg-red-50",
    },
    ghost: {
      gray: "border-2 border-transparent bg-transparent text-gray-600 hover:bg-gray-50",
      blue: "border-2 border-transparent bg-transparent text-blue-600 hover:bg-blue-50",
      green:
        "border-2 border-transparent bg-transparent text-green-600 hover:bg-green-50",
      red: "border-2 border-transparent bg-transparent text-red-600 hover:bg-red-50",
    },
  };

  const widthStyles = fullWidth ? "w-full" : "";

  const combinedClassName = [
    baseStyles,
    sizeStyles[size],
    variantStyles[variant][color],
    widthStyles,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button disabled={disabled} className={combinedClassName} {...props}>
      {children}
    </button>
  );
};
