const SECTIONS = ['sidebar', 'header', 'main'];

// Assets shared across the whole app
const STATIC_ASSETS = [
	'/assets/vyntar-logo-full.png',
	'/assets/vyntar-logo-icon-removebg.png',
	'/assets/no-data.gif',
	'/assets/login-bg-day.png',
	'/assets/login-bg-night.png',
];

let preloadedKey = '';

/**
 * Warm the browser cache with every layout background (all applications the
 * user can switch to, plus DEFAULT) and the shared static assets, so app
 * switching and theme toggling never flash unstyled surfaces.
 *
 * Idempotent per app-code set — safe to call on every render.
 */
export const preloadAppImages = (appCodes = [], extraUrls = []) => {
	const folders = [
		'DEFAULT',
		...appCodes.map((code) => code?.toUpperCase()).filter(Boolean),
	];
	const key = folders.join('|');
	if (preloadedKey === key) {
		return;
	}
	preloadedKey = key;

	const urls = new Set([...STATIC_ASSETS, ...extraUrls.filter(Boolean)]);
	folders.forEach((folder) => {
		SECTIONS.forEach((section) => {
			urls.add(`/assets/${folder}-LAYOUT-IMAGES/${section}.svg`);
		});
	});

	urls.forEach((src) => {
		const img = new Image();
		img.decoding = 'async';
		img.src = src;
	});
};
