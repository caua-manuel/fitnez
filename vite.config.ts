import { defineConfig, loadEnv } from 'vite';
import { resolveBasePath } from './scripts/base-path.ts';
import { pwaBuild } from './src/pwa/build.ts';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: resolveBasePath({ ...env, ...process.env }),
    plugins: [pwaBuild(), {
      name: 'treino12-csp-producao',
      apply: 'build',
      transformIndexHtml() {
        return [{
          tag: 'meta',
          attrs: {
            'http-equiv': 'Content-Security-Policy',
            content: "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'",
          },
          injectTo: 'head-prepend',
        }];
      },
    }],
    build: { target: 'safari16', cssTarget: 'safari16', sourcemap: false },
    server: { host: '0.0.0.0', port: 5173, strictPort: true },
    preview: { host: '0.0.0.0', port: 4173, strictPort: true },
  };
});



