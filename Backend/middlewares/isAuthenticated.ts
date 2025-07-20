import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request to include our custom `id` property
declare global {
    namespace Express {
        interface Request {
            id: string;
        }
    }
}

export const isAuthenticated = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const token = req.cookies.token;

        // 1️⃣ Check for token in cookies
        if (!token) {
            res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
            return;
        }

        // 2️⃣ Decode and verify token
        const decoded = jwt.verify(token, process.env.SECRET_KEY!) as jwt.JwtPayload;

        // Optional debug log (remove in production)
        console.log("Decoded token:", decoded);

        // 3️⃣ Ensure token contains userId
        if (!decoded || !decoded.userId) {
            res.status(401).json({
                success: false,
                message: "Invalid token",
            });
            return;
        }

        // 4️⃣ Set req.id for use in controllers
        req.id = decoded.userId;

        // 5️⃣ Proceed to next middleware or controller
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
