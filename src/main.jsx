import React, { useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ThemeProvider, CssBaseline, GlobalStyles } from '@mui/material';
import { setChartThemeMode } from './helpers/chartConfig';
import { buildTheme } from './theme';
import { LIGHT } from './theme/colors';
import {
	ThemeModeProvider,
	useThemeMode,
} from './contexts/ThemeModeContext.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'leaflet/dist/leaflet.css';

// Global ApexCharts defaults: zooming is disabled app-wide (mouse-wheel
// zoom hijacked page scrolling) and toolbars only offer the download menu.
// Per-chart options can still override these when truly needed.
window.Apex = {
	chart: {
		zoom: { enabled: false },
		toolbar: {
			tools: {
				download: true,
				selection: false,
				zoom: false,
				zoomin: false,
				zoomout: false,
				pan: false,
				reset: false,
			},
		},
	},
};

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
		},
	},
});

// ApexCharts renders its own SVG/HTML with colors baked into each chart's
// option object. These global overrides re-skin every chart to the active
// theme (axis labels, legends, grids, menus) without touching chart code.
// Tooltips intentionally stay light in both modes: custom tooltip HTML uses
// inline status colors (green/red) that are tuned for a light card.
// Analytics section panel backgrounds (used via UNIQUE_PASTEL_BGS in
// src/constants/energyAnalytics.js). Light mode: original soft pastels;
// dark mode: subtle navy tints so panels and the inputs on them stay legible.
const ANALYTICS_PANEL_VARS = {
	light: ['#f4f8fa', '#f7f5fa', '#faf8f5', '#f5faf6', '#faf5f5', '#fbfaf4'],
	dark: ['#18233C', '#1C2140', '#221F3A', '#182B38', '#251F35', '#212A3B'],
};

const chartGlobalStyles = (theme) => {
	const isDark = theme.palette.mode === 'dark';
	const scrollThumb = isDark
		? 'rgba(255, 255, 255, 0.28)'
		: 'rgba(0, 51, 102, 0.35)';
	const scrollThumbHover = isDark
		? 'rgba(245, 213, 71, 0.75)'
		: 'rgba(0, 51, 102, 0.6)';

	return {
		// Premium thin scrollbars, themed for both modes
		'*': {
			scrollbarWidth: 'thin',
			scrollbarColor: `${scrollThumb} transparent`,
		},
		'*::-webkit-scrollbar': {
			width: '6px',
			height: '6px',
		},
		'*::-webkit-scrollbar-track': {
			background: 'transparent',
		},
		'*::-webkit-scrollbar-thumb': {
			backgroundColor: scrollThumb,
			borderRadius: '999px',
			'&:hover': {
				backgroundColor: scrollThumbHover,
			},
		},
		'*::-webkit-scrollbar-corner': {
			background: 'transparent',
		},
		':root': Object.fromEntries(
			ANALYTICS_PANEL_VARS[
				theme.palette.mode === 'dark' ? 'dark' : 'light'
			].map((color, i) => [`--analytics-panel-${i}`, color])
		),
		'.apexcharts-text, .apexcharts-text tspan': {
			fill: `${theme.palette.text.secondary} !important`,
		},
		'.apexcharts-title-text, .apexcharts-datalabel-value': {
			fill: `${theme.palette.text.primary} !important`,
		},
		'.apexcharts-datalabel-label': {
			fill: `${theme.palette.text.secondary} !important`,
		},
		'.apexcharts-legend-text': {
			color: `${theme.palette.text.secondary} !important`,
		},
		'.apexcharts-gridline, .apexcharts-xaxis-tick': {
			stroke: `${theme.palette.divider} !important`,
		},
		'.apexcharts-grid-borders line, .apexcharts-xaxis line, .apexcharts-yaxis line':
			{
				stroke: `${theme.palette.divider} !important`,
			},
		'.apexcharts-tooltip': {
			background: `${LIGHT.background.paper} !important`,
			color: `${LIGHT.text.primary} !important`,
			border: `1px solid ${LIGHT.divider} !important`,
			boxShadow: '0 8px 24px rgba(15, 35, 62, 0.18) !important',
		},
		'.apexcharts-tooltip-title': {
			background: `${LIGHT.surface.muted} !important`,
			color: `${LIGHT.text.primary} !important`,
			borderBottom: `1px solid ${LIGHT.divider} !important`,
		},
		'.apexcharts-xaxistooltip, .apexcharts-yaxistooltip': {
			background: `${theme.palette.background.paper} !important`,
			color: `${theme.palette.text.primary} !important`,
			border: `1px solid ${theme.palette.divider} !important`,
		},
		'.apexcharts-menu': {
			background: `${theme.palette.background.paper} !important`,
			color: `${theme.palette.text.primary} !important`,
			border: `1px solid ${theme.palette.divider} !important`,
		},
		'.apexcharts-menu-item:hover': {
			background: `${theme.palette.action.hover} !important`,
		},
	};
};

const ThemedApp = () => {
	const { mode } = useThemeMode();
	const theme = useMemo(() => {
		// Sync the chart palette before the tree re-renders so every chart
		// option object built during this render uses the right colors.
		setChartThemeMode(mode);
		return buildTheme(mode);
	}, [mode]);

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<GlobalStyles styles={chartGlobalStyles} />
			<App />
		</ThemeProvider>
	);
};

ReactDOM.createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<ThemeModeProvider>
				<ThemedApp />
			</ThemeModeProvider>
		</QueryClientProvider>
	</React.StrictMode>
);
