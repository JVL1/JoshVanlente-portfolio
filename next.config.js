const withNextIntl = require('next-intl/plugin')();

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['remixicon'],
  sassOptions: {
    includePaths: ['./src'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        punycode: false,
      };
    }
    config.module.rules.push({
      test: /\.(css|scss)$/,
      use: ['style-loader', 'css-loader', 'sass-loader'],
    });
    return config;
  },
};

module.exports = withNextIntl(nextConfig); 