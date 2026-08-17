import { Request, Response } from "express";
import { Coupon } from "../models/coupon.model";
import { Order } from "../models/order.model";

// Validate and apply a coupon
export const applyCoupon = async (req: Request, res: Response): Promise<void> => {
    try {
        const { code, subtotal } = req.body;
        const userId = req.id;

        if (!code) {
            res.status(400).json({ success: false, message: "Coupon code is required" });
            return;
        }

        const normalizedCode = code.trim().toUpperCase();

        const coupon = await Coupon.findOne({
            code: normalizedCode,
            isActive: true
        });

        if (!coupon) {
            res.status(404).json({ success: false, message: "Invalid or inactive coupon code" });
            return;
        }

        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
            res.status(400).json({ success: false, message: "This coupon code has expired" });
            return;
        }

        // Single-use per user check (Exclude cancelled orders so customer can re-try if cancelled)
        if (userId) {
            const alreadyUsed = await Order.findOne({
                user: userId,
                couponCode: normalizedCode,
                status: { $ne: "Cancelled" }
            });

            if (alreadyUsed) {
                res.status(400).json({
                    success: false,
                    message: `You have already redeemed coupon "${normalizedCode}". This offer is valid for one-time use only.`
                });
                return;
            }
        }

        const orderSubtotal = Number(subtotal) || 0;
        if (orderSubtotal < coupon.minOrderValue) {
            res.status(400).json({
                success: false,
                message: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon.`
            });
            return;
        }

        let discountAmount = 0;
        if (coupon.discountType === "percentage") {
            discountAmount = (orderSubtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
            }
        } else {
            discountAmount = coupon.discountValue;
        }

        // Cap discount to order subtotal
        discountAmount = Math.min(Math.round(discountAmount), orderSubtotal);

        res.status(200).json({
            success: true,
            message: `Coupon "${coupon.code}" applied successfully! You saved ₹${discountAmount}.`,
            coupon: {
                code: coupon.code,
                description: coupon.description,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                discountAmount
            }
        });
    } catch (error) {
        console.error("applyCoupon error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Get all currently active public coupons for customer cart drawer (excluding already used ones)
export const getActiveCoupons = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.id;
        let usedCouponCodes: string[] = [];

        if (userId) {
            usedCouponCodes = await Order.find({
                user: userId,
                status: { $ne: "Cancelled" },
                couponCode: { $exists: true, $ne: "" }
            }).distinct("couponCode");
        }

        const query: any = {
            isActive: true,
            $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: null },
                { expiresAt: { $gt: new Date() } }
            ]
        };

        if (usedCouponCodes.length > 0) {
            query.code = { $nin: usedCouponCodes };
        }

        const coupons = await Coupon.find(query).sort({ createdAt: -1 });

        res.status(200).json({ success: true, coupons });
    } catch (error) {
        console.error("getActiveCoupons error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};



// Super Admin: Get all coupons
export const getAllCouponsAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, coupons });
    } catch (error) {
        console.error("getAllCouponsAdmin error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Super Admin: Create a new coupon
export const createCouponAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { code, description, discountType, discountValue, minOrderValue, maxDiscount, expiresAt } = req.body;

        if (!code || !discountValue) {
            res.status(400).json({ success: false, message: "Coupon code and discount value are required." });
            return;
        }

        const existing = await Coupon.findOne({ code: code.trim().toUpperCase() });
        if (existing) {
            res.status(400).json({ success: false, message: "A coupon with this code already exists." });
            return;
        }

        const coupon = await Coupon.create({
            code: code.trim().toUpperCase(),
            description: description || `Get ${discountValue}${discountType === 'percentage' ? '%' : '₹'} off`,
            discountType: discountType || 'percentage',
            discountValue: Number(discountValue),
            minOrderValue: Number(minOrderValue) || 0,
            maxDiscount: maxDiscount ? Number(maxDiscount) : null,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            isActive: true
        });

        res.status(201).json({
            success: true,
            message: "Coupon created successfully",
            coupon
        });
    } catch (error) {
        console.error("createCouponAdmin error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Super Admin: Toggle coupon active status
export const toggleCouponAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findById(id);
        if (!coupon) {
            res.status(404).json({ success: false, message: "Coupon not found" });
            return;
        }

        coupon.isActive = !coupon.isActive;
        await coupon.save();

        res.status(200).json({
            success: true,
            message: `Coupon is now ${coupon.isActive ? 'Active' : 'Inactive'}`,
            coupon
        });
    } catch (error) {
        console.error("toggleCouponAdmin error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Super Admin: Delete coupon
export const deleteCouponAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findByIdAndDelete(id);
        if (!coupon) {
            res.status(404).json({ success: false, message: "Coupon not found" });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Coupon deleted successfully"
        });
    } catch (error) {
        console.error("deleteCouponAdmin error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
