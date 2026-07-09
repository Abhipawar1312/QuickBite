import { NextFunction, Request, Response } from "express";
import { User } from "../models/user.model";

// Extend Express Request to include custom properties
declare global {
    namespace Express {
        interface Request {
            role?: string;
        }
    }
}

export const checkRole = (roles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const user = await User.findById(req.id);
            if (!user) {
                res.status(404).json({ success: false, message: "User not found" });
                return;
            }

            // Store role in request object
            req.role = user.role;

            if (!user.role || !roles.includes(user.role)) {
                res.status(403).json({
                    success: false,
                    message: "Access Denied: You do not have permission to perform this action."
                });
                return;
            }

            next();
        } catch (error) {
            console.error("Role middleware error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    };
};

export const isAdmin = checkRole(["admin"]);
export const isRestaurantOwner = checkRole(["restaurant_owner", "admin"]);
export const isRider = checkRole(["rider", "admin"]);
