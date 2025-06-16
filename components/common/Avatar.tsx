"use client";

import Avatar from "@mui/material/Avatar";
import styled from "styled-components";
import { memo } from "react";

interface StyledAvatarProps {
  size?: "small" | "medium" | "large";
  margin?: string;
  onClick?: () => void;
}

const StyledAvatar = styled(Avatar)<StyledAvatarProps>`
  margin: ${({ margin }) => margin || "5px 15px 5px 5px"};
  width: ${({ size }) => {
    switch (size) {
      case "small":
        return "32px";
      case "large":
        return "64px";
      default:
        return "40px";
    }
  }};
  height: ${({ size }) => {
    switch (size) {
      case "small":
        return "32px";
      case "large":
        return "64px";
      default:
        return "40px";
    }
  }};
  cursor: ${({ onClick }) => (onClick ? "pointer" : "default")};
  transition: opacity 0.2s ease;

  &:hover {
    opacity: ${({ onClick }) => (onClick ? "0.8" : "1")};
  }
`;

interface AvatarProps {
  src?: string | null;
  name?: string;
  email?: string;
  size?: "small" | "medium" | "large";
  margin?: string;
  onClick?: () => void;
}

const UserAvatar = memo(
  ({ src, name, email, size = "medium", margin, onClick }: AvatarProps) => {
    const getInitials = () => {
      if (name) {
        return name.charAt(0).toUpperCase();
      }
      if (email) {
        return email.charAt(0).toUpperCase();
      }
      return "?";
    };

    return (
      <StyledAvatar
        src={src || undefined}
        size={size}
        margin={margin}
        onClick={onClick}
      >
        {!src && getInitials()}
      </StyledAvatar>
    );
  }
);

UserAvatar.displayName = "UserAvatar";

export default UserAvatar;
