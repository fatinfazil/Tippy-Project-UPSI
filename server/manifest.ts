import { launchPathFor, manifestHrefFor } from '../src/pwa/userId.ts';

/**
 * Branding shared by the dynamic manifest and the static one in vite.config.ts.
 * Keep the two in sync so an installed icon looks identical either way.
 *
 * `orientation`/`display` intentionally match the game: the whole story stage is
 * landscape-only, and fullscreen is preferred where the platform supports it
 * (iOS ignores `fullscreen` and falls back to `standalone`).
 */
export const MANIFEST_BRANDING = {
  name: 'Tippy Wira Hijau',
  short_name: 'Tippy',
  description:
    'An interactive climate adventure storybook for children aged 4-8.',
  lang: 'en',
  theme_color: '#10b981',
  background_color: '#020617',
  orientation: 'landscape',
} as const;

/**
 * Every URL must be root-absolute. The manifest is served from /api/manifest,
 * so relative icon paths would resolve against /api/ and 404.
 */
const ICONS = [
  { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
  { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
  {
    src: '/maskable-512x512.png',
    sizes: '512x512',
    type: 'image/png',
    purpose: 'maskable',
  },
];

/**
 * Per-child Web App Manifest.
 *
 * `id` MUST be unique per access_code so Chrome/Android can install multiple
 * Tippy apps on one device. Scope stays `/` so the SPA can load shared assets.
 */
export function buildManifest(accessCode: string, nickname?: string | null) {
  const label = (nickname ?? '').trim() || accessCode;
  const shortName =
    label.length <= 12 ? label : `${label.slice(0, 11)}…`;

  return {
    id: `/tippy/${accessCode}`,
    name: `Tippy – ${label}`,
    short_name: shortName,
    description: MANIFEST_BRANDING.description,
    lang: MANIFEST_BRANDING.lang,
    theme_color: MANIFEST_BRANDING.theme_color,
    background_color: MANIFEST_BRANDING.background_color,
    orientation: MANIFEST_BRANDING.orientation,
    start_url: launchPathFor(accessCode),
    scope: '/',
    display: 'standalone',
    display_override: ['fullscreen', 'standalone'],
    icons: ICONS,
  };
}

const MANIFEST_LINK_PATTERN = /<link\b[^>]*\brel=["']manifest["'][^>]*>/i;

/**
 * Points the install page at the per-child manifest. The built index.html
 * already carries the generic <link rel="manifest"> emitted by vite-plugin-pwa,
 * which would otherwise win and hand iOS a start_url of "/".
 */
export function injectManifestLink(html: string, accessCode: string): string {
  const link = `<link rel="manifest" href="${manifestHrefFor(accessCode)}" />`;

  if (MANIFEST_LINK_PATTERN.test(html)) {
    return html.replace(MANIFEST_LINK_PATTERN, link);
  }
  if (html.includes('</head>')) {
    return html.replace('</head>', `    ${link}\n  </head>`);
  }
  return html;
}
