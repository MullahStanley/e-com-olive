import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'ShopHub | Modern E-Commerce',
  description: 'Secure online shopping with Stripe payments and fast delivery.',
  keywords: 'ecommerce, online shopping, Stripe, electronics, ShopHub',
  openGraph: {
    title: 'ShopHub | Modern E-Commerce',
    description: 'Secure online shopping powered by Stripe.',
    url: 'https://shophub.example.com',
    siteName: 'ShopHub',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShopHub | Modern E-Commerce',
    description: 'Secure online shopping powered by Stripe.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning prevents extension-injected attribute errors
    <html lang="en" suppressHydrationWarning>
      {/* Set up a flex column to keep the footer pinned to the bottom */}
      <body className={`${inter.className} min-h-screen flex flex-col bg-gray-50 text-gray-900 antialiased`}>
        
        {/* Wrap the app in the AuthProvider to share user state globally */}
        <AuthProvider>
          <Navbar />
          
          {/* flex-grow ensures the main content pushes the footer down */}
          <main className="flex-grow flex flex-col">
            {children}
          </main>
          
          <Footer />
        </AuthProvider>

        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              fontWeight: '500',
            },
            success: {
              duration: 3000,
              iconTheme: { primary: '#10B981', secondary: '#fff' },
            },
            error: {
              duration: 4000,
              iconTheme: { primary: '#EF4444', secondary: '#fff' },
            },
          }}
        />
      </body>
    </html>
  );
}