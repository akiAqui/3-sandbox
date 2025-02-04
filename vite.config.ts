import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,  // 0.0.0.0 を許可
    port: 5173   // ポートを固定
  }
});

