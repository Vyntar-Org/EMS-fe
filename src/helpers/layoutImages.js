import { alpha } from '@mui/material/styles';

import { DARK } from '../theme/colors';

/**
 * Per-application layout background images.
 *
 * Convention: public/assets/{APP_CODE}-LAYOUT-IMAGES/{section}.svg|png
 *   section: header | sidebar | main
 *
 * One artwork set serves both themes. In dark mode a deep-navy tint is
 * layered over header/main (their artwork is light) so those surfaces read
 * dark while the artwork still hints through; the sidebar is already navy
 * and never gets a tint. When no app is selected (or the app has no
 * folder), DEFAULT-LAYOUT-IMAGES is used — layers stack svg → png →
 * default, so whichever file exists wins.
 *
 * To add artwork for a new application, create
 * public/assets/{APP_CODE}-LAYOUT-IMAGES/ with main, header and sidebar
 * images (.svg preferred, .png also supported) — no code change needed.
 */

const darkTint = (section) => {
	if (section === 'sidebar') {
		return null;
	}
	const base =
		section === 'header' ? DARK.background.paper : DARK.background.default;
	return `linear-gradient(${alpha(base, 0.93)}, ${alpha(base, 0.93)})`;
};

export const getLayoutImage = (section, appCode, mode = 'light') => {
	const defaults = [
		`url("/assets/DEFAULT-LAYOUT-IMAGES/${section}.svg")`,
		`url("/assets/DEFAULT-LAYOUT-IMAGES/${section}.png")`,
	];
	const tint = mode === 'dark' ? darkTint(section) : null;
	const folder = appCode
		? `/assets/${appCode.toUpperCase()}-LAYOUT-IMAGES`
		: null;
	const appLayers = folder
		? [`url("${folder}/${section}.svg")`, `url("${folder}/${section}.png")`]
		: [];
	return [tint, ...appLayers, ...defaults].filter(Boolean).join(', ');
};

export const layoutBackgroundSx = (section, appCode, mode = 'light') => ({
	backgroundImage: getLayoutImage(section, appCode, mode),
	backgroundSize: 'cover',
	backgroundPosition: 'center',
	backgroundRepeat: 'no-repeat',
});
