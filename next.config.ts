import type { NextConfig } from "next";
import os from "os";

// Dynamically fetch all local IPv4 addresses to allow them as dev origins
function getLocalIPv4s() {
  const ips: string[] = [];
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

const nextConfig: NextConfig = {
  /* config options here */
  // Allow cross-origin dev resources (HMR, fonts) for local network IPs
  allowedDevOrigins: getLocalIPv4s(),
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
