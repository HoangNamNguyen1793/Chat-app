"use client";

import styled from "styled-components";
import ChatIcon from "@mui/icons-material/Chat";
import GroupIcon from "@mui/icons-material/Group";
import MoreVerticalIcon from "@mui/icons-material/MoreVert";
import LogoutIcon from "@mui/icons-material/Logout";
import SearchIcon from "@mui/icons-material/Search";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { signOut } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useState, memo, useEffect } from "react";
import * as EmailValidator from "email-validator";
import { addDoc, collection, query, where } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { Conversation } from "../../types";
import UserAvatar from "../common/Avatar";
import { IconButton } from "../common/Button";
import Button from "../common/Button";
import ConversationItem from "./ConversationItem";
import NewConversationDialog from "./NewConversationDialog";
import NewGroupDialog from "./NewGroupDialog";
import UserProfileModal from "../modals/UserProfileModal";
import ConversationSelect from "../ConversationSelect";

const SidebarContainer = styled.div<{ $isOpen: boolean }>`
  height: 100vh;
  min-width: ${(props) => (props.$isOpen ? "300px" : "60px")};
  max-width: ${(props) => (props.$isOpen ? "400px" : "60px")};
  width: ${(props) => (props.$isOpen ? "400px" : "60px")};
  overflow-y: auto;
  border-right: 1px solid var(--border-color, #e0e0e0);
  background-color: var(--sidebar-bg, #ffffff);
  display: flex;
  flex-direction: column;
  position: relative;
  transition: all 0.3s ease;

  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }

  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
    min-width: 300px;
    max-width: 300px;
    width: 300px;
    transform: translateX(${(props) => (props.$isOpen ? "0" : "-100%")});
    box-shadow: ${(props) =>
      props.$isOpen ? "2px 0 10px rgba(0,0,0,0.1)" : "none"};
  }
`;

const ToggleButton = styled(IconButton)`
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1001;
  background-color: var(--sidebar-bg, #ffffff) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color, #e0e0e0);

  @media (min-width: 769px) {
    display: none;
  }
`;

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: ${(props) => (props.$isOpen ? "block" : "none")};

  @media (min-width: 769px) {
    display: none;
  }
