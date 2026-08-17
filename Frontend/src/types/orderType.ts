import { Restaurant, MenuAddOn } from "./restaurantType";

export type CartItemPayload = {
    menuId: string;
    name: string;
    image: string;
    price: string | number;
    quantity: string | number;
    selectedAddOns?: MenuAddOn[];
};

export type CheckoutSessionRequest = {
    cartItems: CartItemPayload[];
    deliveryDetails: {
        name: string;
        email: string;
        contact: string;
        address: string;
        city: string;
        country: string;
        pincode?: string;
        longitude?: number;
        latitude?: number;
    };
    restaurantId: string;
    tipAmount?: number;
    couponCode?: string;
    discountAmount?: number;
    deliveryInstructions?: string;
    scheduledDeliveryTime?: string;
};

export interface Orders extends CheckoutSessionRequest {
    _id: string;
    status: string;
    totalAmount: number;
    deliveryFee: number;
    platformFee: number;
    distanceKM: number;
    tipAmount: number;
    discountAmount: number;
    couponCode?: string;
    deliveryInstructions?: string;
    scheduledDeliveryTime?: string;
    deliveryPin?: string;
    cancellationReason?: string;
    refundStatus?: string;
    refundAmount?: number;
    rider?: any;
    riderStatus?: string;
    restaurant?: Restaurant;
    createdAt?: string;
}


export type OrderState = {
    loading: boolean;
    orders: Orders[];
    createCheckoutSession: (checkoutSessionRequest: CheckoutSessionRequest) => Promise<void>;
    getOrderDetails: (confirmSuccess?: boolean) => Promise<void>;
    cancelOrder: (orderId: string, cancellationReason: string) => Promise<void>;
    updateLocalOrderStatus: (updatedOrder: any) => void;
    markOrderAsReviewed: (orderId: string) => void;
}