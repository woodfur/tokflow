import React, { useState } from "react";
import { useRouter } from "next/router";
import { useAuthState } from "react-firebase-hooks/auth";
import { signOut } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";

import { 
  MagnifyingGlassIcon,
  PlusIcon,
  EllipsisVerticalIcon,
  BellIcon,
  ChatBubbleLeftRightIcon
} from "@heroicons/react/24/outline";

import { auth } from "../firebase/firebase";

const Header = ({ isShow }) => {
  const router = useRouter();
  const [user] = useAuthState(auth);
  const [dropMenu, setDropMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-200/50 dark:border-neutral-700/50 shadow-glass"
    >
      <nav className="flex items-center justify-between px-4 lg:px-6 h-16 max-w-7xl mx-auto">
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center space-x-4"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/")}
            className="cursor-pointer"
          >
            <img
              className="h-8 w-auto"
              src="https://i.postimg.cc/W1PwRj4j/logo.png"
              alt="TokFlo"
            />
          </motion.div>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1 max-w-md mx-8 hidden md:block"
        >
          <div className="relative">
            <motion.div
              animate={{
                scale: searchFocused ? 1.02 : 1,
                boxShadow: searchFocused 
                  ? "0 8px 32px rgba(0, 0, 0, 0.12)" 
                  : "0 4px 16px rgba(0, 0, 0, 0.08)"
              }}
              transition={{ duration: 0.2 }}
              className="relative overflow-hidden rounded-full bg-neutral-100/80 dark:bg-neutral-800/80 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50"
            >
              <input
                type="text"
                placeholder="Search accounts and videos"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full h-12 pl-4 pr-12 bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none font-medium"
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-colors duration-200"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </div>
        </motion.div>

        {/* Mobile Search Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          className="md:hidden p-2 rounded-full hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80 transition-colors duration-200"
        >
          <MagnifyingGlassIcon className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
        </motion.button>

        {/* Actions Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center space-x-2 lg:space-x-4"
        >
          {/* Upload Button */}
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/upload")}
            className="hidden md:flex items-center justify-center w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            style={{
              WebkitBackfaceVisibility: 'hidden',
              WebkitTransform: 'translate3d(0, 0, 0)',
              transform: 'translate3d(0, 0, 0)'
            }}
          >
            <PlusIcon className="w-5 h-5" />
          </motion.button>

          {/* Mobile Upload Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push("/upload")}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-2xl bg-primary-500 text-white shadow-lg"
            style={{
              WebkitBackfaceVisibility: 'hidden',
              WebkitTransform: 'translate3d(0, 0, 0)',
              transform: 'translate3d(0, 0, 0)'
            }}
          >
            <PlusIcon className="w-5 h-5" />
          </motion.button>

          {user ? (
            <>
              {/* Notifications - Hidden on mobile */}
              <motion.button
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                className="hidden md:flex p-2 rounded-full hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80 transition-colors duration-200 relative"
              >
                <BellIcon className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent-500 rounded-full border-2 border-white dark:border-neutral-900"></span>
              </motion.button>

              {/* Messages - Hidden on mobile */}
              <motion.button
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                className="hidden md:flex p-2 rounded-full hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80 transition-colors duration-200 relative"
              >
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent-500 rounded-full border-2 border-white dark:border-neutral-900"></span>
              </motion.button>

              {/* Profile Menu */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDropMenu(!dropMenu)}
                  className="flex items-center space-x-2 p-1 rounded-full hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80 transition-colors duration-200"
                >
                  <img
                    src={user?.photoURL || "/default-avatar.png"}
                    alt={user?.displayName || "User"}
                    className="w-8 h-8 rounded-full object-cover border-2 border-primary-200"
                  />
                  <EllipsisVerticalIcon className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                </motion.button>

                {/* Dropdown Menu */}
                {dropMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-xl rounded-2xl shadow-glass border border-neutral-200/50 dark:border-neutral-700/50 py-2 z-50"
                  >
                    <div className="px-4 py-3 border-b border-neutral-200/50 dark:border-neutral-700/50">
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">{user?.displayName}</p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">{user?.email}</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        router.push("/profile");
                        setDropMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50 transition-colors duration-200 text-neutral-700 dark:text-neutral-300"
                    >
                      View Profile
                    </button>
                    
                    <button
                      onClick={() => {
                        router.push("/settings");
                        setDropMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50 transition-colors duration-200 text-neutral-700 dark:text-neutral-300"
                    >
                      Settings
                    </button>
                    
                    <hr className="my-2 border-neutral-200/50 dark:border-neutral-700/50" />
                    
                    <button
                      onClick={() => {
                        logout();
                        setDropMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 text-red-600 dark:text-red-400 font-medium"
                    >
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Login Button */}
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/auth/signin")}
                className="px-6 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Log in
              </motion.button>
            </>
          )}
        </motion.div>
      </nav>

      {/* Mobile Search Bar */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="md:hidden px-4 pb-3 border-t border-neutral-200/50 dark:border-neutral-700/50"
          >
          <div className="relative">
            <input
              type="text"
              placeholder="Search accounts and videos"
              autoFocus
              className="w-full h-10 pl-4 pr-10 bg-neutral-100/80 dark:bg-neutral-800/80 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50 rounded-full text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-primary-500 text-white">
            <MagnifyingGlassIcon className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;
