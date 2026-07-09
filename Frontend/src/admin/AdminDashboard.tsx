import React, { useEffect, useState } from "react";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { useRiderStore } from "@/store/useRiderStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Utensils,
  Bike,
  CheckCircle,
  XCircle,
  Trash2,
  User,
  Phone,
  MapPin,
  Shield,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("restaurants");

  const fetchRestaurants = async () => {
    const list = await getAllRestaurantsAdmin();
    setRestaurants(list);
  };

  useEffect(() => {
    fetchRestaurants();
    getAllRidersAdmin();
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
              Manage platform approvals, restaurant verifications, and delivery rider compliance.
            </p>
          </div>
        </div>

        <Tabs defaultValue="restaurants" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-200 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto mb-6 grid grid-cols-2 sm:inline-flex">
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
          </AnimatePresence>
        </Tabs>
      </div>
    </motion.div>
  );
};
