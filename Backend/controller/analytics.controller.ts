import { Request, Response } from "express";
import { Order } from "../models/order.model";
import { Restaurant } from "../models/restaurant.model";

/**
 * Get comprehensive analytics for the merchant's restaurant
 */
export const getMerchantAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.id;
    const restaurant = await Restaurant.findOne({ user: userId });
    if (!restaurant) {
      res.status(404).json({ success: false, message: "Restaurant not found" });
      return;
    }

    // Fetch all completed/delivered or confirmed orders (excluding pending)
    const orders = await Order.find({
      restaurant: restaurant._id,
      status: { $ne: "pending" },
    }).populate("user", "fullname email").sort({ createdAt: -1 });

    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status?.toLowerCase() === "delivered");
    const cancelledOrders = orders.filter((o) => o.status?.toLowerCase() === "cancelled");

    // Total and Net Revenue
    const totalRevenue = orders
      .filter((o) => o.status?.toLowerCase() !== "cancelled")
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / (totalOrders - cancelledOrders.length || 1)) : 0;

    // 7-day revenue trend
    const last7Days: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayOrders = orders.filter((o) => {
        const orderDate = new Date(o.createdAt).toISOString().split("T")[0];
        return orderDate === dateStr && o.status?.toLowerCase() !== "cancelled";
      });
      const revenue = dayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      last7Days.push({
        date: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        revenue,
        orders: dayOrders.length,
      });
    }

    // 24-hour peak order hours heatmap
    const hourlyDistribution: { hour: number; label: string; count: number }[] = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      label: `${hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}`,
      count: 0,
    }));

    orders.forEach((o) => {
      const hour = new Date(o.createdAt).getHours();
      if (hourlyDistribution[hour]) {
        hourlyDistribution[hour].count += 1;
      }
    });

    // Top 5 Best-Selling Menu Items
    const itemMap = new Map<string, { name: string; quantity: number; revenue: number; image?: string }>();
    orders.forEach((o) => {
      if (o.status?.toLowerCase() !== "cancelled") {
        (o.cartItems || []).forEach((item: any) => {
          const key = item.name || item.menuId;
          const prev = itemMap.get(key) || { name: item.name, quantity: 0, revenue: 0, image: item.image };
          prev.quantity += item.quantity || 1;
          prev.revenue += (item.price || 0) * (item.quantity || 1);
          itemMap.set(key, prev);
        });
      }
    });

    const topSellingItems = Array.from(itemMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Customer retention stats
    const customerOrderCount = new Map<string, number>();
    orders.forEach((o) => {
      const cId = (o.user as any)?._id?.toString() || (o.deliveryDetails?.contact || "guest");
      customerOrderCount.set(cId, (customerOrderCount.get(cId) || 0) + 1);
    });

    const uniqueCustomers = customerOrderCount.size;
    const repeatCustomers = Array.from(customerOrderCount.values()).filter((cnt) => cnt > 1).length;
    const retentionRate = uniqueCustomers > 0 ? Math.round((repeatCustomers / uniqueCustomers) * 100) : 0;

    res.status(200).json({
      success: true,
      analytics: {
        totalRevenue,
        totalOrders,
        completedOrdersCount: completedOrders.length,
        cancelledOrdersCount: cancelledOrders.length,
        averageOrderValue,
        last7Days,
        hourlyDistribution,
        topSellingItems,
        uniqueCustomers,
        repeatCustomers,
        retentionRate,
      },
    });
  } catch (error) {
    console.error("getMerchantAnalytics error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Export merchant orders history as a downloadable CSV report
 */
export const exportMerchantAnalyticsCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.id;
    const restaurant = await Restaurant.findOne({ user: userId });
    if (!restaurant) {
      res.status(404).json({ success: false, message: "Restaurant not found" });
      return;
    }

    const orders = await Order.find({
      restaurant: restaurant._id,
      status: { $ne: "pending" },
    }).populate("user", "fullname email contact").sort({ createdAt: -1 });

    const csvHeaders = [
      "Order ID",
      "Date & Time",
      "Customer Name",
      "Contact",
      "Delivery Address",
      "City",
      "Items Ordered",
      "Total Amount (INR)",
      "Delivery Fee",
      "Tip Amount",
      "Discount",
      "Status",
    ];

    const csvRows = orders.map((o) => {
      const itemsSummary = (o.cartItems || [])
        .map((i: any) => `${i.name} (x${i.quantity})`)
        .join("; ");
      const safeCustomer = o.deliveryDetails?.name || (o.user as any)?.fullname || "Customer";
      const safeContact = o.deliveryDetails?.contact || (o.user as any)?.contact || "N/A";
      const safeAddress = `"${(o.deliveryDetails?.address || "N/A").replace(/"/g, '""')}"`;
      const dateFormatted = new Date(o.createdAt).toLocaleString("en-IN");

      return [
        (o as any)._id?.toString() || "",
        `"${dateFormatted}"`,
        `"${safeCustomer}"`,
        `"${safeContact}"`,

        safeAddress,
        `"${o.deliveryDetails?.city || restaurant.city}"`,
        `"${itemsSummary.replace(/"/g, '""')}"`,
        o.totalAmount || 0,
        o.deliveryFee || 0,
        o.tipAmount || 0,
        o.discountAmount || 0,
        o.status || "confirmed",
      ].join(",");
    });

    const csvContent = [csvHeaders.join(","), ...csvRows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="QuickBite_Report_${restaurant.restaurantName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv"`
    );
    res.status(200).send(csvContent);
  } catch (error) {
    console.error("exportMerchantAnalyticsCSV error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
