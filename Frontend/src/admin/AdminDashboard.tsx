import React, { useEffect, useState } from "react";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { useRiderStore } from "@/store/useRiderStore";
import { useCouponStore } from "@/store/useCouponStore";
import { Coupon } from "@/types/couponType";
import { motion, AnimatePresence } from "framer-motion";
import {
  Utensils,
  Bike,
  CheckCircle,
  Trash2,
  User,
  Phone,
  MapPin,
  Shield,
  Loader2,
  Tag,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const AdminDashboard: React.FC = () => {
  const {
    loading: restaurantLoading,
    getAllRestaurantsAdmin,
    verifyRestaurantAdmin,
    deleteRestaurantAdmin,
  } = useRestaurantStore();

  const {
    loading: riderLoading,
    ridersList,
    getAllRidersAdmin,
    verifyRiderAdmin,
    deleteRiderAdmin,
  } = useRiderStore();

  const {
    allCoupons,
    getAllCouponsAdmin,
    createCouponAdmin,
    toggleCouponAdmin,
    deleteCouponAdmin,
  } = useCouponStore();

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("restaurants");

  // Coupon Creation State
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    description: "",
    discountType: "percentage" as "percentage" | "flat",
    discountValue: 20,
    minOrderValue: 199,
    maxDiscount: 100,
  });
  const [couponSaving, setCouponSaving] = useState(false);

  const fetchRestaurants = async () => {
    const list = await getAllRestaurantsAdmin();
    setRestaurants(list);
  };

  useEffect(() => {
    fetchRestaurants();
    getAllRidersAdmin();
    getAllCouponsAdmin();
  }, [activeTab]);

  const handleVerifyRestaurant = async (id: string) => {
    await verifyRestaurantAdmin(id);
    fetchRestaurants();
  };

  const handleDeleteRestaurant = async (id: string) => {
    if (confirm("Are you sure you want to remove this restaurant? This action is permanent.")) {
      await deleteRestaurantAdmin(id);
      fetchRestaurants();
    }
  };

  const handleVerifyRider = async (id: string) => {
    await verifyRiderAdmin(id);
  };

  const handleDeleteRider = async (id: string) => {
    if (confirm("Are you sure you want to remove this rider? This action is permanent.")) {
      await deleteRiderAdmin(id);
    }
  };

  const handleCreateCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }
    setCouponSaving(true);
    await createCouponAdmin({
      ...newCoupon,
      code: newCoupon.code.toUpperCase().trim(),
    });
    setCouponSaving(false);
    setCouponModalOpen(false);
    setNewCoupon({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: 20,
      minOrderValue: 199,
      maxDiscount: 100,
    });
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-700 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <Shield className="w-8 h-8 text-orange-500" />
              QuickBite Administration Panel
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Manage platform approvals, restaurant verifications, rider compliance, and promotional discounts.
            </p>
          </div>
        </div>

        <Tabs defaultValue="restaurants" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-200 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto mb-6 grid grid-cols-3 sm:inline-flex">
            <TabsTrigger
              value="restaurants"
              className="rounded-lg text-sm font-semibold flex items-center justify-center gap-2 py-2 px-6"
            >
              <Utensils className="w-4 h-4" />
              Restaurants ({restaurants.length})
            </TabsTrigger>
            <TabsTrigger
              value="riders"
              className="rounded-lg text-sm font-semibold flex items-center justify-center gap-2 py-2 px-6"
            >
              <Bike className="w-4 h-4" />
              Riders ({ridersList.length})
            </TabsTrigger>
            <TabsTrigger
              value="coupons"
              className="rounded-lg text-sm font-semibold flex items-center justify-center gap-2 py-2 px-6"
            >
              <Tag className="w-4 h-4" />
              Coupons ({allCoupons.length})
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="restaurants" className="m-0 space-y-6">
              {restaurantLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
              ) : restaurants.length === 0 ? (
                <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 rounded-2xl p-12 text-center">
                  <Utensils className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-600 mb-4" />
                  <CardTitle className="text-xl font-bold mb-2 text-slate-700 dark:text-slate-300">
                    No Restaurants Registered
                  </CardTitle>
                  <CardDescription>
                    There are currently no restaurants pending or active in the database.
                  </CardDescription>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {restaurants.map((restaurant) => (
                    <motion.div
                      key={restaurant._id}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                    >
                      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden flex flex-col h-full border border-slate-100 dark:border-slate-700/50">
                        <div className="relative h-48 bg-slate-100 dark:bg-slate-900">
                          <img
                            src={restaurant.imageUrl || "/placeholder.svg"}
                            alt={restaurant.restaurantName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-4 right-4">
                            <Badge
                              className={`text-xs px-3 py-1 rounded-full font-semibold border-0 shadow-md ${
                                restaurant.isVerified
                                  ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400"
                                  : "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                              }`}
                            >
                              {restaurant.isVerified ? "Verified" : "Pending Approval"}
                            </Badge>
                          </div>
                        </div>
                        <CardHeader className="p-5 pb-2">
                          <CardTitle className="text-xl font-bold text-slate-900 dark:text-white truncate">
                            {restaurant.restaurantName}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1.5 text-xs text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            {restaurant.city}, {restaurant.country}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-between space-y-4">
                          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3.5 space-y-2 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-semibold text-slate-800 dark:text-slate-200">Owner:</span>
                              <span className="truncate">{restaurant.user?.fullname || "Unknown"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-semibold text-slate-800 dark:text-slate-200">Phone:</span>
                              <span>{restaurant.contactNumber || "N/A"}</span>
                            </div>
                          </div>
                          <div className="flex gap-3 pt-2">
                            {!restaurant.isVerified && (
                              <Button
                                onClick={() => handleVerifyRestaurant(restaurant._id)}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm rounded-xl py-2 shadow-md hover:shadow-lg transition-all duration-300"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              onClick={() => handleDeleteRestaurant(restaurant._id)}
                              className="bg-red-500 hover:bg-red-600 text-white font-semibold text-sm rounded-xl py-2 flex items-center justify-center shrink-0 px-3 shadow-md hover:shadow-lg transition-all duration-300"
                              title="Delete Restaurant"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="riders" className="m-0 space-y-6">
              {riderLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
              ) : ridersList.length === 0 ? (
                <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 rounded-2xl p-12 text-center">
                  <Bike className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-600 mb-4" />
                  <CardTitle className="text-xl font-bold mb-2 text-slate-700 dark:text-slate-300">
                    No Riders Registered
                  </CardTitle>
                  <CardDescription>
                    There are currently no delivery partners awaiting or registered in the database.
                  </CardDescription>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ridersList.map((rider) => (
                    <motion.div
                      key={rider._id}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                    >
                      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden flex flex-col h-full border border-slate-100 dark:border-slate-700/50">
                        <CardHeader className="p-5 pb-2 bg-gradient-to-r from-orange-500/10 to-orange-600/5 dark:from-slate-800/80 dark:to-slate-800/40 border-b border-slate-100 dark:border-slate-700">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <CardTitle className="text-xl font-bold text-slate-900 dark:text-white truncate">
                                {rider.user?.fullname || "Unknown"}
                              </CardTitle>
                              <CardDescription className="text-xs mt-1 text-slate-500 flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-orange-500" />
                                {rider.user?.email || "N/A"}
                              </CardDescription>
                            </div>
                            <Badge
                              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border-0 shadow ${
                                rider.isVerified
                                  ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400"
                                  : "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                              }`}
                            >
                              {rider.isVerified ? "Verified" : "Pending"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3.5 space-y-2 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 mt-2">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">Vehicle:</span>
                              <span className="text-slate-900 dark:text-white font-medium">{rider.vehicleName}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">License Number:</span>
                              <span className="text-slate-900 dark:text-white font-mono font-medium">{rider.licenseNumber}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">Contact:</span>
                              <span className="text-slate-900 dark:text-white">{rider.contact || rider.user?.contact || "N/A"}</span>
                            </div>
                          </div>
                          <div className="flex gap-3 pt-2">
                            {!rider.isVerified && (
                              <Button
                                onClick={() => handleVerifyRider(rider._id)}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm rounded-xl py-2 shadow-md hover:shadow-lg transition-all duration-300"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Verify Rider
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              onClick={() => handleDeleteRider(rider._id)}
                              className="bg-red-500 hover:bg-red-600 text-white font-semibold text-sm rounded-xl py-2 flex items-center justify-center shrink-0 px-3 shadow-md hover:shadow-lg transition-all duration-300"
                              title="Delete Rider Profile"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Coupons Management Tab */}
            <TabsContent value="coupons" className="m-0 space-y-6">
              <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Promotional Discount Codes
                  </h3>
                  <p className="text-xs text-slate-500">
                    Create promo coupons to boost order volumes and customer retention
                  </p>
                </div>
                <Button
                  onClick={() => setCouponModalOpen(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  Create Coupon
                </Button>
              </div>

              {allCoupons.length === 0 ? (
                <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 rounded-2xl p-12 text-center">
                  <Tag className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-600 mb-4" />
                  <CardTitle className="text-xl font-bold mb-2 text-slate-700 dark:text-slate-300">
                    No Active Coupons
                  </CardTitle>
                  <CardDescription>
                    Create promotional offers like QUICK50 or WELCOME100 for your users.
                  </CardDescription>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allCoupons.map((coupon: Coupon) => (
                    <motion.div
                      key={coupon._id}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                    >
                      <Card className="border-0 shadow-lg bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 font-extrabold text-sm px-2.5 py-1">
                              {coupon.code}
                            </Badge>
                            <h4 className="font-bold text-slate-900 dark:text-white text-base mt-2">
                              {coupon.discountType === "percentage"
                                ? `${coupon.discountValue}% OFF`
                                : `₹${coupon.discountValue} FLAT OFF`}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {coupon.description || `Min. order ₹${coupon.minOrderValue}`}
                            </p>
                          </div>
                          <Badge
                            className={`text-[10px] ${
                              coupon.isActive
                                ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                                : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                            }`}
                          >
                            {coupon.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                          <div className="flex justify-between">
                            <span>Min Order:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">₹{coupon.minOrderValue}</span>
                          </div>
                          {coupon.maxDiscount && (
                            <div className="flex justify-between">
                              <span>Max Discount Cap:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">₹{coupon.maxDiscount}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                              Active:
                            </span>
                            <Switch
                              checked={coupon.isActive}
                              onCheckedChange={() => toggleCouponAdmin(coupon._id)}
                              className="data-[state=checked]:bg-green-500"
                            />
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteCouponAdmin(coupon._id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </AnimatePresence>
        </Tabs>

        {/* Create Coupon Modal Dialog */}
        <Dialog open={couponModalOpen} onOpenChange={setCouponModalOpen}>
          <DialogContent className="max-w-md bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-orange-500" />
                Create New Promo Code
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Set promotional discount limits and eligibility
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateCouponSubmit} className="space-y-3.5 pt-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Coupon Code</Label>
                <Input
                  type="text"
                  placeholder="e.g. WELCOME50, FESTIVE20"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="text-xs rounded-xl uppercase font-bold tracking-wider"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Description</Label>
                <Input
                  type="text"
                  placeholder="e.g. 50% OFF on first order above ₹199"
                  value={newCoupon.description}
                  onChange={(e) => setNewCoupon((prev) => ({ ...prev, description: e.target.value }))}
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Discount Type</Label>
                  <select
                    value={newCoupon.discountType}
                    onChange={(e) => setNewCoupon((prev) => ({ ...prev, discountType: e.target.value as any }))}
                    className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs px-3 font-medium"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Value {newCoupon.discountType === "percentage" ? "(%)" : "(₹)"}
                  </Label>
                  <Input
                    type="number"
                    value={newCoupon.discountValue}
                    onChange={(e) => setNewCoupon((prev) => ({ ...prev, discountValue: Number(e.target.value) }))}
                    className="text-xs rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Min Order (₹)</Label>
                  <Input
                    type="number"
                    value={newCoupon.minOrderValue}
                    onChange={(e) => setNewCoupon((prev) => ({ ...prev, minOrderValue: Number(e.target.value) }))}
                    className="text-xs rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Max Discount Cap (₹)</Label>
                  <Input
                    type="number"
                    value={newCoupon.maxDiscount}
                    onChange={(e) => setNewCoupon((prev) => ({ ...prev, maxDiscount: Number(e.target.value) }))}
                    className="text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCouponModalOpen(false)}
                  className="flex-1 rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={couponSaving}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs"
                >
                  {couponSaving ? "Creating..." : "Save Coupon"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  );
};
