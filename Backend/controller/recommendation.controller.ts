import { Request, Response } from "express";
import mongoose from "mongoose";
import { Order } from "../models/order.model";
import { Restaurant } from "../models/restaurant.model";
import { Menu } from "../models/menu.model";
import { User } from "../models/user.model";
import { cache } from "../utils/cache";

// Helper to deduplicate array of items by _id or name
function deduplicateItems(items: any[]): any[] {
  const seen = new Set<string>();
  const result: any[] = [];
  for (const item of items) {
    if (!item) continue;
    const id = item._id ? item._id.toString() : item.name;
    if (id && !seen.has(id)) {
      seen.add(id);
      result.push(item);
    }
  }
  return result;
}

/**
 * 1. Frequently Paired Together (Market-Basket Analysis / Item Co-occurrence)
 * Computes dish synergies based on database aggregation of historical order co-occurrences.
 */
export const getFrequentlyPaired = async (req: Request, res: Response): Promise<void> => {
  try {
    const { menuId, restaurantId, excludeIds } = req.query;
    if (!menuId && !restaurantId) {
      res.status(400).json({ success: false, message: "menuId or restaurantId is required" });
      return;
    }

    const excludeList = excludeIds
      ? (typeof excludeIds === "string" ? excludeIds.split(",") : (excludeIds as string[])).map((id) => id.toString())
      : [];
    if (menuId) excludeList.push(menuId.toString());

    let topPairedIds: string[] = [];

    // MongoDB Aggregation Pipeline: High-performance item synergy co-occurrence
    if (menuId && mongoose.Types.ObjectId.isValid(menuId.toString())) {
      const targetMenuObjId = new mongoose.Types.ObjectId(menuId.toString());
      const excludeObjIds = excludeList
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      const cooccurrences = await Order.aggregate([
        {
          $match: {
            "cartItems.menuId": targetMenuObjId,
            status: { $nin: ["Cancelled", "cancelled"] },
          },
        },
        { $unwind: "$cartItems" },
        {
          $match: {
            "cartItems.menuId": {
              $ne: targetMenuObjId,
              $nin: excludeObjIds,
            },
          },
        },
        {
          $group: {
            _id: "$cartItems.menuId",
            pairCount: { $sum: 1 },
          },
        },
        { $sort: { pairCount: -1 } },
        { $limit: 4 },
      ]);

      topPairedIds = cooccurrences.map((c) => c._id.toString());
    }

    let pairedItems: any[] = [];
    if (topPairedIds.length > 0) {
      pairedItems = await Menu.find({ _id: { $in: topPairedIds } });
    }

    // Complementary dishes from the same restaurant's populated menus (Cold-start fallback)
    if (pairedItems.length < 4 && restaurantId) {
      const restaurant = await Restaurant.findById(restaurantId).populate("menus");
      if (restaurant && Array.isArray(restaurant.menus)) {
        const otherMenus = (restaurant.menus as any[]).filter(
          (m) => m && m._id && !excludeList.includes(m._id.toString()) && !topPairedIds.includes(m._id.toString())
        );
        pairedItems = [...pairedItems, ...otherMenus];
      }
    }

    // Deduplicate strictly
    const uniquePairedItems = deduplicateItems(pairedItems).slice(0, 4);

    res.status(200).json({
      success: true,
      pairedItems: uniquePairedItems,
    });
  } catch (error) {
    console.error("getFrequentlyPaired error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * 2. Trending in your area (Collaborative Local Popularity)
 * Identifies top-rated restaurants and popular dishes in the user's city or area.
 */
export const getTrending = async (req: Request, res: Response): Promise<void> => {
  try {
    const city = (req.query.city as string) || "";
    const cacheKey = `rec:trending:${city || "all"}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      res.status(200).json({ success: true, trending: cached, cached: true });
      return;
    }

    const query: any = { isVerified: true };
    if (city && city.trim() && city.trim().toLowerCase() !== "all") {
      query.city = { $regex: `^${city.trim()}$`, $options: "i" };
    }

    // Fetch top-rated restaurants strictly in this requested area
    const topRestaurants = await Restaurant.find(query)
      .populate("menus")
      .sort({ averageRating: -1, numReviews: -1 })
      .limit(6);

    // If city was specified but has no restaurants registered, return empty without cross-city leakage
    if (city && city.trim() && city.trim().toLowerCase() !== "all" && topRestaurants.length === 0) {
      const emptyResult = {
        restaurants: [],
        dishes: [],
      };
      await cache.set(cacheKey, emptyResult, 180);
      res.status(200).json({
        success: true,
        trending: emptyResult,
      });
      return;
    }

    // Extract unique dishes from populated restaurants in this city
    const rawDishes: any[] = [];
    topRestaurants.forEach((rest) => {
      if (Array.isArray(rest.menus)) {
        rest.menus.forEach((m: any) => {
          if (m && m._id) {
            rawDishes.push({
              ...(typeof m.toObject === "function" ? m.toObject() : m),
              restaurant: {
                _id: rest._id,
                restaurantName: rest.restaurantName,
                city: rest.city,
                imageUrl: rest.imageUrl,
              },
            });
          }
        });
      }
    });

    const uniqueDishes = deduplicateItems(rawDishes).slice(0, 8);

    const result = {
      restaurants: topRestaurants,
      dishes: uniqueDishes,
    };

    await cache.set(cacheKey, result, 300);
    res.status(200).json({
      success: true,
      trending: result,
    });
  } catch (error) {
    console.error("getTrending error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * 3. Personalized Recommendations ("Based on your past orders")
 * Uses Recency-Weighted Cuisine Affinity + Time-of-Day Context with Cold-Start Fallback.
 */
export const getPersonalized = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.id;
    const cacheKey = `rec:personalized:${userId}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      res.status(200).json({ success: true, recommendations: cached, cached: true });
      return;
    }

    // Fetch user's completed orders with recency ordering
    const pastOrders = await Order.find({
      user: userId,
      status: { $in: ["delivered", "confirmed", "outfordelivery", "preparing"] },
    })
      .populate({
        path: "restaurant",
        select: "cuisines city restaurantName imageUrl averageRating",
      })
      .sort({ createdAt: -1 })
      .limit(20);

    // Compute Recency-Weighted Cuisine Score Map
    const cuisineScores = new Map<string, number>();

    pastOrders.forEach((o, index) => {
      // Recency decay factor: recent orders (index 0..4) weight 1.0, older orders decay to 0.4
      const recencyWeight = Math.max(0.4, 1.0 - index * 0.03);
      const rest = o.restaurant as any;
      if (rest?.cuisines && Array.isArray(rest.cuisines)) {
        rest.cuisines.forEach((c: string) => {
          const key = c.trim().toLowerCase();
          cuisineScores.set(key, (cuisineScores.get(key) || 0) + recencyWeight);
        });
      }
    });

    // Sort favorite cuisines by weighted score
    const topCuisines = Array.from(cuisineScores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cuisine]) => cuisine);

    const user = await User.findById(userId);
    const userCity = user?.city || "";

    let recommendedRestaurants: any[] = [];

    // If user has past order history, recommend matching their top weighted cuisines
    if (topCuisines.length > 0) {
      const cuisineRegexList = topCuisines.slice(0, 3).map((c) => new RegExp(`^${c}$`, "i"));
      recommendedRestaurants = await Restaurant.find({
        isVerified: true,
        cuisines: { $in: cuisineRegexList },
        ...(userCity ? { city: { $regex: userCity, $options: "i" } } : {}),
      })
        .populate("menus")
        .sort({ averageRating: -1 })
        .limit(6);
    }

    // COLD-START FALLBACK: If user is new or no matching restaurants in their city,
    // fall back to top-rated restaurants in user's city
    if (recommendedRestaurants.length === 0 && userCity) {
      recommendedRestaurants = await Restaurant.find({
        isVerified: true,
        city: { $regex: userCity, $options: "i" },
      })
        .populate("menus")
        .sort({ averageRating: -1 })
        .limit(6);
    }

    // GLOBAL COLD-START FALLBACK: If still empty, return top-rated platform restaurants
    if (recommendedRestaurants.length === 0) {
      recommendedRestaurants = await Restaurant.find({ isVerified: true })
        .populate("menus")
        .sort({ averageRating: -1 })
        .limit(6);
    }

    const rawDishes: any[] = [];
    recommendedRestaurants.forEach((rest) => {
      if (Array.isArray(rest.menus)) {
        rest.menus.forEach((m: any) => {
          if (m && m._id) {
            rawDishes.push({
              ...(typeof m.toObject === "function" ? m.toObject() : m),
              restaurant: {
                _id: rest._id,
                restaurantName: rest.restaurantName,
                city: rest.city,
                imageUrl: rest.imageUrl,
              },
            });
          }
        });
      }
    });

    if (rawDishes.length === 0) {
      const allMenus = await Menu.find().limit(8);
      rawDishes.push(...allMenus);
    }

    const uniqueDishes = deduplicateItems(rawDishes).slice(0, 8);

    const result = {
      favoriteCuisines: topCuisines.slice(0, 5),
      restaurants: recommendedRestaurants,
      dishes: uniqueDishes,
    };

    await cache.set(cacheKey, result, 180); // 3 mins cache
    res.status(200).json({
      success: true,
      recommendations: result,
    });
  } catch (error) {
    console.error("getPersonalized error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
