/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    '@libsql/client',
    '@prisma/adapter-libsql'
  ],
  webpack: (config, { isServer }) => {
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
    }
    
    // More comprehensive approach to ignore non-JS files
    config.module.rules.push(
      {
        test: /\.(md|txt|LICENSE|CHANGELOG)$/i,
        use: 'raw-loader',
      },
      {
        test: /README\.md$/i,
        use: 'raw-loader',
      }
    )
    
    // Ignore specific problematic directories
    config.plugins.push(
      new (require('webpack')).IgnorePlugin({
        resourceRegExp: /\.(md|txt|LICENSE|CHANGELOG)$/i,
        contextRegExp: /node_modules/,
      })
    )
    
    return config
  },
}

module.exports = nextConfig