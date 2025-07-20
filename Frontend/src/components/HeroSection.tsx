import { useState } from "react";
import { Input } from "./ui/input";
import { Search } from "lucide-react";
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
    <div className="relative min-h-[90vh] bg-white dark:bg-[#121212] flex flex-col items-center justify-center px-6 py-10 overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-no-repeat bg-center bg-contain opacity-10 md:opacity-20 pointer-events-none"
        style={{ backgroundImage: `url(${HeroImage})` }}
      />

      {/* Foreground Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="z-10 text-center max-w-2xl"
      >
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Discover{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600">
            Tasty
          </span>{" "}
          Food Near You
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Craving something delicious? Search restaurants by name, city or
          country and find your next bite!
        </p>

        {/* Search Box */}
        <div className="mt-10 w-full max-w-2xl mx-auto bg-white/30 dark:bg-black/30 backdrop-blur-md p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              value={searchText}
              placeholder="Type a restaurant, city or country..."
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-4 py-3 rounded-md bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 shadow-inner focus:ring-2 focus:ring-sky-500 transition"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={searchText.trim() === ""}
            className="w-full sm:w-auto px-6 py-3 rounded-md bg-sky-500 hover:bg-sky-600 text-white font-medium transition"
          >
            Search
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default HeroSection;
