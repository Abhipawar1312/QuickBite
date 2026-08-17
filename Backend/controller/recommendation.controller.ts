import { Request, Response } from "express";
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
 * 1. Frequently Paired Together
 * Computes item synergies based on historical order co-occurrences or restaurant complements.
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

    // Find orders that contain this menu item
    const pairedMenuMap = new Map<string, { count: number; name: string }>();

    if (menuId) {
      const ordersWithItem = await Order.find({
        "cartItems.menuId": menuId,
        status: { $ne: "Cancelled" },
      }).limit(50);

      ordersWithItem.forEach((order) => {
        (order.cartItems || []).forEach((item: any) => {
          if (item.menuId && !excludeList.includes(item.menuId.toString())) {
            const key = item.menuId.toString();
            const prev = pairedMenuMap.get(key) || { count: 0, name: item.name };
            prev.count += 1;
            pairedMenuMap.set(key, prev);
          }
        });
      });
    }

    const topPairedIds = Array.from(pairedMenuMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 4)
      .map(([id]) => id);

    let pairedItems: any[] = [];
    if (topPairedIds.length > 0) {
      pairedItems = await Menu.find({ _id: { $in: topPairedIds } });
    }

    // Complementary dishes from the same restaurant's populated menus
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
 * 2. Trending in your area
 * Identifies top-rated restaurants and unique popular dishes in the user's city or area.
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

    const query: any = {};
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
 * Analyzes the user's past order history, favorite cuisines, and top flavors.
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

    // Fetch user's completed orders
    const pastOrders = await Order.find({
      user: userId,
      status: { $in: ["delivered", "confirmed", "out_for_delivery", "preparing"] },
    })
      .populate({
        path: "restaurant",
        select: "cuisines city restaurantName imageUrl averageRating",
      })
      .sort({ createdAt: -1 })
      .limit(20);

    const favoriteCuisines = new Set<string>();
    const orderedMenuNames = new Set<string>();

    pastOrders.forEach((o) => {
      const rest = o.restaurant as any;
      if (rest?.cuisines) {
        rest.cuisines.forEach((c: string) => favoriteCuisines.add(c.toLowerCase()));
      }
      (o.cartItems || []).forEach((item: any) => {
        if (item.name) orderedMenuNames.add(item.name.toLowerCase());
      });
    });

    const user = await User.findById(userId);
    const userCity = user?.city || "";

    let recommendedRestaurants: any[] = [];
    if (favoriteCuisines.size > 0) {
      const cuisineRegexList = Array.from(favoriteCuisines).map((c) => new RegExp(c, "i"));
      recommendedRestaurants = await Restaurant.find({
        cuisines: { $in: cuisineRegexList },
        ...(userCity ? { city: { $regex: userCity, $options: "i" } } : {}),
      })
        .populate("menus")
        .sort({ averageRating: -1 })
        .limit(6);
    }

    if (recommendedRestaurants.length === 0) {
      recommendedRestaurants = await Restaurant.find(
        userCity ? { city: { $regex: userCity, $options: "i" } } : {}
      )
        .populate("menus")
        .sort({ averageRating: -1 })
        .limit(6);
    }

    if (recommendedRestaurants.length === 0) {
      recommendedRestaurants = await Restaurant.find()
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
      favoriteCuisines: Array.from(favoriteCuisines),
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


