"use client";

import { useRouter } from "next/router";
import styled from "styled-components";
import { useRecipient } from "../hooks/useRecipient";
import { Conversation } from "../types";
import RecipientAvatar from "./RecipientAvatar";
import { getRecipientName } from "../utils/getRecipientName";
import { isGroupConversation, getGroupDisplayName } from "../utils/groupUtils";
import GroupIcon from "@mui/icons-material/Group";
import { useDocument } from "react-firebase-hooks/firestore";
import { doc } from "firebase/firestore";
import { db } from "../config/firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons";

const ConversationSelect = ({
  id,
  conversationUsers,
}: {
  id: string;
  conversationUsers: Conversation["users"];
}) => {
  const [conversationSnapshot] = useDocument(doc(db, "conversations", id));
  const conversationData = conversationSnapshot?.data() as
    | Conversation
    | undefined;
  const { recipient, recipientEmail, recipientName } =
    useRecipient(conversationUsers);

  const router = useRouter();

  const onSelectConversation = () => {
    router.push(`/conversations/${id}`);
  };

  const isGroup = conversationData
    ? isGroupConversation(conversationData)
    : false;
  const displayName =
    isGroup && conversationData
      ? getGroupDisplayName(conversationData)
      : recipientName;

  return (
    <div
      onClick={onSelectConversation}
      className="flex items-center gap-3 p-3 cursor-pointer transition-colors duration-200 hover:bg-gray-100 active:bg-gray-200 rounded-lg group"
    >
      {isGroup ? (
        /* Group Icon Container */
        <div className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded-full transition-colors group-hover:bg-gray-300">
          <FontAwesomeIcon icon={faUsers} className="text-gray-600 text-lg" />
        </div>
      ) : (
        /* Recipient Avatar */
        <div className="flex-shrink-0">
          <RecipientAvatar
            recipient={recipient}
            recipientEmail={recipientEmail}
            recipientName={recipientName}
            // Lưu ý: Đảm bảo bên trong RecipientAvatar bạn cũng dùng Tailwind
            // để set class "w-10 h-10 rounded-full object-cover"
          />
        </div>
      )}

      {/* Display Name */}
      <span className="flex-1 font-medium text-gray-300 truncate group-hover:text-gray-900">
        {displayName}
      </span>
    </div>
  );
};

export default ConversationSelect;
