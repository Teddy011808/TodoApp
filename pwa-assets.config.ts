import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Generates every icon the manifest and iOS need from one source SVG:
// pwa-64x64, pwa-192x192, pwa-512x512, maskable-icon-512x512,
// apple-touch-icon-180x180 and favicon.ico.  Run: npm run generate-pwa-assets
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0, resizeOptions: { background: '#0f1115' } },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background: '#0f1115' } },
  },
  images: ['public/pwa-icon.svg'],
})
