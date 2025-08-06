"use client";

import type React from "react";

import { useState } from "react";
import { Input } from "./ui/input";
import { Search, Sparkles, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import HeroImage from "../assets/foodImage.png";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const HeroSection = () => {
  const [searchText, setSearchText] = useState<string>("");
  const navigate = useNavigate();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchText.trim() !== "") {
      navigate(`/search/${searchText}`);
    }
  };

  const handleSearch = () => {
    if (searchText.trim()) {
      navigate(`/search/${searchText}`);
    }
  };

  return (
    <div className="relative min-h-[80vh] sm:min-h-[85vh] md:min-h-[90vh] bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-10 overflow-hidden">
      {/* Mobile-Optimized Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -50, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          className="absolute top-10 left-10 sm:top-20 sm:left-20 w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-orange-200/20 dark:bg-orange-800/20 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            x: [0, -75, 0],
            y: [0, 50, 0],
            rotate: [0, -180, -360],
          }}
          transition={{
            duration: 25,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          className="absolute bottom-10 right-10 sm:bottom-20 sm:right-20 w-20 h-20 sm:w-28 sm:h-28 md:w-40 md:h-40 bg-blue-200/20 dark:bg-blue-800/20 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-gradient-to-r from-orange-300/10 to-pink-300/10 dark:from-orange-800/10 dark:to-pink-800/10 rounded-full blur-3xl"
        />
      </div>

      {/* Mobile-Optimized Background Image */}
      <div
        className="absolute inset-0 bg-no-repeat bg-center bg-contain opacity-5 md:opacity-10 pointer-events-none"
        style={{ backgroundImage: `url(${HeroImage})` }}
      />

      {/* Mobile-Optimized Floating Icons */}
      <motion.div
        animate={{
          y: [0, -15, 0],
          rotate: [0, 10, 0],
        }}
        transition={{
          duration: 3,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        className="absolute top-16 right-16 sm:top-24 sm:right-24 md:top-32 md:right-32 hidden sm:block"
      >
        <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400 opacity-60" />
      </motion.div>

      <motion.div
        animate={{
          y: [0, 10, 0],
          x: [0, 8, 0],
        }}
        transition={{
          duration: 4,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute bottom-16 left-16 sm:bottom-24 sm:left-24 md:bottom-32 md:left-32 hidden sm:block"
      >
        <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 opacity-60" />
      </motion.div>

      {/* Mobile-Optimized Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 text-center max-w-4xl w-full"
      >
        {/* Mobile-Optimized Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4 sm:mb-6 leading-tight"
        >
          Discover{" "}
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 relative inline-block"
          >
            Tasty
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                delay: 1,
              }}
              className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2"
            >
              <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-orange-500" />
            </motion.div>
          </motion.span>{" "}
          <br className="sm:hidden" />
          Food Near You
        </motion.h1>

        {/* Mobile-Optimized Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed px-4"
        >
          Craving something delicious? Search restaurants by name, city or
          country and find your next bite!
        </motion.p>

        {/* Mobile-Optimized Search Box */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-8 sm:mt-10 md:mt-12 w-full max-w-2xl mx-auto px-4"
        >
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl p-4 sm:p-6 rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
              <div className="relative w-full group">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors duration-300 z-10 w-4 h-4 sm:w-5 sm:h-5" />
                <Input
                  type="text"
                  value={searchText}
                  placeholder="Type a restaurant, city or country..."
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 shadow-inner focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 text-base sm:text-lg"
                />
                <motion.div
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/20 to-orange-600/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"
                  layoutId="searchGlow"
                />
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleSearch}
                  disabled={searchText.trim() === ""}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  Search
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Mobile-Optimized Popular Searches */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-6 sm:mt-8 px-4"
        >
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-3">
            Popular searches:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              "Chole Bhature",
              "Butter Chicken",
              "Chole Kulche",
              "Momos",
              "Tandoori Chicken",
            ].map((term, index) => (
              <motion.button
                key={term}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSearchText(term);
                  navigate(`/search/${term}`);
                }}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs sm:text-sm font-medium hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600"
              >
                {term}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HeroSection;
