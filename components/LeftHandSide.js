import React from "react";
import { motion } from "framer-motion";
import Btns from "./Btns";
import Tags from "./Tags";
import Links from "./Links";

const LeftHandSide = () => {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full overflow-y-auto p-4 space-y-6 sticky top-16"
    >
      {/* User Suggestions Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-xl rounded-3xl shadow-glass border border-neutral-200/50 dark:border-neutral-700/50 p-6"
      >
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
          <span className="mr-2">👥</span>
          Suggested for you
        </h2>
        <Btns />
      </motion.div>

      {/* Trending Topics Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-xl rounded-3xl shadow-glass border border-neutral-200/50 dark:border-neutral-700/50 p-6"
      >
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
          <span className="mr-2">🔥</span>
          Trending
        </h2>
        <Tags />
      </motion.div>

      {/* Quick Links Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-xl rounded-3xl shadow-glass border border-neutral-200/50 dark:border-neutral-700/50 p-6"
      >
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
          <span className="mr-2">🔗</span>
          Quick Links
        </h2>
        <Links />
      </motion.div>
    </motion.aside>
  );
};

export default LeftHandSide;
