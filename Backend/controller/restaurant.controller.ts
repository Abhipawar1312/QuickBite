import { Request, Response } from "express";
import uploadImageOnCloudinary from "../utils/imageUpload";
import { Order } from "../models/order.model";
import { Restaurant } from "../models/restaurant.model";
import { Menu } from "../models/menu.model";
import { broadcastNewOrderToRiders, sendNotification, getIo } from "../utils/socket";

export const createRestaurant = async (req: Request, res: Response): Promise<void> => {
    try {
        const { restaurantName, city, country, address, deliveryTime, cuisines, contactNumber, longitude, latitude } = req.body;
        const file = req.file;

        // Check if a restaurant already exists for this user
        const restaurant = await Restaurant.findOne({ user: req.id });
        if (restaurant) {
            res.status(400).json({
                success: false,
                message: "Restaurant already exist for this user"
            });
            return;
        }

        // Check if an image file is provided
        if (!file) {
            res.status(400).json({
                success: false,
                message: "Image is required"
            });
            return;
        }

        const imageUrl = await uploadImageOnCloudinary(file as Express.Multer.File);
        const parsedLongitude = longitude ? Number(longitude) : 72.978088;
        const parsedLatitude = latitude ? Number(latitude) : 19.218330;

        await Restaurant.create({
            user: req.id,
            restaurantName,
            city,
            country,
            address: address || "N/A",
            deliveryTime,
            cuisines: JSON.parse(cuisines),
            imageUrl,
            contactNumber: contactNumber || "N/A",
            isOpen: true,
            isVerified: false,
            location: {
                type: "Point",
                coordinates: [parsedLongitude, parsedLatitude]
            }
        });

        res.status(201).json({
            success: true,
            message: "Restaurant Added"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getRestaurant = async (req: Request, res: Response): Promise<void> => {
    try {
        const restaurant = await Restaurant.findOne({ user: req.id }).populate('menus');
        if (!restaurant) {
            res.status(404).json({
                success: false,
                restaurant: [],
                message: "Restaurant not found"
            });
            return;
        }
        res.status(200).json({ success: true, restaurant });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateRestaurant = async (req: Request, res: Response): Promise<void> => {
    try {
        const { restaurantName, city, country, address, deliveryTime, cuisines, contactNumber, longitude, latitude } = req.body;
        const file = req.file;
        const restaurant = await Restaurant.findOne({ user: req.id });
        if (!restaurant) {
            res.status(404).json({
                success: false,
                message: "Restaurant not found"
            });
            return;
        }

        restaurant.restaurantName = restaurantName;
        restaurant.city = city;
        restaurant.country = country;
        restaurant.address = address || restaurant.address;
        restaurant.deliveryTime = deliveryTime;
        restaurant.cuisines = JSON.parse(cuisines);
        restaurant.contactNumber = contactNumber || restaurant.contactNumber;

        if (longitude && latitude) {
            restaurant.location = {
                type: "Point",
                coordinates: [Number(longitude), Number(latitude)]
            };
        }

        if (file) {
            const imageUrl = await uploadImageOnCloudinary(file as Express.Multer.File);
            restaurant.imageUrl = imageUrl;
        }
        await restaurant.save();
        res.status(200).json({
            success: true,
            message: "Restaurant updated",
            restaurant
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getRestaurantOrder = async (req: Request, res: Response): Promise<void> => {
    try {
        const restaurant = await Restaurant.findOne({ user: req.id });
        if (!restaurant) {
            res.status(404).json({
                success: false,
                message: "Restaurant not found"
            });
            return;
        }
        const orders = await Order.find({ 
            restaurant: restaurant._id,
            status: { $ne: "pending" }
        })
            .populate('restaurant')
            .populate('user')
            .populate('rider');
        res.status(200).json({
            success: true,
            orders
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const order = await Order.findById(orderId);
        if (!order) {
            res.status(404).json({
                success: false,
                message: "Order not found"
            });
            return;
        }
        order.status = status;
        await order.save();

        const populatedOrder = await Order.findById(order._id)
            .populate("restaurant")
            .populate("user", "-password")
            .populate("rider");

        if (populatedOrder) {
            // Send to customer
            sendNotification(populatedOrder.user._id.toString(), "order_status_updated", populatedOrder);
            // Send to order room
            const io = getIo();
            io.to(`order_${order._id}`).emit("order_status_updated", populatedOrder);
        }

        if (status === "ready_for_riders" && populatedOrder) {
            broadcastNewOrderToRiders(populatedOrder);
        }

        res.status(200).json({
            success: true,
            status: order.status,
            message: "Status updated"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const searchRestaurant = async (req: Request, res: Response): Promise<void> => {
    try {
        const searchText = req.params.searchText || "";
        const searchQuery = req.query.searchQuery as string || "";
        const selectedCuisines = (req.query.selectedCuisines as string || "")
            .split(",")
            .filter(cuisine => cuisine);
        const query: any = {};

        // Basic search on restaurantName, city, country, cuisines, or menu items
        if (searchText) {
            const matchingMenus = await Menu.find({
                name: { $regex: searchText, $options: 'i' }
            }).select('_id');
            const menuIds = matchingMenus.map(m => m._id);

            query.$or = [
                { restaurantName: { $regex: searchText, $options: 'i' } },
                { city: { $regex: searchText, $options: 'i' } },
                { country: { $regex: searchText, $options: 'i' } },
                { cuisines: { $elemMatch: { $regex: searchText, $options: "i" } } },
                { menus: { $in: menuIds } }
            ];
        }

        // Additional search on restaurantName, cuisines, or menu items
        if (searchQuery) {
            const matchingMenus = await Menu.find({
                name: { $regex: searchQuery, $options: 'i' }
            }).select('_id');
            const menuIds = matchingMenus.map(m => m._id);

            query.$or = [
                { restaurantName: { $regex: searchQuery, $options: 'i' } },
                { cuisines: { $regex: searchQuery, $options: 'i' } },
                { menus: { $in: menuIds } }
            ];
        }

        // Filter based on selected cuisines if provided
        if (selectedCuisines.length > 0) {
            query.cuisines = { $in: selectedCuisines };
        }

        // Only search verified restaurants
        query.isVerified = true;

        const restaurants = await Restaurant.find(query);
        res.status(200).json({
            success: true,
            data: restaurants
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getSingleRestaurant = async (req: Request, res: Response): Promise<void> => {
    try {
        const restaurantId = req.params.id;
        const restaurant = await Restaurant.findById(restaurantId).populate({
            path: 'menus',
            options: { createdAt: -1 }
        });
        if (!restaurant) {
            res.status(404).json({
                success: false,
                message: "Restaurant not found"
            });
            return;
        }
        res.status(200).json({ success: true, restaurant });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const toggleRestaurantStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const restaurant = await Restaurant.findOne({ user: req.id });
        if (!restaurant) {
            res.status(404).json({ success: false, message: "Restaurant not found" });
            return;
        }

        restaurant.isOpen = !restaurant.isOpen;
        await restaurant.save();

        res.status(200).json({
            success: true,
            message: `Restaurant is now ${restaurant.isOpen ? 'Open' : 'Closed'}`,
            isOpen: restaurant.isOpen
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getAllRestaurantsAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const restaurants = await Restaurant.find().populate('user', 'fullname email');
        res.status(200).json({ success: true, restaurants });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const verifyRestaurantAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            res.status(404).json({ success: false, message: "Restaurant not found" });
            return;
        }

        restaurant.isVerified = true;
        await restaurant.save();

        res.status(200).json({
            success: true,
            message: "Restaurant verified successfully"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteRestaurantAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const restaurant = await Restaurant.findByIdAndDelete(id);
        if (!restaurant) {
            res.status(404).json({ success: false, message: "Restaurant not found" });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Restaurant deleted successfully"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};
