"use client";

import { ReactNode, memo } from "react";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline" | "text";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

interface IconButtonProps {
  children: ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
  style?: React.CSSProperties;
}

export const Button = memo(
  ({
    children,
    onClick,
    variant = "text",
    size = "medium",
    fullWidth = false,
    disabled = false,
    type = "button",
  }: ButtonProps) => {
    // Định nghĩa style cho từng variant
    const variants = {
      text: "bg-transparent hover:bg-[#2a2b30]/10 text-gray-300",
      primary:
        "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-md hover:brightness-110",
      secondary:
        "bg-transparent border border-[#667eea]/50 text-[#667eea] hover:bg-[#667eea]/10",
      outline:
        "bg-transparent border border-[#667eea]/50 text-[#667eea] hover:bg-[#667eea]/10",
    };

    // Định nghĩa style cho từng size
    const sizes = {
      small: "px-3 py-1.5 text-xs",
      medium: "px-4 py-2 text-sm",
      large: "px-6 py-3 text-base",
    };

    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`
        inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${fullWidth ? "w-full" : "w-auto"}
        ${variants[variant] || variants.text}
        ${sizes[size] || sizes.medium}
      `}
      >
        {children}
      </button>
    );
  },
);

export const IconButton = memo(
  ({
    children,
    onClick,
    disabled = false,
    size = "medium",
    style,
  }: IconButtonProps) => {
    // Mapping size cho IconButton (thường là hình vuông/tròn)
    const iconSizes = {
      small: "w-8 h-8 text-sm",
      medium: "w-10 h-10 text-lg",
      large: "w-12 h-12 text-xl",
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        style={style} // Giữ lại để hỗ trợ các inline-style đặc biệt từ file cũ
        className={`
        flex items-center justify-center rounded-full transition-all duration-200
        text-gray-400 hover:text-white hover:bg-[#2a2b30]/10 active:scale-90
        disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100
        ${iconSizes[size] || iconSizes.medium}
      `}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
IconButton.displayName = "IconButton";

export default Button;
