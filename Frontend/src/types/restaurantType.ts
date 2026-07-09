import { Orders } from "./orderType";

export type MenuItem = {
    _id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    availability: 'Available' | 'Out of Stock';
    createdAt?: Date;
    updatedAt?: Date;
}

export type Restaurant = {
    _id: string;
    user: string;
    restaurantName: string;
    city: string;
    country: string;
    deliveryTime: number;
    cuisines: string[];
    menus: MenuItem[];
    imageUrl: string;
    contactNumber?: string;
    isOpen?: boolean;
    isVerified?: boolean;
}

export type SearchedRestaurant = {
    data: Restaurant[]
}

export type RestaurantState = {
    loading: boolean;
    restaurant: Restaurant | null;
    searchedRestaurant: SearchedRestaurant | null;
    appliedFilter: string[];
    singleRestaurant: Restaurant | null,
    restaurantOrder: Orders[],
    createRestaurant: (formData: FormData) => Promise<void>;
    getRestaurant: () => Promise<void>;
    clearRestaurantData: () => void;
    updateRestaurant: (formData: FormData) => Promise<void>;
    searchRestaurant: (searchText: string, searchQuery: string, selectedCuisines: any) => Promise<void>;
    addMenuToRestaurant: (menu: MenuItem) => void;
    updateMenuToRestaurant: (menu: MenuItem) => void;
    removeMenuFromRestaurant: (menuId: string) => void;
    updateMenuAvailability: (menuId: string, availability: 'Available' | 'Out of Stock') => void;
    setAppliedFilter: (value: string) => void;
    resetAppliedFilter: () => void;
    getSingleRestaurant: (restaurantId: string) => Promise<void>;
    getRestaurantOrders: () => Promise<void>;
    updateRestaurantOrder: (orderId: string, status: string) => Promise<void>;
    toggleRestaurantStatus: () => Promise<void>;
    getAllRestaurantsAdmin: () => Promise<Restaurant[]>;
    verifyRestaurantAdmin: (restaurantId: string) => Promise<void>;
    deleteRestaurantAdmin: (restaurantId: string) => Promise<void>;
    updateLocalRestaurantOrder: (updatedOrder: any) => void;
    addLocalRestaurantOrder: (newOrder: any) => void;
    updateSingleRestaurantMenu: (data: { action: "add" | "edit" | "delete", menu?: MenuItem, menuId?: string }) => void;
    updateSingleRestaurantRatings: (averageRating: number, numReviews: number) => void;
}