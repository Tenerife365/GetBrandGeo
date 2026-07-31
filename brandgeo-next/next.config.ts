import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Fully static export. The hero page has no server components doing runtime
  // work, no route handlers and no next/image optimization, so `out/` is a
  // plain folder of HTML/CSS/JS that any static host will serve — Netlify Drop,
  // a cPanel subfolder, or an S3 bucket. No Node runtime required.
  output: 'export',

  // Without this Turbopack walks up and picks C:\Users\const\package-lock.json
  // as the workspace root, which pulls in unrelated trees and prints a warning
  // on every build. Pin the root to this app.
  turbopack: {
    root: path.resolve(__dirname),
  },
}

export default nextConfig
