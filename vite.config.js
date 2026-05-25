import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite'; // ត្រូវប្រាកដថាបាន install package នេះ
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [
    tailwindcss(), // ដាក់វាចូលត្រង់នេះ
  ],
});