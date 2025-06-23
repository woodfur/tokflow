import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase/firebase";

import UserProfile from "../../components/UserProfile";
import OtherUserProfile from "../../components/OtherUserProfile";
import MobileNavigation from "../../components/MobileNavigation";

const User = () => {
  const router = useRouter();
  const { id } = router.query;
  const [user] = useAuthState(auth);

  // Show loading while auth state is being determined
  if (!router.isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Determine if this is the current user's profile or another user's profile
  const isOwnProfile = user && user.uid === id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <Head>
        <title>TokFlo - User Profile</title>
        <meta name="description" content="View user profile on TokFlo" />
        <link rel="icon" href="/tokflo-favicon.svg" type="image/svg+xml" />
      </Head>
      
      {/* Render appropriate profile component */}
      {isOwnProfile ? <UserProfile /> : <OtherUserProfile />}
      
      {/* Only show mobile navigation for own profile */}
      {isOwnProfile && <MobileNavigation />}
    </div>
  );
}

export default User;
