/**
 * Verifies the personalized PWA install flow against a running server.
 *
 *   npm run build && npm start          # Express on :3001
 *   npm run verify:pwa                  # in a second shell
 *
 * Override the target with: node scripts/verify-pwa.mjs https://tippy.my
 */

const BASE = (process.argv[2] ?? 'http://localhost:3001').replace(/\/$/, '');
const ACCESS_CODE = 'AB7K2';

let failures = 0;

function check(name, ok, detail) {
  const status = ok ? 'PASS' : 'FAIL';
  console.log(`${status}  ${name}${!ok && detail ? `\n        ${detail}` : ''}`);
  if (!ok) failures += 1;
}

async function verifyManifest() {
  const res = await fetch(`${BASE}/api/manifest?access_code=${ACCESS_CODE}`);
  check('manifest responds 200', res.status === 200, `got ${res.status}`);

  const contentType = res.headers.get('content-type') ?? '';
  check(
    'Content-Type is application/manifest+json',
    contentType.includes('application/manifest+json'),
    `got "${contentType}"`,
  );

  const cacheControl = res.headers.get('cache-control') ?? '';
  check(
    'Cache-Control is no-store',
    cacheControl.includes('no-store'),
    `got "${cacheControl}"`,
  );

  const manifest = await res.json();
  check(
    `start_url is /launch/${ACCESS_CODE}`,
    manifest.start_url === `/launch/${ACCESS_CODE}`,
    `got "${manifest.start_url}"`,
  );
  check(
    `id is unique per child (/tippy/${ACCESS_CODE})`,
    manifest.id === `/tippy/${ACCESS_CODE}`,
    `got "${manifest.id}"`,
  );
  check('display is standalone', manifest.display === 'standalone', `got "${manifest.display}"`);
  check('scope is /', manifest.scope === '/', `got "${manifest.scope}"`);
  check(
    'name is personalized (Tippy – …)',
    typeof manifest.name === 'string' && manifest.name.startsWith('Tippy'),
    `got "${manifest.name}"`,
  );
  check(
    'all URLs are root-absolute',
    [manifest.start_url, manifest.scope, ...manifest.icons.map((i) => i.src)].every(
      (url) => url.startsWith('/'),
    ),
    'a relative URL would resolve against /api/ and 404',
  );

  return manifest;
}

async function verifyRejectsBadIds() {
  for (const bad of ['bad!id', 'ab', 'has space', '']) {
    const res = await fetch(
      `${BASE}/api/manifest?access_code=${encodeURIComponent(bad)}`,
    );
    check(`rejects invalid access_code "${bad}"`, res.status === 400, `got ${res.status}`);
  }
}

async function verifyInstallPage() {
  const res = await fetch(`${BASE}/u/${ACCESS_CODE}`);
  check('install page responds 200', res.status === 200, `got ${res.status}`);

  const html = await res.text();
  check(
    'install page links the dynamic manifest',
    html.includes(`/api/manifest?access_code=${ACCESS_CODE}`),
    'no per-child <link rel="manifest"> in the served HTML',
  );
  check(
    'install page does not link the generic manifest',
    !html.includes('manifest.webmanifest'),
    'the static manifest would override the per-child one',
  );
  check(
    'install page declares apple-mobile-web-app-capable',
    html.includes('apple-mobile-web-app-capable'),
    'missing iOS standalone meta tag',
  );
}

async function verifyStatus() {
  const res = await fetch(`${BASE}/api/status`);
  check('status responds 200', res.status === 200, `got ${res.status}`);

  const body = await res.json();
  check(
    'status.maintenance is a boolean',
    typeof body.maintenance === 'boolean',
    `got ${JSON.stringify(body.maintenance)}`,
  );
  if (body.maintenance === true) {
    check(
      'site is not in maintenance (turn MAINTENANCE off to verify PWA)',
      false,
      'MAINTENANCE is on; other install checks will 503',
    );
  }
}

async function verifyIcons(manifest) {
  for (const icon of manifest.icons) {
    const res = await fetch(`${BASE}${icon.src}`, { method: 'GET' });
    check(`icon exists: ${icon.src}`, res.status === 200, `got ${res.status}`);
  }
}

async function main() {
  console.log(`Verifying Tippy PWA install flow at ${BASE}\n`);

  try {
    await verifyStatus();
    const manifest = await verifyManifest();
    await verifyRejectsBadIds();
    await verifyInstallPage();
    await verifyIcons(manifest);
  } catch (error) {
    console.error(`\nCould not reach ${BASE}. Is the server running?`);
    console.error(error.message);
    process.exit(1);
  }

  console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

void main();
