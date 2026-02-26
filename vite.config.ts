
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/echarts')) return 'vendor-echarts';
          if (id.includes('node_modules/lucide-vue-next')) return 'vendor-icons';
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
