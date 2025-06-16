"use client";

import { IconButton as MuiIconButton } from "@mui/material";
import styled from "styled-components";
import { ReactNode, memo } from "react";

interface StyledButtonProps {
  $variant?: "primary" | "secondary" | "outline" | "text";
  $size?: "small" | "medium" | "large";
  $fullWidth?: boolean;
}

const StyledButton = styled.button<StyledButtonProps>`
  border: none;
  border-radius: 8px;
  text-transform: none;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
  font-family: inherit;

  ${({ $variant }) => {
    switch ($variant) {
      case "primary":
        return `
          background-color: #25d366;
          color: white;
          &:hover {
            background-color: #1fa855;
          }
        `;
      case "secondary":
        return `
          background-color: #f0f0f0;
          color: #333;
          &:hover {
            background-color: #e0e0e0;
          }
        `;
      case "outline":
        return `
          border: 1px solid #25d366;
          color: #25d366;
          background-color: transparent;
          &:hover {
            background-color: rgba(37, 211, 102, 0.1);
          }
        `;
      default:
        return `
          background-color: transparent;
          color: #555;
          &:hover {
            background-color: rgba(0, 0, 0, 0.04);
          }
        `;
    }
  }}

  ${({ $size }) => {
    switch ($size) {
      case "small":
        return `
          padding: 6px 12px;
          font-size: 12px;
        `;
      case "large":
        return `
          padding: 12px 24px;
          font-size: 16px;
        `;
      default:
        return `
          padding: 8px 16px;
          font-size: 14px;
        `;
    }
  }}
  
  ${({ $fullWidth }) => $fullWidth && `width: 100%;`}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StyledIconButton = styled(MuiIconButton)`
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
`;

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
    return (
      <StyledButton
        onClick={onClick}
        $variant={variant}
        $size={size}
        $fullWidth={fullWidth}
        disabled={disabled}
        type={type}
      >
        {children}
      </StyledButton>
    );
  }
);

export const IconButton = memo(
  ({
    children,
    onClick,
    disabled = false,
    size = "medium",
    style,
  }: IconButtonProps) => {
    return (
      <StyledIconButton
        onClick={onClick}
        disabled={disabled}
        size={size}
        style={style}
      >
        {children}
      </StyledIconButton>
    );
  }
);

Button.displayName = "Button";
IconButton.displayName = "IconButton";

export default Button;
