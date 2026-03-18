"use client";

import Avatar from "@mui/material/Avatar";
import styled from "styled-components";
import { useRecipient } from "../hooks/useRecipient";

type Props = ReturnType<typeof useRecipient> & {
  size?: "small" | "medium" | "large";
  showOnlineStatus?: boolean;
};

const getAvatarSize = (size: string) => {
  switch (size) {
    case "small":
      return "32px";
    case "large":
      return "56px";
    default:
      return "40px"; // medium
  }
};

const getInitials = (name: string, email: string) => {
  if (name && name.trim()) {
    const nameParts = name.trim().split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  }
  return email[0].toUpperCase();
};

const RecipientAvatar = ({
  recipient,
  recipientEmail,
  recipientName,
  size = "medium",
  showOnlineStatus = false,
}: Props) => {
  const avatarSize = getAvatarSize(size);
  const initials = getInitials(recipientName || "", recipientEmail || "");

  const isOnline =
    recipient?.lastSeen &&
    new Date().getTime() - new Date(recipient.lastSeen.toDate()).getTime() <
      5 * 60 * 1000;

  return (
    <div className="relative inline-block flex-shrink-0">
      {/* Avatar Wrapper */}
      <div
        className={`
      flex items-center justify-center rounded-full overflow-hidden border border-gray-100 bg-[#667eea]-100 text-[#667eea]-600 font-semibold uppercase
      ${size === "large" ? "w-16 h-16 text-xl" : size === "small" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm"}
    `}
      >
        {recipient?.photoURL ? (
          <img
            src={recipient.photoURL}
            alt={recipientName || recipientEmail}
            className="w-full h-full object-cover"
          />
        ) : (
          /* Hiển thị Initials nếu không có ảnh */
          <span>{initials}</span>
        )}
      </div>

      {/* Online Indicator */}
      {showOnlineStatus && isOnline && (
        <span
          className={`
        absolute bottom-0 right-0 block rounded-full bg-[#667eea]-500 border-2 border-white
        ${size === "large" ? "w-4 h-4" : "w-3 h-3"}
      `}
          title="Online"
        />
      )}
    </div>
  );
};

export default RecipientAvatar;
