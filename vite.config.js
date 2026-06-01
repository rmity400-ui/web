import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite'; 
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),        // ត្រូវដាក់មួយនេះផង
    tailwindcss(), 
  ],
});