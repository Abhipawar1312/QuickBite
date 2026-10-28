import { Server, Socket } from "socket.io";
import http from "http";

let io: Server;

// Map to keep track of online riders: userId -> socketId
export const onlineRiders = new Map<string, string>();
// Map to keep track of all active users: userId -> socketId
export const activeUsers = new Map<string, string>();

import jwt from "jsonwebtoken";
import { isValidCoordinate } from "./geo";

export const initializeSocket = (server: http.Server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:5173",
            credentials: true,
            methods: ["GET", "POST"]
        }
    });

    // Socket Authentication Middleware
    io.use((socket: Socket, next) => {
        const token =
            (socket.handshake.auth?.token as string) ||
            socket.handshake.headers.cookie
                ?.split("; ")
                .find((row) => row.startsWith("token="))
                ?.split("=")[1];

        if (token && process.env.SECRET_KEY) {
            try {
                const decoded = jwt.verify(token, process.env.SECRET_KEY) as any;
                if (decoded && decoded.userId) {
                    (socket as any).authenticatedUserId = decoded.userId;
                }
            } catch {
                console.warn(`[Socket.io] Invalid token on handshake from ${socket.id}`);
            }
        }
        next();
    });

    io.on("connection", (socket: Socket) => {
        const queryUserId = socket.handshake.query.userId as string;
        const authUserId = (socket as any).authenticatedUserId;
        const userId = authUserId || queryUserId;
        const role = socket.handshake.query.role as string;

        if (userId) {
            activeUsers.set(userId, socket.id);
            socket.join(`user_${userId}`); // Join user-specific room
            console.log(`Socket ${socket.id} joined room: user_${userId}`);

            if (role === "rider") {
                onlineRiders.set(userId, socket.id);
                console.log(`Rider connected: ${userId} (Socket: ${socket.id})`);
            } else {
                console.log(`User connected: ${userId} (Socket: ${socket.id})`);
            }
        }

        // Subscribe to a specific order room for tracking
        socket.on("join_order", (orderId: string) => {
            if (orderId && typeof orderId === "string") {
                socket.join(`order_${orderId}`);
                console.log(`Socket ${socket.id} joined room: order_${orderId}`);
            }
        });

        // Rider live location update with validation
        socket.on("update_rider_location", (data: { orderId: string; lat: number; lng: number }) => {
            const { orderId, lat, lng } = data || {};
            if (orderId && isValidCoordinate(lat, lng)) {
                // Broadcast verified location to the order room
                io.to(`order_${orderId}`).emit("rider_location_updated", { lat, lng });
            }
        });

        socket.on("disconnect", () => {
            if (userId) {
                activeUsers.delete(userId);
                onlineRiders.delete(userId);
                console.log(`User disconnected: ${userId}`);
            }
        });
    });

    return io;
};

export const getIo = (): Server => {
    if (!io) {
        throw new Error("Socket.io is not initialized!");
    }
    return io;
};

// Send real-time notification to a specific user (handles multiple tabs/sockets)
export const sendNotification = (userId: string, eventName: string, data: any) => {
    if (io) {
        io.to(`user_${userId}`).emit(eventName, data);
        console.log(`[sendNotification] Emitted event: ${eventName} to user room: user_${userId}`);
    }
};

// Broadcast new order to all online riders
export const broadcastNewOrderToRiders = (orderData: any) => {
    if (io) {
        onlineRiders.forEach((socketId) => {
            io.to(socketId).emit("new_order_available", orderData);
        });
    }
};
