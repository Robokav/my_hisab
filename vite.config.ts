
import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    // This maps the terminal environment variable to your code
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || process.env.GEMINI_API_KEY || ''),
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true
  }
});
