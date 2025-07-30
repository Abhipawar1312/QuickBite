"use client";

import { useRestaurantStore } from "@/store/useRestaurantStore";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { motion } from "framer-motion";
import { Filter, RotateCcw } from "lucide-react";

export type FilterOptionsState = {
  id: string;
  label: string;
};

const filterOptions: FilterOptionsState[] = [
  { id: "burger", label: "Burger" },
  { id: "thali", label: "Thali" },
  { id: "biryani", label: "Biryani" },
  { id: "momos", label: "Momos" },
];

const FilterPage = () => {
  const { setAppliedFilter, appliedFilter, resetAppliedFilter } =
    useRestaurantStore();

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Filter className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Filter by Cuisine
          </h2>
        </div>
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="sm"
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-300 group"
            onClick={resetAppliedFilter}
          >
            <RotateCcw className="w-4 h-4 mr-1 group-hover:rotate-180 transition-transform duration-300" />
            Reset
          </Button>
        </motion.div>
      </div>

      {/* Filter Options */}
      <div className="space-y-4">
        {filterOptions.map((option, index) => (
          <motion.div
            key={option.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200 group cursor-pointer"
            onClick={() => appliedFilterHandler(option.label)}
          >
            <Checkbox
              id={option.id}
              checked={appliedFilter.includes(option.label)}
              className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
            />
            <Label
              htmlFor={option.id}
              className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-200 cursor-pointer flex-1"
            >
              {option.label}
            </Label>
            {appliedFilter.includes(option.label) && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2 h-2 bg-orange-500 rounded-full"
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Applied Filters Count */}
      {appliedFilter.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800"
        >
          <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">
            {appliedFilter.length} filter{appliedFilter.length > 1 ? "s" : ""}{" "}
            applied
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default FilterPage;
