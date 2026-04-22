import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 Turbopack dev regression: performance.measure('Home', ...) fires
  // with a negative delta during fast-refresh / initial segment render,
  // throwing an uncaught TypeError in the browser console. The segment
  // explorer overlay drives it; turning it off silences the noise without
  // hiding real build/runtime errors.
  devIndicators: false,
};

export default nextConfig;
