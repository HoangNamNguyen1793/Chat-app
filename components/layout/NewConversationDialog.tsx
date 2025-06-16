"use client";

import React, { useState, memo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
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
      where("users", "array-contains", loggedInUser?.email || "")
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
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>New Conversation</DialogTitle>

          <form onSubmit={handleSubmit}>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Email Address"
                type="email"
                fullWidth
                variant="outlined"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="Enter recipient's email address"
                disabled={isCreating}
                helperText="Enter the email address of the person you want to chat with"
              />
            </DialogContent>

            <DialogActions sx={{ padding: 2, gap: 1 }}>
              <Button
                onClick={handleClose}
                variant="outline"
                disabled={isCreating}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                disabled={!recipientEmail.trim() || isCreating}
              >
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={5000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={
              snackbarMessage.includes("successfully") ? "success" : "error"
            }
            variant="filled"
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </>
    );
  }
);

NewConversationDialog.displayName = "NewConversationDialog";

export default NewConversationDialog;
