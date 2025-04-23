import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.gpteng.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https://*.supabase.co https://*.googleapis.com https://*.githubusercontent.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.googleapis.com ws://localhost:* http://localhost:*"
    },
    cors: {
      origin: process.env.VITE_ALLOWED_ORIGINS?.split(',') || ['http://localhost:8080'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
      exposedHeaders: ['X-CSRF-Token'],
      credentials: true,
      maxAge: 86400
    }
  },
  plugins: [
    react({
      // This is the key part - enable Fast Refresh
      fastRefresh: true,
      // Include development features
      include: "**/*.{jsx,tsx}",
    }),
    componentTagger(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  // Enable source maps for debugging
  build: {
    sourcemap: true,
  },
});
