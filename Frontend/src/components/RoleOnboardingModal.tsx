import React, { useState } from "react";
import { useUserStore } from "@/store/useUserStore";
import { motion, AnimatePresence } from "framer-motion";
import { User, UtensilsCrossed, Bike, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import Icon from "@/assets/Icon.png";

export const RoleOnboardingModal: React.FC = () => {
  const { user, selectRole, loading } = useUserStore();
  const [selectedRole, setSelectedRole] = useState<"user" | "restaurant_owner" | "rider">("user");

  // Show only if user is logged in but hasn't selected their role yet
  if (!user || user.isRoleSelected === true) {
    return null;
  }

  const handleConfirm = async () => {
    await selectRole(selectedRole);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
        className="max-w-md w-full bg-white dark:bg-slate-800 shadow-2xl rounded-3xl p-8 border border-white/20 dark:border-slate-700 space-y-8 relative overflow-hidden"
      >
        {/* Glow Decor */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo and Greeting */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <motion.img
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              src={Icon}
              alt="QuickBite Logo"
              className="h-10 w-10 object-contain drop-shadow-lg animate-pulse"
            />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              QuickBite Onboarding
            </h1>
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Welcome, {user.fullname.split(" ")[0]}!
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              To customize your food ordering experience, please select your primary account role below.
            </p>
          </div>
        </div>

        {/* Selection Cards Grid */}
        <div className="space-y-4">
          <Label className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider block">
            Choose Your Platform Role
          </Label>
          <div className="flex flex-col gap-3">
            {[
              {
                id: "user",
                label: "Hungry Customer",
                description: "Browse menu items, place food orders, and track deliveries.",
                icon: User,
                color: "orange",
              },
              {
                id: "restaurant_owner",
                label: "Restaurant Owner",
                description: "Setup your restaurant menu, manage availability, and fulfill orders.",
                icon: UtensilsCrossed,
                color: "orange",
              },
              {
                id: "rider",
                label: "Delivery Partner / Rider",
                description: "Deliver orders inside active hotspots and manage fleet checkpoints.",
                icon: Bike,
                color: "orange",
              },
            ].map((roleOption) => {
              const IconComp = roleOption.icon;
              const isSelected = selectedRole === roleOption.id;

              return (
                <motion.div
                  key={roleOption.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedRole(roleOption.id as any)}
                  className={`cursor-pointer border-2 rounded-2xl p-4 flex items-start gap-4 transition-all duration-300 ${
                    isSelected
                      ? "border-orange-500 bg-orange-500/10 shadow-lg dark:bg-orange-950/20"
                      : "border-slate-200 dark:border-slate-700 bg-transparent hover:border-orange-200 dark:hover:border-slate-600"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-orange-500 text-white"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4
                      className={`text-sm font-extrabold ${
                        isSelected ? "text-orange-600 dark:text-orange-400" : "text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {roleOption.label}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {roleOption.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm shrink-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Confirm & Continue
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};
