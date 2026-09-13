const isProduction = process.env.NODE_ENV === "production";
const allowedFrameAncestors = "'self' https://jonasl.online https://www.jonasl.online https://portfolio-git-codex-project-sho-2177ed-jonaslacandolas-projects.vercel.app";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  `frame-ancestors ${allowedFrameAncestors}`,
  // Arbitrary HTTPS frames remain required by the existing live-project preview feature.
  // Video playback itself is restricted in code to the privacy-enhanced YouTube host.
  "frame-src 'self' https: https://www.youtube-nocookie.com https://*.public.blob.vercel-storage.com",
  "object-src 'self' https://*.public.blob.vercel-storage.com",
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://i.ytimg.com https://*.public.blob.vercel-storage.com",
  "font-src 'self' data:",
  "media-src 'self' https://*.public.blob.vercel-storage.com",
  "connect-src 'self' https://vercel.com https://blob.vercel-storage.com https://*.blob.vercel-storage.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(isProduction
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // Static generation opens database-backed routes in worker processes.
    // Keep the build bounded for Neon's small compute tier.
    cpus: 1,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
