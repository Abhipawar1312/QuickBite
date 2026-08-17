export type Coupon = {
    _id: string;
    code: string;
    description: string;
    discountType: 'percentage' | 'flat';
    discountValue: number;
    minOrderValue: number;
    maxDiscount?: number;
    isActive: boolean;
    expiresAt?: string;
    isUsed?: boolean;
    createdAt?: string;
};


export type CouponState = {
    loading: boolean;
    activeCoupons: Coupon[];
    allCoupons: Coupon[];
    getActiveCoupons: () => Promise<void>;
    applyCoupon: (code: string, subtotal: number) => Promise<{ success: boolean; message: string; discountAmount?: number }>;
    getAllCouponsAdmin: () => Promise<void>;
    createCouponAdmin: (data: Partial<Coupon>) => Promise<boolean>;
    toggleCouponAdmin: (id: string) => Promise<boolean>;
    deleteCouponAdmin: (id: string) => Promise<boolean>;
};
