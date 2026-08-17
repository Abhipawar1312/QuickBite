import { MenuItem, MenuAddOn } from "./restaurantType";

export interface CartItem extends MenuItem {
    quantity: number;
    selectedAddOns?: MenuAddOn[];
    cartItemId?: string; // unique identifier when same dish has different add-ons
}

export type CartState = {
    cart: CartItem[];
    restaurantId: string | null;
    restaurantName: string | null;
    tipAmount: number;
    couponCode: string;
    discountAmount: number;
    deliveryInstructions: string;
    scheduledDeliveryTime: string;
    addToCart: (item: MenuItem, restaurantId?: string, restaurantName?: string, selectedAddOns?: MenuAddOn[]) => void;
    clearCart: () => void;
    removeFromTheCart: (id: string) => void;
    removeAddOnFromCartItem: (cartItemId: string, addOnName: string) => void;
    updateCartItemAddOns: (cartItemId: string, newAddOns: MenuAddOn[]) => void;
    incrementQuantity: (id: string) => void;
    decrementQuantity: (id: string) => void;
    setCart: (items: CartItem[], restaurantId?: string, restaurantName?: string) => void;
    setTipAmount: (amount: number) => void;
    setCoupon: (code: string, discount: number) => void;
    clearCoupon: () => void;
    setDeliveryInstructions: (instructions: string) => void;
    setScheduledDeliveryTime: (time: string) => void;
}