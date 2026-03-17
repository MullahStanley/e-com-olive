import Link from 'next/link';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* About */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">ShopHub</h3>
            <p className="text-sm mb-4 leading-relaxed">
              Your trusted online marketplace offering quality products with secure payments and fast delivery.
            </p>
            <div className="flex space-x-4">
              {/* Added a11y labels and security attributes for external links */}
              <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Visit our Facebook page" className="hover:text-blue-400 transition">
                <Facebook size={20} aria-hidden="true" />
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Visit our Twitter page" className="hover:text-blue-400 transition">
                <Twitter size={20} aria-hidden="true" />
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Visit our Instagram page" className="hover:text-blue-400 transition">
                <Instagram size={20} aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <nav aria-label="Quick Links">
            <h3 className="text-white text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products" className="hover:text-blue-400 transition">Products</Link></li>
              <li><Link href="/track-order" className="hover:text-blue-400 transition">Track Order</Link></li>
              <li><Link href="/cart" className="hover:text-blue-400 transition">Shopping Cart</Link></li>
              <li><Link href="/login" className="hover:text-blue-400 transition">My Account</Link></li>
            </ul>
          </nav>

          {/* Customer Service */}
          <nav aria-label="Customer Service">
            <h3 className="text-white text-lg font-bold mb-4">Customer Service</h3>
            <ul className="space-y-2 text-sm">
              {/* Upgraded to Next.js Links for internal routing efficiency */}
              <li><Link href="/help" className="hover:text-blue-400 transition">Help Center</Link></li>
              <li><Link href="/returns" className="hover:text-blue-400 transition">Returns</Link></li>
              <li><Link href="/privacy" className="hover:text-blue-400 transition">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-blue-400 transition">Terms of Service</Link></li>
            </ul>
          </nav>

          {/* Contact */}
          <address className="not-italic">
            <h3 className="text-white text-lg font-bold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start">
                <MapPin size={18} className="mr-2 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>Nairobi, Kenya</span>
              </li>
              <li className="flex items-center">
                <Phone size={18} className="mr-2 flex-shrink-0" aria-hidden="true" />
                <a href="tel:+254700000000" className="hover:text-blue-400 transition">+254 700 000000</a>
              </li>
              <li className="flex items-center">
                <Mail size={18} className="mr-2 flex-shrink-0" aria-hidden="true" />
                {}
                <a href="mailto:support@shophub.com" className="hover:text-blue-400 transition">support@shophub.com</a>
              </li>
            </ul>
          </address>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {currentYear} Olive-wear. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}