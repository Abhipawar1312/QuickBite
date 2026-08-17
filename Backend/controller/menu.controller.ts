import { Request, Response } from "express";
import uploadImageOnCloudinary from "../utils/imageUpload";
import { Menu } from "../models/menu.model";
import { Restaurant } from "../models/restaurant.model";
import mongoose from "mongoose";
import { getIo } from "../utils/socket";
import { cache } from "../utils/cache";


export const addMenu = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, description, price, isVeg, category, addOns } = req.body;
        const file = req.file;

        if (!file) {
            res.status(400).json({
                success: false,
                message: "Image is required"
            });
            return;
        }

        const imageUrl = await uploadImageOnCloudinary(file as Express.Multer.File);
        
        let parsedAddOns = [];
        if (addOns) {
            try {
                parsedAddOns = typeof addOns === "string" ? JSON.parse(addOns) : addOns;
            } catch (e) {
                parsedAddOns = [];
            }
        }

        const menu = await Menu.create({
            name,
            description,
            price: Number(price),
            image: imageUrl,
            availability: 'Available',
            isVeg: isVeg === "false" || isVeg === false ? false : true,
            category: category || "Main Course",
            addOns: parsedAddOns
        });

        const restaurant = await Restaurant.findOne({ user: req.id });
        if (restaurant) {
            // Ensure menus is an array of ObjectIds before pushing
            (restaurant.menus as mongoose.Types.ObjectId[]).push(menu._id as mongoose.Types.ObjectId);
            await restaurant.save();
            await cache.invalidatePattern("restaurants:");

            // Emit real-time menu change
            const io = getIo();
            io.emit("restaurant_menu_changed", {
                restaurantId: (restaurant._id as any).toString(),
                menu,
                action: "add"
            });
        } else {
            await cache.invalidatePattern("restaurants:");
        }

        res.status(201).json({
            success: true,
            message: "Menu added successfully",
            menu
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const editMenu = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, description, price, availability, isVeg, category, addOns } = req.body;
        const file = req.file;

        const menu = await Menu.findById(id);
        if (!menu) {
            res.status(404).json({
                success: false,
                message: "Menu not found!"
            });
            return;
        }

        if (name) menu.name = name;
        if (description) menu.description = description;
        if (price !== undefined) menu.price = Number(price);
        if (availability) menu.availability = availability;
        if (isVeg !== undefined) menu.isVeg = isVeg === "false" || isVeg === false ? false : true;
        if (category) menu.category = category;
        if (addOns !== undefined) {
            try {
                menu.addOns = typeof addOns === "string" ? JSON.parse(addOns) : addOns;
            } catch (e) {
                // ignore
            }
        }

        if (file) {
            const imageUrl = await uploadImageOnCloudinary(file as Express.Multer.File);
            menu.image = imageUrl;
        }

        await menu.save();
        await cache.invalidatePattern("restaurants:");

        const restaurant = await Restaurant.findOne({ menus: { $in: [menu._id] } });
        if (restaurant) {
            const io = getIo();
            io.emit("restaurant_menu_changed", {
                restaurantId: (restaurant._id as any).toString(),
                menu,
                action: "edit"
            });
        }

        res.status(200).json({
            success: true,
            message: "Menu updated successfully",
            menu,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteMenu = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const menu = await Menu.findById(id);
        if (!menu) {
            res.status(404).json({
                success: false,
                message: "Menu not found!"
            });
            return;
        }

        // Remove menu from restaurant's menus array
        const restaurant = await Restaurant.findOne({ user: req.id });
        if (restaurant) {
            restaurant.menus = (restaurant.menus as mongoose.Types.ObjectId[]).filter(
                menuId => menuId.toString() !== id
            );
            await restaurant.save();
            const io = getIo();
            io.emit("restaurant_menu_changed", {
                restaurantId: (restaurant._id as any).toString(),
                menuId: id,
                action: "delete"
            });
        }

        // Delete the menu
        await Menu.findByIdAndDelete(id);
        await cache.invalidatePattern("restaurants:");

        res.status(200).json({
            success: true,
            message: "Menu deleted successfully"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const toggleMenuAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { availability } = req.body;

        // Validate availability value
        if (!availability || !['Available', 'Out of Stock'].includes(availability)) {
            res.status(400).json({
                success: false,
                message: "Valid availability status is required (available or Out of Stock)"
            });
            return;
        }

        const menu = await Menu.findById(id);
        if (!menu) {
            res.status(404).json({
                success: false,
                message: "Menu not found!"
            });
            return;
        }

        // Check if the menu belongs to the user's restaurant
        const restaurant = await Restaurant.findOne({
            user: req.id,
            menus: { $in: [id] }
        });

        if (!restaurant) {
            res.status(403).json({
                success: false,
                message: "You are not authorized to update this menu"
            });
            return;
        }

        menu.availability = availability;
        await menu.save();
        await cache.invalidatePattern("restaurants:");


        const io = getIo();
        io.emit("restaurant_menu_changed", {
            restaurantId: (restaurant._id as any).toString(),
            menu,
            action: "edit"
        });

        res.status(200).json({
            success: true,
            message: `Menu ${availability === 'Available' ? 'marked as available' : 'marked as out of stock'}`,
            menu,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getMenusByRestaurant = async (req: Request, res: Response): Promise<void> => {
    try {
        const restaurant = await Restaurant.findOne({ user: req.id }).populate('menus');
        if (!restaurant) {
            res.status(404).json({
                success: false,
                message: "Restaurant not found"
            });
            return;
        }

        res.status(200).json({
            success: true,
            menus: restaurant.menus
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};