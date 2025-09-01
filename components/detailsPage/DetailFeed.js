import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { onSnapshot, doc } from "firebase/firestore";

import { firestore } from "../../firebase/firebase";
// import VideoDetail from "./VideoDetail";
import Post from "../Post";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const DetailFeed = () => {
  const router = useRouter();
  const { id } = router.query;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(
      doc(firestore, "posts", id),
      (docSnap) => {
        setPost(docSnap.exists() ? docSnap : null);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching post:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  const BackButton = () => (
    <button
      aria-label="Go back"
      onClick={(e) => {
        e.stopPropagation();
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push("/");
        }
      }}
      className="fixed top-4 left-4 z-50 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm border border-neutral-200/60 dark:border-neutral-700/60 shadow-glass rounded-full p-2 hover:shadow-lg transition-all"
    >
      <ArrowLeftIcon className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />
    </button>
  );

  if (!id) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-start justify-center overflow-hidden pt-16">
        <BackButton />
        <div className="p-6 text-neutral-500">Loading post…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-start justify-center overflow-hidden pt-16">
        <BackButton />
        <div className="p-6 text-red-600">Failed to load post.</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="fixed inset-0 flex items-start justify-center overflow-hidden pt-16">
        <BackButton />
        <div className="p-6 text-neutral-500">Post not found.</div>
      </div>
    );
  }

  const data = post.data();
  const videoUrl = data?.video ?? data?.image ?? "";

  return (
    <div className="fixed inset-0 overflow-hidden">
      <BackButton />
      <div className="w-full h-full">
        <Post
          caption={data?.caption}
          company={data?.company}
          video={videoUrl}
          profileImage={data?.profileImage}
          topic={data?.topic}
          timestamp={data?.timestamp}
          username={data?.username}
          userId={data?.userId}
          songName={data?.songName}
          id={post.id}
        />
      </div>
    </div>
  );
};

export default DetailFeed;
