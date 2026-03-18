"use client";

import Avatar from "@mui/material/Avatar";
import styled from "styled-components";
import { memo } from "react";

interface StyledAvatarProps {
  size?: "small" | "medium" | "large";
  margin?: string;
  onClick?: () => void;
}

interface AvatarProps {
  src?: string | null;
  name?: string;
  email?: string;
  size?: "small" | "medium" | "large";
  margin?: string;
  onClick?: () => void;
}

const UserAvatar = memo(
  ({ src, name, email, size = "small", margin, onClick }: AvatarProps) => {
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
      <div
        onClick={onClick}
        className={`
    relative flex items-center justify-center rounded-full overflow-hidden shrink-0 cursor-pointer
    transition-transform duration-200 hover:scale-105 active:scale-95
    w-10 h-10
    ${!src ? "bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white font-medium uppercase" : "bg-gray-700"}
  `}
        style={{ margin: margin }} // Margin thường là giá trị động nên giữ inline style hoặc dùng class tùy biến
      >
        {src ? (
          <img
            src={src}
            alt="User Avatar"
            className="object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }} // Fallback nếu ảnh lỗi
          />
        ) : (
          <span>{getInitials()}</span>
        )}
      </div>
    );
  },
);

UserAvatar.displayName = "UserAvatar";

export default UserAvatar;
