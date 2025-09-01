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
      path: "/upload",
      isActive: currentPath === "/upload",
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
      isActive: currentPath.startsWith("/user/"),
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
      <div className="flex items-center justify-around px-2 pt-0 pb-2 safe-area-bottom overflow-visible">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          
          return (
            <motion.button
              key={item.id}
              whileHover={item.isSpecial ? { scale: 1.02 } : { scale: 1.05 }}
              // Keep hover animation only for special button (no tap/press animation)
              whileTap={item.isSpecial ? undefined : { scale: 0.95 }}
              onClick={() => handleNavigation(item)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
                item.isSpecial
                  ? "text-primary-600 min-w-[56px] h-14 -translate-y-1/4 origin-bottom z-10"
                  : item.isActive
                  ? "text-primary-600 dark:text-primary-400"
                  : (currentPath === "/" && (item.id === "search" || item.id === "store"))
                  ? "text-white/90 hover:text-white dark:text-white/90 dark:hover:text-white"
                  : "text-neutral-800 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100"
              }`}
            >
              {/* Special styling for upload button */}
              {item.isSpecial ? (
                <div className="relative -translate-y-1/4">
                  <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg border border-white ring-2 ring-primary-500/80">
                     <IconComponent className="w-8 h-8 text-primary-600" strokeWidth={2} />
                   </div>
                </div>
              ) : item.id === "profile" && item.avatar ? (
                /* Profile avatar */
                <div className="relative">
                  <img
                    src={item.avatar}
                    alt="Profile"
                    className={`w-7 h-7 rounded-full object-cover border-2 ${
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
                  className={`w-7 h-7 ${
                    item.isActive ? "fill-current" : ""
                  }`}
                />
              )}
              
              {/* Labels removed in new design */}
              
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