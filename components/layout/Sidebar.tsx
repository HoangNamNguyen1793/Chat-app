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
import NewConversationDialog from "../modals/NewConversationDialog";
import NewGroupDialog from "../modals/NewGroupDialog";
import UserProfileModal from "../modals/UserProfileModal";
import ConversationSelect from "../ConversationSelect";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faChevronLeft,
  faChevronRight,
  faCommentDots,
  faRightFromBracket,
  faSearch,
  faUsers,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

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
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
      setHasMounted(true);
    }, []);

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
          where("users", "array-contains", loggedInUser.email),
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
          user.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      },
    );

    return (
      <>
        {hasMounted && isMobile && (
          <>
            {/* Mobile Toggle Button */}
            <button
              onClick={handleToggle}
              className="fixed top-4 left-4 z-[60] p-2 bg-[#667eea] text-white rounded-full shadow-lg lg:hidden"
            >
              <FontAwesomeIcon icon={isOpen ? faXmark : faBars} />
            </button>

            {/* Backdrop Overlay */}
            <div
              onClick={handleOverlayClick}
              className={`
        fixed inset-0 bg-[#2a2b30] backdrop-blur-sm z-[55] transition-opacity duration-300
        ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
      `}
            />
          </>
        )}
        <aside
          className={`
  fixed lg:relative flex flex-col h-screen z-[58] bg-[#2b2d31] border-r border-white/5 transition-all duration-300 ease-in-out
  ${isOpen ? "w-[300px]" : "w-[72px]"}
`}
        >
          {/* Sidebar Header: User Info & Toggle */}
          <div
            className={`
    flex items-center p-4 border-b border-white/5 min-h-[72px]
    ${isOpen ? "justify-between" : "justify-center"}
  `}
          >
            {isOpen && (
              <div
                onClick={handleUserInfoClick}
                className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
              >
                <UserAvatar
                  src={loggedInUser?.photoURL}
                  name={loggedInUser?.displayName || undefined}
                  email={loggedInUser?.email || undefined}
                  size="small"
                />
                <span className="text-sm font-bold text-gray-100 truncate group-hover:text-white transition-colors">
                  {loggedInUser?.displayName || loggedInUser?.email || "User"}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogout();
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <FontAwesomeIcon
                    icon={faRightFromBracket}
                    className="text-sm"
                  />
                </button>
              </div>
            )}

            {/* Toggle Button (Arrow) */}
            <button
              onClick={handleToggle}
              className={`p-2 text-gray-400 hover:text-white transition-all ${!isOpen ? "hover:bg-[#2a2b30]/5 rounded-lg" : ""}`}
            >
              <FontAwesomeIcon icon={isOpen ? faChevronLeft : faChevronRight} />
            </button>
          </div>

          {/* Search Section */}
          {isOpen && (
            <div className="p-4 animate-in fade-in duration-300">
              <div className="relative group">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#667eea] transition-colors"
                />
                <input
                  placeholder="Search conversations"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1e1f22] text-sm text-gray-200 pl-10 pr-4 py-2 rounded-lg outline-none border border-transparent focus:border-[#667eea] transition-all"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="px-2 space-y-1 mt-2">
            {[
              {
                label: "New Chat",
                icon: faCommentDots,
                onClick: handleNewConversation,
              },
              {
                label: "New Group",
                icon: faUsers,
                onClick: () => setIsNewGroupOpen(true),
              },
            ].map((action, idx) => (
              <button
                key={idx}
                onClick={action.onClick}
                className={`
          flex items-center gap-3 w-full p-3 rounded-lg text-gray-400 hover:bg-[#2a2b30]/5 hover:text-white transition-all
          ${!isOpen ? "justify-center" : ""}
        `}
              >
                <FontAwesomeIcon icon={action.icon} className="text-lg" />
                {isOpen && (
                  <span className="text-sm font-medium animate-in slide-in-from-left-2">
                    {action.label}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto mt-4 scrollbar-thin scrollbar-thumb-white/5">
            {isOpen &&
              filteredConversations?.map((conversation) => (
                <div
                  key={conversation.id}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <ConversationSelect
                    id={conversation.id}
                    conversationUsers={
                      (conversation.data() as Conversation).users
                    }
                  />
                </div>
              ))}
          </div>

          {/* Modals & Dialogs */}
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
        </aside>
      </>
    );
  },
);

Sidebar.displayName = "Sidebar";

export default Sidebar;
