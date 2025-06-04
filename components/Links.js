import React from "react";
import moment from "moment";

const Links = () => {
  return (
    <div className="p-4 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <a href="#" className="text-neutral-600 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors truncate">About</a>
          <a href="#" className="text-neutral-600 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors truncate">Newsroom</a>
          <a href="#" className="text-neutral-600 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors truncate">Contact</a>
          <a href="#" className="text-neutral-600 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors truncate">Careers</a>
          <a href="#" className="text-neutral-600 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors truncate">ByteDance</a>
          <a href="#" className="text-neutral-600 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors truncate">Privacy</a>
          <a href="#" className="text-neutral-600 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors truncate">Terms</a>
          <a href="#" className="text-neutral-600 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors truncate">Help</a>
        </div>
        <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">&copy; {moment().format("YYYY")} Tokflo</p>
        </div>
      </div>
    </div>
  );
};

export default Links;
