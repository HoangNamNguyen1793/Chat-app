import { doc, getDoc, getDocs, Timestamp } from "firebase/firestore";
import { GetServerSideProps } from "next";
import Head from "next/head";
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import styled from "styled-components";
import ConversationScreen from "../../components/chat/ConversationScreen";
import Sidebar from "../../components/layout/Sidebar";
import { auth, db } from "../../config/firebase";
import type { Conversation, IMessage } from "../../types";
import {
  generateQueryGetMessages,
  transformMessage,
} from "../../utils/getMessagesInConversation";
import { getRecipientEmail } from "../../utils/getRecipientEmail";

interface Props {
  conversation: Conversation;
  messages: IMessage[];
}

const Conversation = ({ conversation, messages }: Props) => {
  const [loggedInUser, _loading, _error] = useAuthState(auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Head>
        <title>
          Chat với {getRecipientEmail(conversation.users, loggedInUser)}
        </title>
      </Head>

      {/* Sidebar Wrapper */}
      {/* Sử dụng z-index cao và transition để Sidebar trượt ra trên Mobile. 
      Trên Desktop (md trở lên), nó sẽ chiếm một phần cố định của màn hình.
  */}
      <aside
        className={`
      fixed inset-y-0 left-0 z-40 w-80   transition-transform duration-300 ease-in-out transform
      md:relative md:translate-x-0 
      ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
    `}
      >
        <Sidebar isOpen={isSidebarOpen} onToggle={handleSidebarToggle} />
      </aside>

      {/* Overlay cho Mobile khi Sidebar đang mở */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/[#667eea] backdrop-blur-sm md:hidden"
          onClick={handleSidebarToggle}
        />
      )}

      {/* Main Conversation Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <ConversationScreen
          conversation={conversation}
          messages={messages}
          // Bạn có thể truyền thêm hàm toggle Sidebar vào đây để hiện nút Menu trên Mobile
        />
      </main>
    </div>
  );
};

export default Conversation;

export const getServerSideProps: GetServerSideProps<
  Props,
  { id: string }
> = async (context) => {
  const conversationId = context.params?.id;

  const conversationRef = doc(db, "conversations", conversationId as string);
  const conversationSnapshot = await getDoc(conversationRef);

  const queryMessages = generateQueryGetMessages(conversationId);

  const messagesSnapshot = await getDocs(queryMessages);

  const messages = messagesSnapshot.docs.map((messageDoc) =>
    transformMessage(messageDoc),
  );

  const conversationData = conversationSnapshot.data();
  const transformedConversation: Conversation = {
    users: conversationData?.users ?? [],
    isGroup: conversationData?.isGroup ?? null,
    groupName: conversationData?.groupName ?? null,
    groupDescription: conversationData?.groupDescription ?? null,
    groupImage: conversationData?.groupImage ?? null,
    adminUsers: conversationData?.adminUsers ?? null,
    createdAt: conversationData?.createdAt
      ? convertFirestoreTimestampToString(conversationData.createdAt)
      : null,
    createdBy: conversationData?.createdBy ?? null,
    lastActivity: conversationData?.lastActivity
      ? convertFirestoreTimestampToString(conversationData.lastActivity)
      : null,
  };

  return {
    props: {
      conversation: transformedConversation,
      messages,
    },
  };
};

export const convertFirestoreTimestampToString = (timestamp: Timestamp) =>
  new Date(timestamp.toDate().getTime()).toLocaleString();