`;

const SidebarHeader = styled.div<{ $isOpen: boolean }>`
  display: flex;
  justify-content: ${(props) => (props.$isOpen ? "space-between" : "center")};
  align-items: center;
  padding: ${(props) => (props.$isOpen ? "16px" : "12px 8px")};
  height: 80px;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  background-color: var(--header-bg, #f0f0f0);
  position: sticky;
  top: 0;
  z-index: 10;
  overflow: hidden;

  @media (max-width: 768px) {
    justify-content: space-between;
    padding: 16px;
  }
`;

const UserInfo = styled.div<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  cursor: pointer;
  border-radius: 8px;
  padding: 4px;
  transition: all 0.2s ease;
  opacity: ${(props) => (props.$isOpen ? 1 : 0)};
  width: ${(props) => (props.$isOpen ? "auto" : "0")};
  overflow: hidden;
  pointer-events: ${(props) => (props.$isOpen ? "auto" : "none")};
  visibility: ${(props) => (props.$isOpen ? "visible" : "hidden")};

  &:hover {
    background-color: ${(props) =>
      props.$isOpen ? "var(--input-bg, #f0f2f5)" : "transparent"};
  }

  @media (max-width: 768px) {
    opacity: 1;
    width: auto;
    pointer-events: auto;
    visibility: visible;
  }
`;

const UserName = styled.h3<{ $isOpen: boolean }>`
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color, #111b21);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
  opacity: ${(props) => (props.$isOpen ? 1 : 0)};
  transition: opacity 0.2s ease;

  @media (max-width: 768px) {
    opacity: 1;
  }
`;

const HeaderActions = styled.div<{ $isOpen: boolean }>`
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: ${(props) => (props.$isOpen ? "flex-end" : "center")};
  flex-shrink: 0;

  @media (max-width: 768px) {
    justify-content: flex-end;
  }
`;

const SearchContainer = styled.div<{ $isOpen: boolean }>`
  padding: ${(props) => (props.$isOpen ? "12px 16px" : "12px 8px")};
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  background-color: var(--sidebar-bg, #ffffff);
  display: ${(props) => (props.$isOpen ? "block" : "none")};

  @media (max-width: 768px) {
    display: block;
    padding: 12px 16px;
  }
`;

const SearchInputWrapper = styled.div`
  display: flex;
  align-items: center;
  background-color: var(--input-bg, #f0f2f5);
  border-radius: 8px;
  padding: 8px 12px;
  gap: 8px;
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: var(--text-color, #111b21);

  &::placeholder {
    color: var(--text-secondary, #667781);
  }
`;

const NewChatButton = styled(Button)<{ $isOpen: boolean }>`
  width: 100%;
  border-top: 1px solid var(--border-color, #e0e0e0);
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  border-radius: 0;
  padding: ${(props) => (props.$isOpen ? "16px" : "16px 8px")};
  justify-content: ${(props) => (props.$isOpen ? "flex-start" : "center")};
  min-height: 56px;

  span {
    display: ${(props) => (props.$isOpen ? "inline" : "none")};
  }

  @media (max-width: 768px) {
    padding: 16px;
    justify-content: flex-start;

    span {
      display: inline;
    }
  }
`;

const ConversationsList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: var(--text-secondary, #667781);

  h3 {
    margin: 16px 0 8px;
    font-size: 18px;
    color: var(--text-color, #111b21);
  }

  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.4;
  }
`;

interface SidebarProps {
  onConversationSelect?: (conversationId: string) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

const Sidebar = memo(
  ({ onConversationSelect, isOpen = true, onToggle }: SidebarProps) => {
    const [loggedInUser] = useAuthState(auth);
    const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth <= 768);
      };

      checkMobile();
      window.addEventListener("resize", checkMobile);

      return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const conversationsQuery = loggedInUser
      ? query(
          collection(db, "conversations"),
          where("users", "array-contains", loggedInUser.email)
        )
      : null;

    const [conversationsSnapshot, loading] = useCollection(conversationsQuery);

    const handleLogout = async () => {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Error logging out:", error);
      }
    };

    const handleNewConversation = () => {
      setIsNewConversationOpen(true);
    };

    const handleUserInfoClick = () => {
      setIsProfileModalOpen(true);
    };

    const handleProfileModalClose = () => {
      setIsProfileModalOpen(false);
    };

    const handleToggle = () => {
      onToggle?.();
    };

    const handleOverlayClick = () => {
      if (isMobile && onToggle) {
        onToggle();
      }
    };

    const showSnackbar = (message: string) => {
      alert(message);
    };

    const filteredConversations = conversationsSnapshot?.docs.filter(
      (conversation) => {
        if (!searchQuery.trim()) return true;

        const conversationData = conversation.data() as Conversation;
        const users = conversationData.users || [];

        return users.some((user: string) =>
          user.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
    );

    return (
      <>
        {isMobile && (
          <>
            <ToggleButton onClick={handleToggle}>
              {isOpen ? <CloseIcon /> : <MenuIcon />}
            </ToggleButton>
            <Overlay
              $isOpen={isOpen && isMobile}
              onClick={handleOverlayClick}
            />
          </>
        )}
        <SidebarContainer $isOpen={isOpen}>
          <SidebarHeader $isOpen={isOpen}>
            {isOpen && (
              <UserInfo $isOpen={isOpen} onClick={handleUserInfoClick}>
                <UserAvatar
                  src={loggedInUser?.photoURL}
                  name={loggedInUser?.displayName || undefined}
                  email={loggedInUser?.email || undefined}
                  size="medium"
                  margin={isOpen ? "0 12px 0 0" : "0"}
                />
                <UserName $isOpen={isOpen}>
                  {loggedInUser?.displayName || loggedInUser?.email || "User"}
                </UserName>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogout();
                  }}
                >
                  <LogoutIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </UserInfo>
            )}
            <HeaderActions $isOpen={isOpen}>
              <IconButton onClick={handleToggle}>
                {isOpen ? (
                  <KeyboardArrowLeftIcon sx={{ fontSize: 20 }} />
                ) : (
                  <KeyboardArrowRightIcon sx={{ fontSize: 20 }} />
                )}
              </IconButton>
            </HeaderActions>
          </SidebarHeader>

          {isOpen && (
            <SearchContainer $isOpen={isOpen}>
              <SearchInputWrapper>
                <SearchIcon
                  sx={{ fontSize: 18, color: "var(--text-secondary, #667781)" }}
                />
                <SearchInput
                  placeholder="Search conversations"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </SearchInputWrapper>
            </SearchContainer>
          )}
          {isOpen && (
            <NewChatButton
              $isOpen={isOpen}
              variant="secondary"
              onClick={handleNewConversation}
            >
              <ChatIcon sx={{ marginRight: isOpen ? 1 : 0, fontSize: 18 }} />
              <span>Start a new conversation</span>
            </NewChatButton>
          )}
          {isOpen && (
            <NewChatButton
              $isOpen={isOpen}
              variant="secondary"
              onClick={() => setIsNewGroupOpen(true)}
            >
              <GroupIcon sx={{ marginRight: isOpen ? 1 : 0, fontSize: 18 }} />
              <span>Create a new group</span>
            </NewChatButton>
          )}

          {isOpen && (
            <ConversationsList>
              {filteredConversations?.map((conversation) => (
                <div key={conversation.id}>
                  <ConversationSelect
                    id={conversation.id}
                    conversationUsers={
                      (conversation.data() as Conversation).users
                    }
                  />
                </div>
              ))}
            </ConversationsList>
          )}

          <NewConversationDialog
            open={isNewConversationOpen}
            onClose={() => setIsNewConversationOpen(false)}
          />

          <NewGroupDialog
            open={isNewGroupOpen}
            onClose={() => setIsNewGroupOpen(false)}
          />
          <UserProfileModal
            open={isProfileModalOpen}
            onClose={handleProfileModalClose}
            user={loggedInUser}
            showSnackbar={showSnackbar}
          />
        </SidebarContainer>
      </>
    );
  }
);

Sidebar.displayName = "Sidebar";

export default Sidebar;
