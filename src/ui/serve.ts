/**
 * UI Serving
 *
 * Utilities for serving the PRADA UI static files.
 */

import { resolve, dirname } from 'path'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { static as expressStatic, type Router, type Request, type Response } from 'express'

/**
 * Resolve the path to UI static files
 *
 * @param customPath - Custom path to UI files (optional)
 * @returns Resolved path to UI static files
 *
 * @example
 * ```typescript
 * const uiPath = await resolveUIPath()
 * app.use(express.static(uiPath))
 * ```
 */
export async function resolveUIPath(customPath?: string): Promise<string> {
  if (customPath) {
    return resolve(customPath)
  }

  try {
    // In npm: resolve from @blysspeak/prada-ui package
    const uiPkg = await import.meta.resolve('@blysspeak/prada-ui')
    return resolve(dirname(fileURLToPath(uiPkg)), 'dist')
  } catch {
    // In workspace: use relative path from this file
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    return resolve(__dirname, '../../packages/ui/dist')
  }
}

/**
 * Create middleware to serve UI static files and handle SPA routing
 *
 * @param staticPath - Path to UI static files
 * @returns Express middleware for serving static files
 *
 * @example
 * ```typescript
 * const uiPath = await resolveUIPath()
 * app.use(serveUI(uiPath))
 * ```
 */
export function serveUI(staticPath: string) {
  const staticMiddleware = expressStatic(staticPath)

  return function uiMiddleware(req: Request, res: Response, next: () => void) {
    // First try to serve static file
    staticMiddleware(req, res, () => {
      // If not found and not an API route, serve index.html for SPA routing
      if (!req.path.startsWith('/api')) {
        return res.sendFile(resolve(staticPath, 'index.html'))
      }
      next()
    })
  }
}

/**
 * Create a catch-all route handler for SPA routing
 *
 * @param staticPath - Path to UI static files
 * @returns Express route handler
 *
 * @example
 * ```typescript
 * router.get('*', createSpaHandler(uiPath))
 * ```
 */
export function createSpaHandler(staticPath: string) {
  return function spaHandler(req: Request, res: Response) {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not found' })
    }
    res.sendFile(resolve(staticPath, 'index.html'))
  }
}

/**
 * Check if UI static files exist
 *
 * @param path - Path to check
 * @returns True if path exists
 */
export function uiFilesExist(path: string): boolean {
  return existsSync(path) && existsSync(resolve(path, 'index.html'))
}
