import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
const externalDeps = ['keytar']

export default defineConfig(async ({ command }) => {
  const isDev = command === 'serve'
  let httpsOptions: { key: string; cert: string } | undefined

  if (isDev) {
    const devcert = await import('devcert')
    const ssl = await devcert.default.certificateFor('localhost')
    httpsOptions = { key: ssl.key, cert: ssl.cert }
  }

  return {
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, 'shared'),
      },
    },
    server: {
      host: 'localhost',
      port: 4350,
      https: httpsOptions,
    },
    plugins: [
      react(),
      electron({
        main: {
          entry: 'electron/main.ts',
          vite: {
            build: {
              rollupOptions: {
                external: externalDeps,
              },
            },
          },
        },
        preload: {
          input: path.join(__dirname, 'electron/preload.ts'),
          vite: {
            build: {
              rollupOptions: {
                external: externalDeps,
              },
            },
          },
        },
        // Ployfill the Electron and Node.js API for Renderer process.
        // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
        // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
        renderer: process.env.NODE_ENV === 'test'
          // https://github.com/electron-vite/vite-plugin-electron-renderer/issues/78#issuecomment-2053600808
          ? undefined
          : {},
      }),
    ],
  }
})
