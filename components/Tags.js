import React, { useState } from "react";
import { motion } from "framer-motion";
import { topics } from "../utils/constants";

const Tags = () => {
  const [selectedTopic, setSelectedTopic] = useState(null);

  const handleTopicClick = (topicName) => {
    setSelectedTopic(selectedTopic === topicName ? null : topicName);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {topics?.slice(0, 8).map((item, index) => {
          const isSelected = selectedTopic === item.name;
          
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleTopicClick(item.name)}
              className={`relative p-4 rounded-2xl cursor-pointer transition-all duration-300 group overflow-hidden ${
                isSelected
                  ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg'
                  : 'bg-white/70 dark:bg-neutral-800/70 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50 hover:bg-white/90 dark:hover:bg-neutral-800/90 hover:shadow-md'
              }`}
            >
              {/* Background gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${
                isSelected ? 'from-white to-transparent' : 'from-primary-500 to-primary-600'
              }`} />
              
              <div className="relative z-10 flex flex-col items-center text-center space-y-2">
                <div className={`text-2xl transition-transform duration-300 group-hover:scale-110 ${
                  isSelected ? 'filter brightness-110' : ''
                }`}>
                  {item.icon}
                </div>
                <span className={`font-medium text-xs leading-tight transition-colors duration-300 ${
                  isSelected ? 'text-white' : 'text-neutral-700 dark:text-neutral-300 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                }`}>
                  {item.name}
                </span>
              </div>
              
              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full"
                />
              )}
            </motion.div>
          );
        })}
      </div>
      
      {/* Show more topics button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 text-primary-600 dark:text-primary-400 font-medium text-sm hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-2xl transition-colors border border-primary-200/50 dark:border-primary-700/50 hover:border-primary-300 dark:hover:border-primary-600"
      >
        Explore more topics
      </motion.button>
      
      {/* Selected topic info */}
      {selectedTopic && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-2xl border border-primary-200/50 dark:border-primary-700/50"
        >
          <p className="text-sm text-primary-700 dark:text-primary-300 font-medium">
            Exploring: <span className="font-semibold">{selectedTopic}</span>
          </p>
          <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
            Discover trending content in this category
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default Tags;
