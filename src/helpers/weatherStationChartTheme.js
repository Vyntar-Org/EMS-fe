export const getChartBase = (mode) => ({
	chart: {
		background: 'transparent',
		toolbar: { show: false },
		fontFamily: 'system-ui, Segoe UI, Roboto, sans-serif',
	},
	theme: { mode },
	grid: {
		borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
		strokeDashArray: 3,
	},
	legend: {
		labels: { colors: mode === 'dark' ? '#94a3b8' : '#64748b' },
		position: 'top',
		horizontalAlign: 'center',
	},
	xaxis: {
		labels: {
			style: {
				colors: mode === 'dark' ? '#94a3b8' : '#64748b',
				fontSize: '11px',
			},
		},
		axisBorder: { show: false },
		axisTicks: { show: false },
	},
	yaxis: {
		labels: {
			style: {
				colors: mode === 'dark' ? '#94a3b8' : '#64748b',
				fontSize: '11px',
			},
		},
	},
	tooltip: { theme: mode },
});

export function mergeChartOptions(mode, overrides = {}) {
	const base = getChartBase(mode);
	return {
		...base,
		...overrides,
		chart: { ...base.chart, ...overrides.chart },
		grid: { ...base.grid, ...overrides.grid },
		legend: { ...base.legend, ...overrides.legend },
		xaxis: { ...base.xaxis, ...overrides.xaxis },
		tooltip: { ...base.tooltip, ...overrides.tooltip },
		yaxis: overrides.yaxis ?? base.yaxis,
	};
}

/** Avoid legend vs toolbar overlap on narrow viewports (xs/sm). */
export function getResponsiveChartLayout(breakpoint) {
	const isNarrow = breakpoint === 'xs' || breakpoint === 'sm';
	if (!isNarrow) {
		return {};
	}

	return {
		legend: {
			position: 'bottom',
			horizontalAlign: 'center',
			offsetY: 4,
			fontSize: '11px',
			itemMargin: { horizontal: 10, vertical: 2 },
		},
		chart: {
			toolbar: {
				offsetX: -6,
				offsetY: 2,
			},
		},
	};
}
