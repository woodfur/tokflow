import Head from "next/head";
import LeftHandSide from "../components/LeftHandSide";
import RightHandSide from "../components/RightHandSide";
import MobileNavigation from "../components/MobileNavigation";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <Head>
        <title>TokFlo - Modern Social Experience</title>
        <meta name="description" content="Experience the future of social media with TokFlo" />
        <link rel="icon" href="/tokflo-favicon.svg" type="image/svg+xml" />
      </Head>
      
      {/* "For you" text - Top left overlay */}
      <div className="fixed top-4 left-4 z-50">
        <div className="flex items-center space-x-2 px-3 py-2 bg-black/30 backdrop-blur-sm rounded-full">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <h1 className="text-lg font-semibold text-white">For you</h1>
        </div>
      </div>
      

      
      <main className="flex flex-col lg:flex-row h-screen overflow-hidden">
          {/* Left Sidebar - Hidden on mobile, visible on desktop */}
          <div className="hidden lg:block lg:w-80 xl:w-96 flex-shrink-0">
            <LeftHandSide />
          </div>
          
          {/* Main Content - Full height for TikTok-style scrolling */}
          <div className="flex-1 w-full lg:max-w-none pb-20 md:pb-0 h-full">
            <RightHandSide />
          </div>
        </main>
        
        {/* Mobile Navigation */}
        <MobileNavigation />
    </div>
  );
}
