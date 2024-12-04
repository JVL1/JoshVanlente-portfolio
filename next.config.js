const withNextIntl = require('next-intl/plugin')();

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['remixicon'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        punycode: false,
      };
    }
    config.module.rules.push({
      test: /\.(css)$/,
      use: ['style-loader', 'css-loader'],
    });
    return config;
  },
};

module.exports = withNextIntl(nextConfig); 