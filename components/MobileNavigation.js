import React from "react";
import { useRouter } from "next/router";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion } from "framer-motion";
import {
  HomeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ShoppingBagIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { auth } from "../firebase/firebase";

const MobileNavigation = () => {
  const router = useRouter();
  const [user] = useAuthState(auth);
  const currentPath = router.pathname;

  const navItems = [
    {
      id: "feed",
      label: "Feed",
      icon: HomeIcon,
      path: "/",
      isActive: currentPath === "/",
    },
    {
      id: "search",
      label: "Search",
      icon: MagnifyingGlassIcon,
      path: "/search",
      isActive: currentPath === "/search",
    },
    {
      id: "upload",
      label: "Upload",
      icon: PlusIcon,
      path: "/pin/create",
      isActive: currentPath === "/pin/create",
      isSpecial: true, // This will be styled differently as the plus button
    },
    {
      id: "store",
      label: "Store",
      icon: ShoppingBagIcon,
      path: "/store",
      isActive: currentPath === "/store" || currentPath.startsWith("/product/") || currentPath.startsWith("/my-store") || currentPath.startsWith("/create-store"),
    },
    {
      id: "profile",
      label: "Profile",
      icon: UserIcon,
      path: user ? `/user/${user.uid}` : "/auth/signin",
      isActive: currentPath.startsWith("/user/") || currentPath === "/profile",
      avatar: user?.photoURL,
    },
  ];

  const handleNavigation = (item) => {
    router.push(item.path);
  };

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl shadow-glass md:hidden ${
        currentPath === "/" 
          ? "bg-black/20" 
          : "bg-white/95 dark:bg-neutral-900/95"
      }`}
    >
      <div className="flex items-center justify-around px-2 py-2 safe-area-bottom">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          
          return (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNavigation(item)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
                item.isSpecial
                  ? "bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg min-w-[48px] h-12"
                  : item.isActive
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
              }`}
            >
              {/* Special styling for upload button */}
              {item.isSpecial ? (
                <div className="relative">
                  <IconComponent className="w-6 h-6" />
                  {/* Decorative elements for the plus button */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl blur opacity-30 -z-10"></div>
                </div>
              ) : item.id === "profile" && item.avatar ? (
                /* Profile avatar */
                <div className="relative">
                  <img
                    src={item.avatar}
                    alt="Profile"
                    className={`w-6 h-6 rounded-full object-cover border-2 ${
                      item.isActive
                        ? "border-primary-500"
                        : "border-neutral-300 dark:border-neutral-600"
                    }`}
                  />
                  {item.isActive && (
                    <div className="absolute -inset-0.5 bg-primary-500 rounded-full -z-10"></div>
                  )}
                </div>
              ) : (
                /* Regular icons */
                <IconComponent
                  className={`w-6 h-6 ${
                    item.isActive ? "fill-current" : ""
                  }`}
                />
              )}
              
              {/* Label - Hide for upload button */}
              {!item.isSpecial && (
                <span
                  className={`text-xs mt-1 font-medium ${
                    item.isActive
                      ? "text-primary-600 dark:text-primary-400"
                      : "text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  {item.label}
                </span>
              )}
              
              {/* Active indicator */}
              {item.isActive && !item.isSpecial && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-1 w-1 h-1 bg-primary-500 rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default MobileNavigation;