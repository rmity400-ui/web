import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite'; // ត្រូវប្រាកដថាបាន install package នេះ

export default defineConfig({
  plugins: [
    tailwindcss(), // ដាក់វាចូលត្រង់នេះ
  ],
});