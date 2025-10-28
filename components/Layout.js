import React from 'react';
import Head from 'next/head';
import Header from './Header';
import MobileNavigation from './MobileNavigation';

const Layout = ({ children, title = 'TokFlo', description = 'Modern Social Commerce Experience' }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="icon" href="/tokflo-favicon.svg" type="image/svg+xml" />
      </Head>
      
      <Header />
      
      <main className="pt-16">
        {children}
      </main>
      
      <MobileNavigation />
    </div>
  );
};

export default Layout;