"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-r from-slate-900 to-slate-800 text-center py-12 px-4 border-t border-slate-700"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-slate-300">Made with</span>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{
              duration: 1,
              repeat: Number.POSITIVE_INFINITY,
              repeatDelay: 2,
            }}
          >
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
          </motion.div>
          <span className="text-slate-300">for food lovers</span>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          &copy; 2025 QuickBite. All rights reserved.
        </p>
        <div className="flex justify-center gap-6 text-xs text-slate-500">
          <motion.a
            href="#"
            whileHover={{ scale: 1.05, color: "#f97316" }}
            className="hover:text-orange-500 transition-colors duration-300"
          >
            Privacy Policy
          </motion.a>
          <motion.a
            href="#"
            whileHover={{ scale: 1.05, color: "#f97316" }}
            className="hover:text-orange-500 transition-colors duration-300"
          >
            Terms of Service
          </motion.a>
          <motion.a
            href="#"
            whileHover={{ scale: 1.05, color: "#f97316" }}
            className="hover:text-orange-500 transition-colors duration-300"
          >
            Contact Us
          </motion.a>
        </div>
      </motion.div>
    </motion.footer>
  );
};

export default Footer;
