import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { createHtmlPlugin } from 'vite-plugin-html';
import Path from 'path';

const PATHS = {
  output: Path.join(__dirname, './dist'),
  source: Path.join(__dirname, './src'),
  fixed: '/',
};

// https://vitejs.dev/config/
export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  return defineConfig({
    root: PATHS.source,
    base: PATHS.fixed,
    publicDir: 'assets',
    plugins: [
      react(),
      svgr(),
      createHtmlPlugin({
        minify: true,
        /**
         * After writing entry here, you will not need to add script tags in `index.html`, the original tags need to be deleted
         * @default /app/App.tsx
         */
        entry: '/app/App.tsx',
        /**
         * If you want to store `index.html` in the specified folder, you can modify it, otherwise no configuration is required
         * @default index.html
         */
        template: 'index.html',
      }),
    ],
    define: {
      'process.env.APP_ENV': JSON.stringify(process.env.VITE_APP_ENV),
      'process.env.API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL),
    },
    resolve: {
      alias: {
        '@app': Path.resolve(__dirname, './src/app'),
        '@config': Path.resolve(__dirname, './src/config'),
        '@stylesheet': Path.resolve(__dirname, './src/stylesheet'),
        '@shared': Path.resolve(__dirname, './src/app/shared'),
        '@core': Path.resolve(__dirname, './src/app/core'),
        '@assets': Path.resolve(__dirname, './src/assets'),
      },
    },
    build: {
      // Specify the dist folder
      outDir: PATHS.output,
    },
  });
};
