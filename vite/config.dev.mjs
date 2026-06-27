import { defineConfig } from 'vite';
import viteString from 'vite-plugin-string';

export default defineConfig({
    build: {
        assetsInlineLimit: 2097152,
        sourcemap: false
    },
    server: {
        port: 8080
    },
    plugins: [
        viteString({
            compress: false,
            include: [ "**/*.atlas", "**/*.xml" ] // This will inline all Spine Atlas files and XML files as strings
        })
    ]
});
