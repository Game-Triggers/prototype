import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      // Google profile image domains
      'lh3.googleusercontent.com',
      'lh4.googleusercontent.com',
      'lh5.googleusercontent.com',
      'lh6.googleusercontent.com',
      
      // Twitch profile image domains
      'static-cdn.jtvnw.net',
      
      // GitHub profile image domains (just in case)
      'avatars.githubusercontent.com',
      
      // Unsplash image domains
      'images.unsplash.com',
      'plus.unsplash.com',
    ],
  },
};

export default nextConfig;
