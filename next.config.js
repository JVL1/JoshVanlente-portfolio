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

    // Handle CSS and SCSS
    config.module.rules.push({
      test: /\.(css|scss)$/,
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            importLoaders: 1,
          },
        },
        'sass-loader',
      ],
    });

    // Handle SVG files
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    // Handle Remixicon CSS
    config.resolve.alias = {
      ...config.resolve.alias,
      'remixicon/fonts/remixicon.css': require.resolve('remixicon/fonts/remixicon.css'),
    };

    return config;
  },
};

module.exports = withNextIntl(nextConfig); 