import { Server as SocketIOServer } from "socket.io";
import type { NextApiRequest, NextApiResponse } from "next";
import { Server as NetServer } from "http";

export const config = {
  api: {
    bodyParser: false,
  },
};

const SocketHandler = (req: NextApiRequest, res: NextApiResponse) => {
  if (!(res.socket as any)?.server?.io) {
    console.log("Khởi tạo Socket.io server...");
    const httpServer: NetServer = (res.socket as any)?.server as any;
    const io = new SocketIOServer(httpServer, {
      path: "/api/socket",
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    const onlineUsers = new Map();

    io.on("connection", (socket) => {
      console.log(`Người dùng đã kết nối: ${socket.id}`);

      socket.on("user-online", (userEmail) => {
        onlineUsers.set(userEmail, socket.id);

        io.emit("online-users", Array.from(onlineUsers.keys()));
      });

      socket.on("join-conversation", (conversationId) => {
        socket.join(conversationId);
        console.log(
          `Người dùng ${socket.id} đã tham gia cuộc trò chuyện: ${conversationId}`
        );
      });

      socket.on("send-message", (messageData) => {
        console.log("Tin nhắn mới:", messageData);

        io.to(messageData.conversationId).emit("new-message", messageData);
      });

      socket.on("typing", (data) => {
        socket.to(data.conversationId).emit("user-typing", {
          user: data.user,
          isTyping: data.isTyping,
        });
      });

      socket.on("message-read", (data) => {
        console.log("Message read receipt:", data);

        socket.to(data.conversationId).emit("message-read-update", {
          messageId: data.messageId,
          readBy: data.readBy,
          readAt: data.readAt,
          conversationId: data.conversationId,
        });
      });

      socket.on("messages-read-bulk", (data) => {
        console.log("Bulk messages read:", data);
        socket.to(data.conversationId).emit("messages-read-bulk-update", {
          messageIds: data.messageIds,
          readBy: data.readBy,
          readAt: data.readAt,
          conversationId: data.conversationId,
        });
      });

      socket.on("disconnect", () => {
        console.log(`Người dùng đã ngắt kết nối: ${socket.id}`);

        let disconnectedUser = null;
        Array.from(onlineUsers.entries()).forEach(([user, id]) => {
          if (id === socket.id) {
            disconnectedUser = user;
            return;
          }
        });
        if (disconnectedUser) {
          onlineUsers.delete(disconnectedUser);

          io.emit("online-users", Array.from(onlineUsers.keys()));
        }
      });
    });

    ((res.socket as any).server as any).io = io;
  }

  res.end();
};

export default SocketHandler;
