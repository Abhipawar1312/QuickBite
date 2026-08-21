import { CartState } from "@/types/cartType";
import { MenuItem, MenuAddOn } from "@/types/restaurantType";
import { create } from "zustand";
import { createJSONStorage, persist } from 'zustand/middleware';

export const useCartStore = create<CartState>()(persist((set) => ({
    cart: [],
    restaurantId: null,
    restaurantName: null,
    tipAmount: 0,
    couponCode: "",
    discountAmount: 0,
    deliveryInstructions: "",
    restaurantNote: "",
    scheduledDeliveryTime: "",

    addToCart: (item: MenuItem, restId?: string, restName?: string, selectedAddOns?: MenuAddOn[]) => {
        set((state) => {
            const addOns = (selectedAddOns || []).filter((a) => (a.quantity === undefined || a.quantity > 0));
            // Create a unique identifier for items with specific add-on combinations and quantities
            const addOnsKey = addOns.map((a) => `${a.name}x${a.quantity || 1}`).sort().join("|");
            const cartItemId = `${item._id}_${addOnsKey}`;

            const existingIndex = state.cart.findIndex(
                (ci) => (ci.cartItemId || ci._id) === cartItemId
            );

            let newCart = [...state.cart];
            if (existingIndex > -1) {
                newCart[existingIndex] = {
                    ...newCart[existingIndex],
                    quantity: newCart[existingIndex].quantity + 1
                };
            } else {
                newCart.push({
                    ...item,
                    quantity: 1,
                    selectedAddOns: addOns,
                    cartItemId
                });
            }

            return {
                cart: newCart,
                restaurantId: restId || state.restaurantId,
                restaurantName: restName || state.restaurantName
            };
        });
    },

    clearCart: () => {
        set({
            cart: [],
            restaurantId: null,
            restaurantName: null,
            tipAmount: 0,
            couponCode: "",
            discountAmount: 0,
            deliveryInstructions: "",
            restaurantNote: "",
            scheduledDeliveryTime: ""
        });
    },


    removeFromTheCart: (id: string) => {
        set((state) => {
            const newCart = state.cart.filter((item) => (item.cartItemId || item._id) !== id && item._id !== id);
            return {
                cart: newCart,
                restaurantId: newCart.length === 0 ? null : state.restaurantId,
                restaurantName: newCart.length === 0 ? null : state.restaurantName
            };
        });
    },

    removeAddOnFromCartItem: (cartItemId: string, addOnName: string) => {
        set((state) => {
            const newCart = state.cart.map((item) => {
                const key = item.cartItemId || item._id;
                if (key === cartItemId || item._id === cartItemId) {
                    const updatedAddOns = (item.selectedAddOns || []).filter((a) => a.name !== addOnName);
                    const addOnsKey = updatedAddOns.map((a) => `${a.name}x${a.quantity || 1}`).sort().join("|");
                    const newCartItemId = `${item._id}_${addOnsKey}`;
                    return {
                        ...item,
                        selectedAddOns: updatedAddOns,
                        cartItemId: newCartItemId
                    };
                }
                return item;
            });
            return { cart: newCart };
        });
    },

    updateCartItemAddOns: (cartItemId: string, newAddOns: MenuAddOn[]) => {
        set((state) => {
            const validAddOns = newAddOns.filter((a) => (a.quantity === undefined || a.quantity > 0));
            const newCart = state.cart.map((item) => {
                const key = item.cartItemId || item._id;
                if (key === cartItemId || item._id === cartItemId) {
                    const addOnsKey = validAddOns.map((a) => `${a.name}x${a.quantity || 1}`).sort().join("|");
                    const newCartItemId = `${item._id}_${addOnsKey}`;
                    return {
                        ...item,
                        selectedAddOns: validAddOns,
                        cartItemId: newCartItemId
                    };
                }
                return item;
            });
            return { cart: newCart };
        });
    },



    incrementQuantity: (id: string) => {
        set((state) => ({
            cart: state.cart.map((item) =>
                (item.cartItemId || item._id) === id || item._id === id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            )
        }));
    },

    decrementQuantity: (id: string) => {
        set((state) => ({
            cart: state.cart.map((item) =>
                ((item.cartItemId || item._id) === id || item._id === id) && item.quantity > 1
                    ? { ...item, quantity: item.quantity - 1 }
                    : item
            )
        }));
    },

    setCart: (items, restId, restName) => {
        set((state) => ({
            cart: items,
            restaurantId: restId !== undefined ? restId : state.restaurantId,
            restaurantName: restName !== undefined ? restName : state.restaurantName
        }));
    },

    setTipAmount: (amount: number) => {
        set({ tipAmount: Math.max(0, amount) });
    },

    setCoupon: (code: string, discount: number) => {
        set({ couponCode: code, discountAmount: Math.max(0, discount) });
    },

    clearCoupon: () => {
        set({ couponCode: "", discountAmount: 0 });
    },

    setDeliveryInstructions: (instructions: string) => {
        set({ deliveryInstructions: instructions });
    },

    setRestaurantNote: (note: string) => {
        set({ restaurantNote: note });
    },

    setScheduledDeliveryTime: (time: string) => {
        set({ scheduledDeliveryTime: time });
    }
}),

    {
        name: 'quickbite-cart',
        storage: createJSONStorage(() => localStorage)
    }
));