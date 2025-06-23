import React, { useState } from "react";
import { useRouter } from "next/router";
import { useAuthState } from "react-firebase-hooks/auth";
import { signOut } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";

import { 
  MagnifyingGlassIcon,
  PlusIcon,
  EllipsisVerticalIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  ShoppingCartIcon,
  HeartIcon
} from "@heroicons/react/24/outline";

import { auth } from "../firebase/firebase";

const Header = ({ isShow }) => {
  const router = useRouter();
  const [user] = useAuthState(auth);
  const { cart } = useCart();
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
            <svg width="32" height="32" viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M152.231 395.291C156.276 394.674 161.088 395.089 165.061 396.052C169.203 397.056 172.904 398.57 176.683 400.516C185.008 404.802 193.003 410.01 201.057 414.797L244.759 440.809L276.402 459.525C281.631 462.655 287.132 465.599 292.052 469.193C296.293 472.29 300.181 476.4 302.904 480.894C308.653 490.38 310.311 501.111 307.666 511.835C306.242 517.605 303.703 522.964 299.685 527.391C292.387 535.433 279.643 542.382 270.262 548.18L236.868 568.462C232.83 571.072 228.607 573.465 224.478 575.931C217.307 580.288 210.099 584.582 202.854 588.813C195.872 592.95 189.102 597.665 181.695 601.019C177.474 602.931 172.451 604.545 167.835 605.012C155.079 606.302 141.837 602.533 131.921 594.327C123.215 587.124 117.506 577.096 116.497 565.77C115.662 556.4 116.131 546.648 116.133 537.228L116.15 487.788L116.156 450.905C116.157 443.541 115.607 435.614 116.793 428.345C117.909 421.5 120.926 414.544 125.398 409.221C131.901 401.478 142.136 396.119 152.231 395.291ZM191.885 579.48C202.883 572.877 213.922 566.344 225.003 559.881L234.847 553.969C236.868 552.758 238.826 551.429 241.016 550.535C228.492 537.943 214.106 530.894 196.175 530.839C193.878 530.831 191.383 530.706 189.104 530.986C177.657 531.552 163.545 537.131 155.784 545.623C150.763 551.117 147.594 558.416 147.959 565.964C148.266 572.035 151.005 577.726 155.559 581.753C160.817 586.493 166.599 588.208 173.614 587.777C180.483 587.355 186.182 582.913 191.885 579.48ZM197.751 519.471C215.28 518.148 228.445 502.911 227.211 485.376C225.978 467.841 210.807 454.598 193.266 455.743C175.599 456.897 162.24 472.2 163.483 489.861C164.726 507.522 180.096 520.804 197.751 519.471Z" fill="#FF6266"/>
              <path d="M182.302 491.566C186.03 491.807 187.941 495.752 191.423 496.673C192.495 496.957 193.739 496.943 194.847 496.959C201.784 497.057 203.424 492.228 208.408 491.825C209.354 491.748 210.356 491.902 211.083 492.558C212.029 493.412 212.48 495.037 212.458 496.276C212.419 498.502 210.512 500.274 209.064 501.756C206.798 503.713 204.05 505.283 201.176 506.144C196.321 507.6 190.281 506.996 185.838 504.566C182.961 502.992 179.244 500.186 178.387 496.882C178.117 495.839 178.133 494.707 178.711 493.766C179.535 492.426 180.847 491.931 182.302 491.566Z" fill="#FF6266"/>
              <path d="M834.242 464.812C861.581 464.24 884.229 485.897 884.882 513.235C885.535 540.573 863.946 563.285 836.611 564.019C809.159 564.757 786.329 543.057 785.674 515.604C785.018 488.15 806.787 465.385 834.242 464.812ZM838.477 540.139C852.736 538.492 862.957 525.594 861.304 511.337C859.65 497.079 846.748 486.863 832.491 488.525C818.244 490.185 808.038 503.075 809.69 517.323C811.343 531.571 824.229 541.783 838.477 540.139Z" fill="#102B48"/>
              <path d="M506.55 464.828C533.837 464.63 556.15 486.525 556.468 513.81C556.787 541.095 534.989 563.505 507.706 563.943C480.253 564.384 457.673 542.421 457.353 514.966C457.032 487.511 479.094 465.028 506.55 464.828ZM508.599 541.378C517.423 538.884 524.117 536.016 528.816 527.63C532.407 521.22 533.16 513.089 531.08 506.068C529.153 499.567 524.914 494.058 518.904 490.869C515.304 488.96 510.057 487.146 505.942 487.56C498.468 488.923 491.567 491.775 487.13 498.188C482.793 504.458 481.266 512.629 482.672 520.099C483.924 526.748 487.447 532.774 493.141 536.555C497.911 539.722 502.979 540.887 508.599 541.378Z" fill="#102B48"/>
              <path d="M578.165 437.247C581.684 437.187 584.936 437.181 588.256 438.472C589.154 439.655 590.348 441.177 590.617 442.664C591.589 448.035 590.817 455.057 590.811 460.611C590.798 474.348 590.703 488.128 590.9 501.86C595.667 497.694 599.588 492.758 603.708 487.975C606.6 484.619 609.624 481.39 612.532 478.054C614.801 475.451 616.794 472.568 619.35 470.229C620.639 469.049 621.919 468.091 623.661 467.722C627.188 466.976 639.844 466.797 642.602 468.699C643.446 469.28 644.04 470.219 644.157 471.243C644.338 472.823 643.522 474.42 642.674 475.693C640.432 479.063 637.162 481.975 634.539 485.071L615.7 507.432C619.1 513.371 623.37 519.012 627.242 524.672L645.353 551.553C646.364 553.014 647.689 554.639 648.243 556.333C648.576 557.35 648.54 558.281 648.014 559.237C647.233 560.656 645.147 561.695 643.619 561.993C639.489 562.799 627.889 562.426 624.381 560.22C620.846 557.995 607.697 536.721 604.367 531.778C602.696 529.298 600.687 525.359 598.221 523.662C595.695 525.57 593.187 528.406 591.204 530.876C589.809 539.372 591.415 548.372 590.694 556.978C590.29 557.652 589.883 558.34 589.371 558.941C587.809 560.774 585.607 561.595 583.244 561.752C578.988 562.035 572.4 562.567 569.12 559.49C567.264 557.746 567.317 555.083 567.251 552.688C567.058 545.717 567.377 538.651 567.39 531.669L567.41 487.24L567.416 458.399C567.416 453.39 567.159 448.219 567.54 443.227C567.662 441.62 567.79 440.075 569.02 438.905C571.051 436.972 575.59 437.302 578.165 437.247Z" fill="#102B48"/>
              <path d="M716.351 437.262C720.702 437.239 725.439 436.856 729.756 437.324C732.851 437.66 734.108 438.492 736.062 440.816C736.617 443.556 736.908 446.343 736.93 449.138C736.967 452.463 736.695 456.867 733.993 459.202C732.97 460.087 730.646 460.291 729.299 460.41C723.435 460.927 717.207 460.5 711.31 460.496C702.679 460.488 693.922 460.764 685.306 460.295C685.381 465.939 685.281 471.589 685.309 477.234C685.329 481.363 685.6 485.545 685.299 489.66L709.021 489.522C713.477 489.51 718.12 489.251 722.553 489.682C724.094 489.832 726.112 490.079 727.376 491.045C728.8 492.133 729.227 494.765 729.294 496.412C729.419 499.484 730.063 508.178 727.93 510.284C726.555 511.642 724.219 512.235 722.368 512.5C716.974 513.274 711.066 512.76 705.595 512.726C698.872 512.685 692.11 512.866 685.395 512.663C685.313 514.96 685.323 517.268 685.293 519.566L685.343 542.911C685.351 546.809 685.626 550.925 685.253 554.795C685.126 556.116 684.871 557.836 684.019 558.908C681.616 561.929 676.932 561.765 673.459 561.821C669.012 561.891 665.29 561.902 661.907 558.635C661.782 557.926 661.698 557.21 661.656 556.491C661.205 549.282 661.531 541.897 661.537 534.665L661.51 495.215L661.48 461.447C661.476 455.738 661.109 449.728 661.573 444.054C661.748 441.916 662.138 439.817 663.595 438.177C666.77 436.594 709.231 437.265 716.351 437.262Z" fill="#102B48"/>
              <path d="M452.04 437.261C456.247 437.223 468.683 436.1 471.575 438.708C474.01 440.904 473.901 445.161 473.934 448.182C473.968 451.141 474.41 456.438 472.045 458.671C470.878 459.774 469.244 460.12 467.702 460.337C464.198 460.828 460.391 460.583 456.854 460.56L438.301 460.42C437.382 468.731 438.016 477.728 438.02 486.096L438.058 534.215C438.08 541.577 438.879 551.14 437.52 558.219C437.185 558.586 436.848 558.951 436.487 559.293C433.675 561.948 427.775 562.083 424.098 561.905C419.931 561.704 417.343 560.69 414.546 557.645C413.894 554.62 413.998 551.729 414.083 548.656C414.25 519.271 414.224 489.885 414.003 460.5C404.749 460.251 395.374 461.007 386.145 460.508C382.487 460.309 380.956 459.279 378.579 456.622C378.189 454.439 378.159 452.18 378.119 449.968C378.066 446.999 377.57 440.393 380.199 438.463C381.265 437.68 383.441 437.567 384.757 437.479C392.548 436.952 400.604 437.328 408.418 437.328L452.04 437.261Z" fill="#102B48"/>
              <path d="M761.195 437.247C766.143 437.266 769.316 437.094 773.014 440.792C773.376 446.346 773.163 452.024 773.171 457.598L773.157 489.386L773.187 531.614C773.191 540.284 773.332 548.978 773.027 557.645C769.646 561.025 767.457 561.632 762.751 561.851C761.091 561.865 759.389 561.903 757.735 561.764C755.319 561.562 752.913 560.845 751.361 558.871C750.028 557.175 749.94 555.291 749.793 553.225C749.339 546.846 749.693 540.242 749.698 533.843L749.719 496.784L749.686 463.422C749.677 456.164 749.387 448.758 750.077 441.531L752.783 438.186C755.541 437.259 758.317 437.317 761.195 437.247Z" fill="#102B48"/>
            </svg>
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
              {/* Cart Button */}
              <motion.button
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => router.push("/cart")}
                className="hidden md:flex p-2 rounded-full hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80 transition-colors duration-200 relative"
              >
                <ShoppingCartIcon className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
                {cart.items.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                    {cart.items.reduce((total, item) => total + item.quantity, 0)}
                  </span>
                )}
              </motion.button>

              {/* Wishlist Button */}
              <motion.button
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => router.push("/wishlist")}
                className="hidden md:flex p-2 rounded-full hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80 transition-colors duration-200 relative"
              >
                <HeartIcon className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
              </motion.button>

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
                        router.push(`/user/${user?.uid}`);
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
