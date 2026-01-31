/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://51.20.7.23/api/:path*',
      },
      {
        source: '/socket.io/:path*',
        destination: 'http://51.20.7.23/socket.io/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
