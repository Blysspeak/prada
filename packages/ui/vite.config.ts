import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const isLibrary = mode === 'library'

  return {
    plugins: [react()],
    base: '/admin/',
    resolve: {
      alias: {
        '@': resolve(__dirname, './src')
      }
    },
    build: isLibrary
      ? {
          // Library mode - for npm package
          lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'PradaUI',
            formats: ['es'],
            fileName: 'index'
          },
          outDir: 'dist/lib',
          rollupOptions: {
            external: [
              'react',
              'react-dom',
              'react-router-dom',
              '@tanstack/react-query',
              '@tanstack/react-table',
              'react-hook-form',
              'zod',
              'clsx',
              'tailwind-merge',
              'lucide-react'
            ],
            output: {
              globals: {
                react: 'React',
                'react-dom': 'ReactDOM'
              }
            }
          }
        }
      : {
          // App mode - for serving as static files
          outDir: 'dist',
          emptyOutDir: true
        },
    server: {
      proxy: {
        '/admin/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/admin/, '')
        }
      }
    }
  }
})
