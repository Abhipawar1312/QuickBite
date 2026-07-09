import { Restaurant } from "./restaurantType";

export type CheckoutSessionRequest = {
    cartItems: {
        menuId: string;
        name: string;
        image: string;
        price: string;
        quantity: string;
    }[];
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
    },
    restaurantId: string;
}
export interface Orders extends CheckoutSessionRequest {
    _id: string;
    status: string;
    totalAmount: number;
    deliveryFee: number;
    platformFee: number;
    distanceKM: number;
    cancellationReason?: string;
    rider?: any;
    riderStatus?: string;
    restaurant?: Restaurant;
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