#!/usr/bin/env node

import { defineCommand, runMain } from 'citty'
import consola from 'consola'
import pc from 'picocolors'
import { startServer } from './index.js'

// ASCII Art Logo
const logo = `
${pc.magenta('╔═════════════════════════════════════════════╗')}
${pc.magenta('║')}  ${pc.bold(pc.magenta('P'))}${pc.bold(pc.magenta('R'))}${pc.bold(pc.cyan('A'))}${pc.bold(pc.cyan('D'))}${pc.bold(pc.cyan('A'))}  ${pc.dim('Fast admin for your projects')}  ${pc.cyan('║')}
${pc.cyan('╚═════════════════════════════════════════════╝')}
`

const main = defineCommand({
  meta: {
    name: 'prada',
    version: '1.0.0',
    description: 'PRADA - Universal admin panel for PostgreSQL databases'
  },
  args: {
    databaseUrl: {
      type: 'positional',
      description: 'PostgreSQL connection URL',
      required: false
    },
    port: {
      type: 'string',
      alias: 'p',
      description: 'Server port',
      default: '3000'
    },
    host: {
      type: 'string',
      alias: 'H',
      description: 'Server host',
      default: 'localhost'
    },
    open: {
      type: 'boolean',
      description: 'Open browser automatically',
      default: true
    }
  },
  async run({ args }) {
    console.log(logo)

    // Get database URL from argument or environment
    const dbUrl = args.databaseUrl || process.env.DATABASE_URL || process.env.PRADA_DATABASE_URL

    if (!dbUrl) {
      consola.error('Database URL is required\n')
      console.log(pc.dim('Usage:'))
      console.log(pc.cyan('  prada "postgresql://user:password@localhost:5432/database"'))
      console.log(pc.dim('\nOr set environment variable:'))
      console.log(pc.cyan('  DATABASE_URL="postgresql://..." prada'))
      process.exit(1)
    }

    // Validate URL format
    if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
      consola.error('Invalid database URL format')
      console.log(pc.dim('Expected: postgresql://user:password@host:port/database'))
      process.exit(1)
    }

    try {
      await startServer({
        databaseUrl: dbUrl,
        port: parseInt(args.port),
        host: args.host,
        open: args.open
      })
    } catch (error) {
      consola.error(error.message)
      if (process.env.DEBUG) {
        console.error(error.stack)
      }
      process.exit(1)
    }
  }
})

runMain(main)
