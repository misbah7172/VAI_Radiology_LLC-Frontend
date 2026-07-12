import type { NextConfig } from "next";

const remotePatterns = [
  {
    protocol: 'http' as const,
    hostname: 'localhost',
    port: '8000',
  },
  {
    protocol: 'http' as const,
    hostname: '127.0.0.1',
    port: '8000',
  },
  {
    protocol: 'https' as const,
    hostname: '**.onrender.com',
  },
  {
    protocol: 'https' as const,
    hostname: '**.vercel.app',
  },
];

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (apiUrl) {
  try {
    const urlObj = new URL(apiUrl);
    const protocol = urlObj.protocol.replace(':', '') as 'http' | 'https';
    if (protocol === 'http') {
      remotePatterns.push({
        protocol: 'http',
        hostname: urlObj.hostname,
        port: urlObj.port || '',
      });
    } else {
      remotePatterns.push({
        protocol: 'https',
        hostname: urlObj.hostname,
      });
    }
  } catch {
    // Ignore invalid URL
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
