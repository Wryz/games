/** @type {import('next').NextConfig} */
const nextConfig = {
  // Baked in at build/deploy time so "Last updated" stays current without manual edits
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
}

module.exports = nextConfig
