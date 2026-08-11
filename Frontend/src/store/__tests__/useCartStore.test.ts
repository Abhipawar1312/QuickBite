jest.unmock("@/store/useCartStore");
jest.unmock("../useCartStore");
const { useCartStore } = jest.requireActual("../useCartStore");

import type { MenuItem } from "@/types/restaurantType";

const mockItem1: MenuItem = {
  _id: "m1",
  name: "Pizza",
  description: "Cheese pizza",
  price: 300,
  image: "pizza.jpg",
  availability: "Available"
};

const mockItem2: MenuItem = {
  _id: "m2",
  name: "Burger",
  description: "Veg burger",
  price: 150,
  image: "burger.jpg",
  availability: "Available"
};

describe("useCartStore", () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  test("should start with an empty cart", () => {
    expect(useCartStore.getState().cart).toEqual([]);
  });

  test("should add an item to cart", () => {
    useCartStore.getState().addToCart(mockItem1);
    const cart = useCartStore.getState().cart;
    expect(cart).toHaveLength(1);
    expect(cart[0]).toEqual({ ...mockItem1, quantity: 1 });
  });

  test("should increment quantity if adding existing item", () => {
    useCartStore.getState().addToCart(mockItem1);
    useCartStore.getState().addToCart(mockItem1);
    const cart = useCartStore.getState().cart;
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(2);
  });

  test("should increment item quantity using incrementQuantity", () => {
    useCartStore.getState().addToCart(mockItem1);
    useCartStore.getState().incrementQuantity("m1");
    expect(useCartStore.getState().cart[0].quantity).toBe(2);
  });

  test("should decrement item quantity using decrementQuantity", () => {
    useCartStore.getState().addToCart(mockItem1);
    useCartStore.getState().incrementQuantity("m1");
    useCartStore.getState().decrementQuantity("m1");
    expect(useCartStore.getState().cart[0].quantity).toBe(1);
  });

  test("should not decrement quantity below 1", () => {
    useCartStore.getState().addToCart(mockItem1);
    useCartStore.getState().decrementQuantity("m1");
    expect(useCartStore.getState().cart[0].quantity).toBe(1);
  });

  test("should remove item from cart", () => {
    useCartStore.getState().addToCart(mockItem1);
    useCartStore.getState().addToCart(mockItem2);
    useCartStore.getState().removeFromTheCart("m1");
    const cart = useCartStore.getState().cart;
    expect(cart).toHaveLength(1);
    expect(cart[0]._id).toBe("m2");
  });

  test("should clear cart", () => {
    useCartStore.getState().addToCart(mockItem1);
    useCartStore.getState().addToCart(mockItem2);
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().cart).toEqual([]);
  });

  test("should setCart items directly", () => {
    const items = [{ ...mockItem1, quantity: 3 }];
    useCartStore.getState().setCart(items);
    expect(useCartStore.getState().cart).toEqual(items);
  });
});
