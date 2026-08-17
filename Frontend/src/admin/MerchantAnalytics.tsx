import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Clock,
  Download,
  Flame,
  ArrowUpRight,
  Loader2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { API_END_POINTS } from "@/config/api";
import { toast } from "sonner";

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  completedOrdersCount: number;
  cancelledOrdersCount: number;
  averageOrderValue: number;
  last7Days: { date: string; revenue: number; orders: number }[];
  hourlyDistribution: { hour: number; label: string; count: number }[];
  topSellingItems: { name: string; quantity: number; revenue: number; image?: string }[];
  uniqueCustomers: number;
  repeatCustomers: number;
  retentionRate: number;
}

export const MerchantAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_END_POINTS.ANALYTICS}`);
      if (response.data.success) {
        setAnalytics(response.data.analytics);
      }
    } catch (error) {
      console.error("fetchAnalytics error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const response = await axios.get(`${API_END_POINTS.ANALYTICS}/export`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `QuickBite_Orders_Report_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("CSV Report downloaded successfully!");
    } catch (error) {
      console.error("handleExportCSV error:", error);
      toast.error("Failed to export CSV report");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
        <div className="max-w-6xl mx-auto p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md">
          <p className="text-sm font-semibold text-slate-500">No analytics data available yet.</p>
        </div>
      </div>
    );
  }

  const maxDailyRevenue = Math.max(...analytics.last7Days.map((d) => d.revenue), 100);
  const maxHourlyCount = Math.max(...analytics.hourlyDistribution.map((h) => h.count), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header & Export Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-orange-500" />
              Merchant Sales & Revenue Analytics
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time business performance, revenue trends, peak order hours, and customer insights
            </p>
          </div>

          <Button
            onClick={handleExportCSV}
            disabled={exporting}
            className="h-10 px-5 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs shadow-lg flex items-center gap-2"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export CSV Report
          </Button>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-3xl border-0 shadow-md bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Total Revenue
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                ₹{analytics.totalRevenue.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                From {analytics.totalOrders} total orders
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-blue-950/20 border border-blue-200 dark:border-blue-900/40">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  Orders Completed
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-sm">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                {analytics.completedOrdersCount}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                {analytics.cancelledOrdersCount} cancelled orders
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 shadow-md bg-gradient-to-br from-orange-50 to-amber-50 dark:from-slate-800 dark:to-orange-950/20 border border-orange-200 dark:border-orange-900/40">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400">
                  Avg. Order Value (AOV)
                </span>
                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-sm">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                ₹{analytics.averageOrderValue}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-orange-600 dark:text-orange-400 font-semibold">
                Basket size per order
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 shadow-md bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-purple-950/20 border border-purple-200 dark:border-purple-900/40">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                  Customer Retention
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-sm">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                {analytics.retentionRate}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                {analytics.repeatCustomers} repeat of {analytics.uniqueCustomers} customers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 7-Day Revenue Trend & Peak Hours Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 7-Day Revenue Bars */}
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md bg-white dark:bg-slate-800 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-orange-500" />
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">7-Day Revenue Trend</h3>
                <p className="text-xs text-slate-500">Daily sales breakdown over the last week</p>
              </div>
            </div>

            <div className="space-y-3">
              {analytics.last7Days.map((day, idx) => {
                const pct = Math.round((day.revenue / maxDailyRevenue) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-600 dark:text-slate-300">{day.date}</span>
                      <span className="text-orange-600 dark:text-orange-400">₹{day.revenue.toLocaleString()} ({day.orders} orders)</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(pct, 4)}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.08 }}
                        className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 24-Hour Peak Ordering Hours Distribution */}
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md bg-white dark:bg-slate-800 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Peak Ordering Hours</h3>
                <p className="text-xs text-slate-500">Hourly order volume distribution</p>
              </div>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
              {analytics.hourlyDistribution.map((slot) => {
                const intensity = slot.count / maxHourlyCount;
                return (
                  <div
                    key={slot.hour}
                    className={`p-2.5 rounded-2xl text-center border transition-all ${slot.count > 0
                      ? "bg-orange-500/10 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800"
                      : "bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 opacity-60"
                      }`}
                  >
                    <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {slot.label}
                    </span>
                    <span
                      className={`block text-xs font-black mt-1 ${slot.count > 0 ? "text-orange-600 dark:text-orange-400" : "text-slate-400"
                        }`}
                    >
                      {slot.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Top 5 Best-Selling Dishes */}
        <Card className="rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md bg-white dark:bg-slate-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Top 5 Best-Selling Menu Items</h3>
              <p className="text-xs text-slate-500">Dishes with highest sales volume and customer demand</p>
            </div>
          </div>

          {analytics.topSellingItems.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No sales data yet for menu items.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {analytics.topSellingItems.map((item, idx) => (
                <div key={idx} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 font-black text-xs flex items-center justify-center">
                      #{idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{item.name}</h4>
                      <p className="text-[11px] text-slate-500">{item.quantity} orders sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-xs text-emerald-600 dark:text-emerald-400">
                      ₹{item.revenue.toLocaleString()}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-semibold">Revenue</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </motion.div>
  );
};


