/**
 * Custom Next.js Server
 * 
 * This is a custom server implementation for Intellego Platform.
 * It provides additional server-side control over the Next.js application.
 * 
 * Usage:
 * - npm run dev-custom: Start development server using this custom server
 * - npm run dev: Use standard Next.js dev server (recommended for development)
 * 
 * Note: For production deployment on Vercel, this custom server is not used.
 * Vercel uses its own serverless infrastructure.
 */

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})