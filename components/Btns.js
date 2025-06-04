import { faker } from "@faker-js/faker";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { PlusIcon, CheckIcon } from "@heroicons/react/24/outline";
import { auth } from "../firebase/firebase";

const Btns = () => {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [randomUsers, setRandomUsers] = useState([]);
  const [followedUsers, setFollowedUsers] = useState(new Set());

  const handleChangePage = (userId) => {
    if (user) {
      router.push({
        pathname: `user/${userId}`,
        query: {
          userId: userId,
        },
      });
    } else {
      router.push("/auth/signin");
    }
  };

  const handleFollow = (e, userId) => {
    e.stopPropagation();
    if (!user) {
      router.push("/auth/signin");
      return;
    }
    
    setFollowedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const users = [];
    for (let i = 0; i < 5; i++) {
      users.push({
        id: faker.datatype.uuid(),
        name: faker.name.fullName(),
        avatar: faker.image.avatar(),
        username: faker.internet.userName(),
        followers: faker.datatype.number({ min: 100, max: 50000 }),
        isVerified: faker.datatype.boolean(),
      });
    }
    setRandomUsers(users);
  }, []);

  const formatFollowers = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  return (
    <div className="space-y-3">
      {randomUsers.map((suggestedUser, index) => {
        const isFollowed = followedUsers.has(suggestedUser.id);
        
        return (
          <motion.div
            key={suggestedUser.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            whileHover={{ scale: 1.02 }}
            className="flex items-center justify-between p-3 rounded-2xl hover:bg-neutral-50/80 dark:hover:bg-neutral-800/80 transition-all duration-200 cursor-pointer group"
            onClick={() => handleChangePage(suggestedUser.id)}
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <img
                  className="w-12 h-12 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-700 group-hover:border-primary-300 transition-colors"
                  src={suggestedUser.avatar}
                  alt={suggestedUser.username}
                />
                {suggestedUser.isVerified && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center">
                    <CheckIcon className="w-2 h-2 text-white" />
                  </div>
                )}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1">
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate text-sm">
                    @{suggestedUser.username.replace(/\s+/g, "").toLowerCase()}
                  </p>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                  {suggestedUser.name}
                </p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500">
                  {formatFollowers(suggestedUser.followers)} followers
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => handleFollow(e, suggestedUser.id)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 flex items-center space-x-1 flex-shrink-0 ${
                isFollowed
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  : 'bg-primary-500 text-white hover:bg-primary-600 shadow-md hover:shadow-lg'
              }`}
            >
              {isFollowed ? (
                <>
                  <CheckIcon className="w-3 h-3" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <PlusIcon className="w-3 h-3" />
                  <span>Follow</span>
                </>
              )}
            </motion.button>
          </motion.div>
        );
      })}
      
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full mt-4 py-3 text-primary-600 dark:text-primary-400 font-medium text-sm hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-2xl transition-colors"
      >
        See all suggestions
      </motion.button>
    </div>
  );
};

export default Btns;
