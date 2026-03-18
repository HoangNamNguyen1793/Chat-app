"use client";

import React, { useState, memo } from "react";

import { useAuthState } from "react-firebase-hooks/auth";
import {
  addDoc,
  collection,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import * as EmailValidator from "email-validator";
import { auth, db } from "../../config/firebase";
import { Conversation } from "../../types";
import Button from "../common/Button";

interface NewConversationDialogProps {
  open: boolean;
  onClose: () => void;
}

const NewConversationDialog = memo(
  ({ open, onClose }: NewConversationDialogProps) => {
    const [loggedInUser] = useAuthState(auth);
    const [recipientEmail, setRecipientEmail] = useState("");
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const queryGetConversations = query(
      collection(db, "conversations"),
      where("users", "array-contains", loggedInUser?.email || ""),
    );

    const [conversationsSnapshot] = useCollection(queryGetConversations);

    const showSnackbar = (message: string) => {
      setSnackbarMessage(message);
      setSnackbarOpen(true);
    };

    const handleClose = () => {
      setRecipientEmail("");
      onClose();
    };

    const isConversationExists = (email: string) => {
      return conversationsSnapshot?.docs.some((conversation) => {
        const data = conversation.data() as Conversation;
        return (
          data.users.includes(email) && data.users.length === 2 && !data.isGroup
        );
      });
    };

    const isInvitingSelf = recipientEmail === loggedInUser?.email;

    const createConversation = async () => {
      if (!recipientEmail.trim()) {
        showSnackbar("Please enter an email address");
        return;
      }

      if (!EmailValidator.validate(recipientEmail)) {
        showSnackbar("Please enter a valid email address");
        return;
      }

      if (isInvitingSelf) {
        showSnackbar("You cannot start a conversation with yourself");
        return;
      }

      if (isConversationExists(recipientEmail)) {
        showSnackbar("Conversation already exists");
        return;
      }

      setIsCreating(true);

      try {
        await addDoc(collection(db, "conversations"), {
          users: [loggedInUser?.email, recipientEmail],
          createdAt: serverTimestamp(),
        });

        showSnackbar("Conversation created successfully!");
        handleClose();
      } catch (error) {
        console.error("Error creating conversation:", error);
        showSnackbar("Failed to create conversation. Please try again.");
      } finally {
        setIsCreating(false);
      }
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      createConversation();
    };

    return (
      <>
        {open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-[#2a2b30] backdrop-blur-sm animate-in fade-in duration-300"
              onClick={handleClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-[#313338] rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">
                  New Conversation
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase text-gray-400">
                      Email Address
                    </label>
                    <input
                      autoFocus
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="Enter recipient's email address"
                      disabled={isCreating}
                      className="w-full bg-[#1e1f22] border border-black/20 rounded-lg p-3 text-gray-200 outline-none focus:border-[#667eea] transition-all disabled:opacity-50"
                    />
                    <p className="text-xs text-gray-500 italic">
                      Enter the email address of the person you want to chat
                      with
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 mt-8">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isCreating}
                      className="px-6 py-2 rounded-xl font-medium text-gray-300 hover:bg-[#2a2b30]/5 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!recipientEmail.trim() || isCreating}
                      className="px-6 py-2 rounded-xl font-medium bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                    >
                      {isCreating ? "Creating..." : "Create"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        {snackbarOpen && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-bottom-5 duration-300">
            <div
              className={`
      flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl border
      ${
        snackbarMessage.includes("successfully")
          ? "bg-[#23a55a] border-[#667eea]-400/20 text-white"
          : "bg-[#f23f42] border-red-400/20 text-white"
      }
    `}
            >
              {/* Icon trạng thái */}
              <span className="text-lg">
                {snackbarMessage.includes("successfully") ? "✅" : "⚠️"}
              </span>

              <span className="text-sm font-medium">{snackbarMessage}</span>

              {/* Nút đóng nhanh */}
              <button
                onClick={() => setSnackbarOpen(false)}
                className="ml-4 hover:bg-black/10 rounded-full w-6 h-6 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </>
    );
  },
);

NewConversationDialog.displayName = "NewConversationDialog";

export default NewConversationDialog;
