import { execSync, spawn } from 'child_process'
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { tmpdir } from 'os'
import consola from 'consola'
import pc from 'picocolors'
import express from 'express'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Start PRADA standalone server
 */
export async function startServer(options) {
  const { databaseUrl, port = 3000, host = 'localhost', open = true } = options

  // Create temp directory for Prisma files
  const tempDir = join(tmpdir(), `.prada-${Date.now()}`)
  mkdirSync(tempDir, { recursive: true })

  // Cleanup on exit
  const cleanup = () => {
    try {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true })
      }
    } catch {
      // Ignore cleanup errors
    }
  }

  process.on('SIGINT', () => {
    console.log(pc.dim('\n\nShutting down...'))
    cleanup()
    process.exit(0)
  })
  process.on('SIGTERM', cleanup)
  process.on('exit', cleanup)

  // Step 1: Detect Prisma version and introspect database
  consola.start('Connecting to database...')

  const schemaPath = join(tempDir, 'schema.prisma')
  const clientOutput = join(tempDir, 'client')

  // Prisma 6.x schema format - works reliably
  // We use npx prisma@6 to ensure compatibility
  writeFileSync(schemaPath, `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  output   = "${clientOutput}"
}
`)

  // Always use Prisma 6 for reliability (Prisma 7 has breaking changes with config)
  const prismaCmd = 'npx prisma@6'

  try {
    execSync(`${prismaCmd} db pull --schema="${schemaPath}"`, {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'pipe',
      cwd: tempDir
    })
    consola.success('Connected to database')
  } catch (error) {
    const stderr = error.stderr?.toString() || error.message
    if (stderr.includes('P1001')) {
      throw new Error('Cannot reach database server. Check if the database is running.')
    }
    if (stderr.includes('P1003')) {
      throw new Error('Database does not exist.')
    }
    if (stderr.includes('authentication')) {
      throw new Error('Authentication failed. Check username and password.')
    }
    throw new Error(`Database introspection failed: ${stderr}`)
  }

  // Step 2: Generate Prisma Client
  consola.start('Generating Prisma client...')

  try {
    execSync(`${prismaCmd} generate --schema="${schemaPath}"`, {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'pipe',
      cwd: tempDir
    })
    consola.success('Prisma client generated')
  } catch (error) {
    throw new Error(`Prisma generate failed: ${error.message}`)
  }

  // Step 3: Load Prisma Client dynamically
  consola.start('Loading database schema...')

  let prisma
  try {
    const clientPath = join(tempDir, 'client', 'index.js')
    const { PrismaClient } = await import(clientPath)
    prisma = new PrismaClient({
      datasources: {
        db: { url: databaseUrl }
      }
    })
    await prisma.$connect()
    consola.success('Database schema loaded')
  } catch (error) {
    throw new Error(`Failed to initialize Prisma client: ${error.message}`)
  }

  // Step 4: Parse schema for PRADA
  consola.start('Initializing admin panel...')

  const { parseSchema } = await import('@blysspeak/prada-core')
  const { createPradaServer } = await import('@blysspeak/prada-server')

  const schema = await parseSchema(schemaPath)

  // Step 5: Create Express server
  const app = express()

  // Use current working directory for config storage
  const cwd = process.cwd()

  const pradaRouter = await createPradaServer({
    prisma,
    schemaPath,
    models: {},
    cwd  // Pass cwd for credentials storage
  })

  app.use('/admin', pradaRouter)
  app.get('/', (req, res) => res.redirect('/admin'))

  consola.success('Admin panel initialized')

  // Step 6: Start server
  return new Promise((resolve, reject) => {
    const server = app.listen(port, host, () => {
      const url = `http://${host}:${port}/admin`

      console.log('')
      consola.box({
        title: pc.bold(pc.green('PRADA is running!')),
        message: [
          `${pc.dim('Admin Panel:')} ${pc.cyan(pc.underline(url))}`,
          `${pc.dim('Database:')}    ${pc.dim(maskPassword(databaseUrl))}`,
          `${pc.dim('Tables:')}      ${pc.white(schema.models.length)}`,
          '',
          pc.dim('Press Ctrl+C to stop')
        ].join('\n')
      })

      // Open browser
      if (open) {
        openBrowser(url)
      }

      resolve(server)
    })

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        reject(new Error(`Port ${port} is already in use. Try --port <other-port>`))
      } else {
        reject(error)
      }
    })
  })
}

/**
 * Mask password in database URL for display
 */
function maskPassword(url) {
  try {
    const parsed = new URL(url)
    if (parsed.password) {
      parsed.password = '****'
    }
    return parsed.toString()
  } catch {
    return url.replace(/:([^:@]+)@/, ':****@')
  }
}

/**
 * Open URL in default browser
 */
function openBrowser(url) {
  const platform = process.platform
  let cmd

  if (platform === 'darwin') {
    cmd = 'open'
  } else if (platform === 'win32') {
    cmd = 'start'
  } else {
    cmd = 'xdg-open'
  }

  try {
    spawn(cmd, [url], { detached: true, stdio: 'ignore' }).unref()
  } catch {
    // Ignore errors opening browser
  }
}

export { startServer as default }
