import '../styles/globals.css'
import Head from 'next/head'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '../firebase/firebase'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { CartProvider } from '../context/CartContext'

function MyApp({ Component, pageProps }) {
  const [user, loading] = useAuthState(auth)
  const router = useRouter()
  
  // Pages that don't require authentication
  const publicPages = ['/auth/signin']
  const isPublicPage = publicPages.includes(router.pathname)
  
  useEffect(() => {
    // If not loading and no user and not on a public page, redirect to signin
    if (!loading && !user && !isPublicPage) {
      router.push('/auth/signin')
    }
    // If user is authenticated and on signin page, redirect to home
    if (user && router.pathname === '/auth/signin') {
      router.push('/')
    }
  }, [user, loading, router.pathname, isPublicPage])
  
  // Show loading or signin page for unauthenticated users
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    )
  }
  
  // If not authenticated and not on public page, don't render the component
  if (!user && !isPublicPage) {
    return null
  }

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>
      <CartProvider>
        <Component {...pageProps} />
      </CartProvider>
    </>
  )
}

export default MyApp
