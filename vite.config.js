/**
 * vite.config.js
 * 
 * Configuración de Vite para Nokia Soccer League
 * Define el entry point del proyecto y opciones de servidor
 */

import { defineConfig } from 'vite';

export default defineConfig({
  root: './',           // Raíz del proyecto
  publicDir: 'public',  // Carpeta pública (index.html)
  
  // Configuración del servidor de desarrollo
  server: {
    port: 5173,
    host: 'localhost',
    open: true,         // Abre navegador automáticamente
    strictPort: false,  // Si 5173 está ocupado, usa otro puerto
  },
  
  // Configuración de compilación
  build: {
    outDir: 'dist',
    sourcemap: true,
    emptyOutDir: true,
  },
  
  // Configuración de módulos
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});

