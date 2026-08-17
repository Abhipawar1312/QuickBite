"use client";

import { useEffect, useMemo, useState } from "react";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, RotateCcw, Utensils, Search, X } from "lucide-react";

export type FilterOptionsState = {
  id: string;
  label: string;
  count?: number;
};

const DEFAULT_POPULAR_CUISINES = [
  "Burger",
  "Thali",
  "Biryani",
  "Momos",
  "Chinese",
  "Pizza",
  "North Indian",
  "Fast Food",
];

const FilterPage = () => {
  const {
    setAppliedFilter,
    appliedFilter,
    resetAppliedFilter,
    searchedRestaurant,
    allCuisines,
    fetchAllCuisines,
  } = useRestaurantStore();

  const [filterSearch, setFilterSearch] = useState("");

  // Fetch all global distinct cuisines from database on component mount
  useEffect(() => {
    if (fetchAllCuisines) {
      fetchAllCuisines();
    }
  }, []);

  // Compute live restaurant count per cuisine from currently searched restaurants
  const cuisineCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const restaurants = searchedRestaurant?.data || [];

    restaurants.forEach((restaurant: any) => {
      if (Array.isArray(restaurant.cuisines)) {
        restaurant.cuisines.forEach((c: string) => {
          if (c && typeof c === "string" && c.trim() !== "") {
            const normalized = c.trim();
            const formatted =
              normalized.charAt(0).toUpperCase() + normalized.slice(1);
            counts[formatted] = (counts[formatted] || 0) + 1;
          }
        });
      }
    });

    return counts;
  }, [searchedRestaurant]);

  // Combine database cuisines (Option 2) with active search results and defaults
  const fullCuisineList = useMemo<string[]>(() => {
    const list =
      allCuisines && allCuisines.length > 0
        ? allCuisines
        : DEFAULT_POPULAR_CUISINES;

    // Ensure any currently applied filter or count-bearing cuisine is included
    const set = new Set([...list, ...appliedFilter, ...Object.keys(cuisineCounts)]);
    const combined = Array.from(set);

    // Sort by count (popular in current search first), then alphabetically
    return combined.sort((a, b) => {
      const countA = cuisineCounts[a] || 0;
      const countB = cuisineCounts[b] || 0;
      if (countB !== countA) return countB - countA;
      return a.localeCompare(b);
    });
  }, [allCuisines, appliedFilter, cuisineCounts]);

  // Filter list by in-sidebar search input
  const filterOptions = useMemo<FilterOptionsState[]>(() => {
    const query = filterSearch.trim().toLowerCase();
    const matches = fullCuisineList.filter((label) =>
      label.toLowerCase().includes(query)
    );

    return matches.map((label) => ({
      id: label.toLowerCase().replace(/\s+/g, "-"),
      label,
      count: cuisineCounts[label],
    }));
  }, [fullCuisineList, filterSearch, cuisineCounts]);

  const appliedFilterHandler = (value: string) => {
    setAppliedFilter(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-6 border border-slate-200 dark:border-slate-700 sticky top-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-100 dark:bg-orange-950/50 rounded-xl text-orange-600 dark:text-orange-400 shadow-xs">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              Filter by Cuisine
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {fullCuisineList.length} global cuisines
            </p>
          </div>
        </div>

        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-300 group px-2.5 py-1 h-auto rounded-lg"
            onClick={resetAppliedFilter}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1 group-hover:rotate-180 transition-transform duration-300" />
            Reset
          </Button>
        </motion.div>
      </div>

      {/* Mini Search Input for Large Cuisine Catalogs */}
      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          type="text"
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
          placeholder="Search cuisines..."
          className="pl-8 pr-7 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:border-orange-500 h-8"
        />
        {filterSearch && (
          <button
            onClick={() => setFilterSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Options List */}
      <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
        {filterOptions.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            No cuisines match "{filterSearch}"
          </div>
        ) : (
          <AnimatePresence>
            {filterOptions.map((option, index) => {
              const isChecked = appliedFilter.includes(option.label);

              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.25) }}
                  className={`flex items-center justify-between p-2 rounded-xl transition-all duration-200 group cursor-pointer border ${
                    isChecked
                      ? "bg-orange-50/80 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/80 shadow-xs"
                      : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  }`}
                  onClick={() => appliedFilterHandler(option.label)}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <Checkbox
                      id={option.id}
                      checked={isChecked}
                      className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 rounded-md"
                    />
                    <Label
                      htmlFor={option.id}
                      className={`text-xs font-medium transition-colors duration-200 cursor-pointer truncate ${
                        isChecked
                          ? "text-orange-950 dark:text-orange-200 font-bold"
                          : "text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white"
                      }`}
                    >
                      {option.label}
                    </Label>
                  </div>

                  {/* Count Badge or Active Indicator */}
                  {option.count !== undefined && option.count > 0 ? (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isChecked
                          ? "bg-orange-500 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-600"
                      }`}
                    >
                      {option.count}
                    </span>
                  ) : isChecked ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-1.5 h-1.5 bg-orange-500 rounded-full shrink-0"
                    />
                  ) : null}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Applied Filters Footer Banner */}
      {appliedFilter.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 rounded-xl border border-orange-200 dark:border-orange-800/80 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Utensils className="w-3.5 h-3.5 text-orange-500" />
            <p className="text-xs text-orange-800 dark:text-orange-300 font-bold">
              {appliedFilter.length} cuisine{appliedFilter.length > 1 ? "s" : ""}{" "}
              selected
            </p>
          </div>
          <button
            onClick={resetAppliedFilter}
            className="text-[11px] font-extrabold text-orange-600 dark:text-orange-400 hover:underline"
          >
            Clear all
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default FilterPage;


