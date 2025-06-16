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

const AvatarContainer = styled.div<{ size: string }>`
  position: relative;
  margin: 5px 15px 5px 5px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledAvatar = styled(Avatar)<{ avatarSize: string }>`
  width: ${(props) => props.avatarSize};
  height: ${(props) => props.avatarSize};
  font-size: ${(props) => {
    const size = parseInt(props.avatarSize);
    return `${size * 0.4}px`;
  }};
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  ${(props) =>
    !props.src &&
    `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  `}
`;

const OnlineIndicator = styled.div`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background-color: #4caf50;
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
`;

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
    <AvatarContainer size={size}>
      <StyledAvatar
        src={recipient?.photoURL}
        avatarSize={avatarSize}
        alt={recipientName || recipientEmail}
      >
        {!recipient?.photoURL && initials}
      </StyledAvatar>
      {showOnlineStatus && isOnline && <OnlineIndicator />}
    </AvatarContainer>
  );
};

export default RecipientAvatar;
