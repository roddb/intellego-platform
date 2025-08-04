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
      new (require('webpack')).IgnorePlugin({
        resourceRegExp: /\.(md|txt|LICENSE|CHANGELOG)$/i,
        contextRegExp: /node_modules\/@libsql/,
      })
    )
    
    return config
  },
}

module.exports = nextConfig