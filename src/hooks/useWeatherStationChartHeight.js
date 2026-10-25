import { useMediaQuery, useTheme } from '@mui/material';

/**
 * Responsive chart height + breakpoint key (remount charts on layout change).
 * @param {{ xs?: number, sm?: number, md?: number, lg?: number }} sizes
 * @returns {{ height: number, breakpoint: 'xs' | 'sm' | 'md' | 'lg' }}
 */
export function useChartHeight(sizes = {}) {
	const { xs = 240, sm = 260, md = 280, lg = 300 } = sizes;
	const theme = useTheme();
	const upLg = useMediaQuery(theme.breakpoints.up('lg'));
	const upMd = useMediaQuery(theme.breakpoints.up('md'));
	const upSm = useMediaQuery(theme.breakpoints.up('sm'));

	if (upLg) {
		return { height: lg, breakpoint: 'lg' };
	}
	if (upMd) {
		return { height: md, breakpoint: 'md' };
	}
	if (upSm) {
		return { height: sm, breakpoint: 'sm' };
	}
	return { height: xs, breakpoint: 'xs' };
}

export function useMapHeight() {
	return useChartHeight({ xs: 260, sm: 300, md: 320, lg: 360 });
}
