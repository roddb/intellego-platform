/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    '@libsql/client',
    '@prisma/adapter-libsql'
  ],
  experimental: {
    // Enable webpack memory optimizations to prevent chunk loading issues
    webpackMemoryOptimizations: true,
    // Enable CSS chunking optimization
    cssChunking: true,
    // Optimize package imports to reduce bundle size
    optimizePackageImports: ['date-fns', 'react-icons'],
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    // Webpack 5 optimizations for chunk loading stability
    if (!isServer) {
      // Exclude server-only packages from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
      
      // Exclude server-only packages completely from client bundle
      config.externals = [...(config.externals || []), '@libsql/client', '@prisma/adapter-libsql']
      
      // Optimize chunk splitting for better loading
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            // Create separate chunk for timezone utilities
            timezone: {
              test: /[\\/]src[\\/]lib[\\/]timezone-utils/,
              name: 'timezone-utils',
              chunks: 'all',
              priority: 30,
            },
            // Optimize vendor chunks
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 20,
            },
          },
        },
      }
    }
    
    // Enable development-specific optimizations only in dev mode
    if (dev) {
      // Temporarily disable custom devtool to prevent server connection issues
      // config.devtool = 'eval-cheap-module-source-map'
    }
    
    // Solución específica para el error de libsql README.md files
    // Basado en: https://github.com/tursodatabase/libsql/issues/1276
    config.module.rules.push({
      test: /\.md$/,
      type: 'asset/source',
    })
    
    // Solución adicional para archivos LICENSE y otros
    config.module.rules.push({
      test: /\.(txt|LICENSE|CHANGELOG)$/i,
      type: 'asset/source',
    })
    
    // IgnorePlugin para evitar que webpack procese estos archivos completamente
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\.(md|txt|LICENSE|CHANGELOG)$/i,
        contextRegExp: /node_modules\/@libsql/,
      })
    )
    
    // Important: return the modified config
    return config
  },
}

module.exports = nextConfig