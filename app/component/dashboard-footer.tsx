import React from "react";
import { FaInstagram, FaTwitter, FaLinkedin, FaEnvelope } from "react-icons/fa";

const DashboardFooter: React.FC = () => {
  return (
    <footer className="bg-gradient-to-br from-green-800 to-gray-900 py-10 text-white text-center relative shadow-xl border-t border-green-500">
      <div className="container mx-auto px-6 flex flex-col items-center space-y-6">
        <h2 className="text-2xl font-bold tracking-wide uppercase">SobatSampah</h2>
        <p className="text-sm md:text-base max-w-lg text-gray-300">
          Transforming waste management for a cleaner, greener, and smarter future.
        </p>
        <div className="flex space-x-6">
          <a
            href="https://www.instagram.com/sadamalrasyid1"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white text-2xl transition-transform transform hover:scale-125 hover:text-green-400"
          >
            <FaInstagram />
          </a>
          <a
            href="https://twitter.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white text-2xl transition-transform transform hover:scale-125 hover:text-blue-400"
          >
            <FaTwitter />
          </a>
          <a
            href="https://linkedin.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white text-2xl transition-transform transform hover:scale-125 hover:text-blue-500"
          >
            <FaLinkedin />
          </a>
          <a
            href="mailto:info@SobatSampah.com"
            className="text-white text-2xl transition-transform transform hover:scale-125 hover:text-red-400"
          >
            <FaEnvelope />
          </a>
        </div>
        <p className="text-xs md:text-sm text-gray-400">&copy; 2024 SobatSampah. All rights reserved.</p>
      </div>
      <div className="absolute bottom-4 right-6 text-xs text-gray-300 animate-pulse">
        Made with ❤️ by
        <a
          href="https://www.instagram.com/sadamalrasyid1"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 font-semibold underline hover:text-green-400 hover:shadow-lg"
        >
          Sadam Al Rasyid
        </a>
      </div>
    </footer>
  );
};

export default DashboardFooter;