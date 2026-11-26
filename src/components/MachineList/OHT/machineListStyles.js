import { Box } from '@mui/material';
import { alpha, styled } from '@mui/material/styles';

import { MACHINE_CARD_DESIGN } from '../../common/machineCardDesign';

export const WaterMonitoringMachineGrid = styled(Box)(({ theme }) => ({
	display: 'grid',
	gridTemplateColumns: 'minmax(0, 1fr)',
	gap: theme.spacing(MACHINE_CARD_DESIGN.gridGap),
	[theme.breakpoints.up('sm')]: {
		gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
	},
	[theme.breakpoints.up('md')]: {
		gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
	},
	[theme.breakpoints.up('lg')]: {
		gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
	},
}));

export const MachineListSurface = styled(Box)(
	({ theme }) => `
& {
	display: flex;
	flex-direction: column;
	height: calc(100vh - 56px - 16px);
	min-height: 0;
	min-width: 0;
	container: water-list / inline-size;
	font-family: inherit;
}
${theme.breakpoints.up('sm')} {
	& {
		height: calc(100vh - 64px - 16px);
	}
}
& *,
& [data-water-ui~="machine-card"] * {
	box-sizing: border-box;
}
& [data-water-ui~="machine-card"] {
	--wm-accent: ${theme.palette.info.main};
	--wm-tint: ${alpha(theme.palette.info.main, 0.07)};
	--wm-line: ${alpha(theme.palette.info.main, 0.28)};
	display: flex;
	flex-direction: column;
	min-width: 0;
	width: 100%;
	padding: ${theme.spacing(1.125)};
	border-radius: ${theme.spacing(3.25)};
	border: 1px solid ${alpha(theme.palette.info.main, 0.16)};
	background: ${theme.palette.background.paper};
	box-shadow: 0 8px 24px ${alpha(theme.palette.info.dark, 0.09)};
	transition:
		transform 0.2s,
		box-shadow 0.2s;
}
& [data-water-ui~="machine-card"]:hover {
	transform: translateY(-2px);
	box-shadow: 0 12px 28px ${alpha(theme.palette.info.dark, 0.13)};
}
& [data-water-ui~="card-header"] {
	position: relative;
	display: grid;
	grid-template-columns: 46px minmax(0, 1fr) auto;
	align-items: center;
	gap: ${theme.spacing(1)};
	min-height: 88px;
	padding: ${theme.spacing(1.25)} ${theme.spacing(1)};
	border: 1px solid var(--wm-line);
	border-radius: ${theme.spacing(2.25)};
	background: linear-gradient(120deg, var(--wm-tint), ${
		theme.palette.background.paper
	} 95%);
	overflow: hidden;
}
& [data-water-ui~="card-header"]::after {
	content: '';
	position: absolute;
	right: -25px;
	bottom: -40px;
	width: 150px;
	height: 88px;
	transform: rotate(-14deg);
	background: radial-gradient(circle, var(--wm-line) 1px, transparent 1.5px);
	background-size: 9px 9px;
	pointer-events: none;
	opacity: 0.5;
}
& [data-water-ui~="card-body"] {
	display: flex;
	flex-direction: column;
	flex: 1;
	gap: ${theme.spacing(0.875)};
	padding-top: ${theme.spacing(1)};
	min-width: 0;
}
& [data-water-ui~="instruments"] {
	display: flex;
	flex-direction: column;
	gap: ${theme.spacing(0.875)};
}
& [data-water-ui~="tank-panel"] {
	padding: 0 ${theme.spacing(0.625)};
}
& [data-water-ui~="tank"] {
	display: block;
	height: 85px;
	width: 100%;
	overflow: hidden;
}
& [data-water-ui~="reference-card"]:hover [data-water-ui~="tank"] {
	filter: drop-shadow(0 2px 4px ${alpha(theme.palette.info.main, 0.15)});
}
& [data-water-ui~="tank-wave"] {
	animation: wm-wave 6s linear infinite;
}
& [data-water-ui~="reference-card"]:hover [data-water-ui~="tank-wave"] {
	animation-duration: 3s;
}
& [data-water-ui~="bubble"] {
	animation: wm-bubble 4s ease-in infinite;
}
& [data-water-ui~="tank-glint"] {
	stroke-dasharray: 22 90;
	animation: wm-glass 4s ease-in-out infinite;
}
& [data-water-ui~="measurements"] {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: ${theme.spacing(0.75)};
}
& [data-water-ui~="metric"] {
	position: relative;
	display: flex;
	align-items: flex-start;
	gap: ${theme.spacing(0.75)};
	min-width: 0;
	min-height: 66px;
	padding: ${theme.spacing(1)};
	border: 1px solid ${alpha(theme.palette.info.main, 0.16)};
	border-radius: ${theme.spacing(2)};
	background: ${theme.palette.background.paper};
	box-shadow: 0 3px 10px ${alpha(theme.palette.info.dark, 0.03)};
}
& [data-water-ui~="metric"]::before {
	content: '';
	position: absolute;
	left: 0;
	top: 8px;
	bottom: 8px;
	width: 3px;
	background: ${theme.palette.info.main};
}
& [data-water-ui~="metric"] + [data-water-ui~="metric"]::before {
	background: ${theme.palette.secondary.main};
}
& [data-water-ui~="metric-copy"] {
	min-width: 0;
	overflow-x: auto;
}
& [data-water-ui~="metric-copy"] h3 {
	font-size: ${theme.typography.pxToRem(11)};
	font-weight: 500;
	line-height: 1.3;
	color: ${theme.palette.info.light};
}
& :is([data-water-ui~="machine-card"], [data-water-ui~="reference-card"]) [data-water-ui~="metric-value"] {
	font-size: ${theme.typography.pxToRem(19)};
	font-weight: 600;
	line-height: 1.4;
	white-space: nowrap;
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.3px;
	color: ${theme.palette.text.primary};
}
& :is([data-water-ui~="machine-card"], [data-water-ui~="reference-card"]) [data-water-ui~="metric-unit"] {
	font-size: ${theme.typography.pxToRem(10)};
	color: ${theme.palette.info.light};
	overflow-wrap: anywhere;
}
& [data-water-ui~="status-panel"] {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: ${theme.spacing(1)};
	min-height: 60px;
	padding: ${theme.spacing(1)} ${theme.spacing(1.25)};
	border: 1px solid ${alpha(theme.palette.info.main, 0.16)};
	border-radius: ${theme.spacing(2)};
	background: ${theme.palette.background.paper};
}
& [data-water-ui~="mode-section"],
& [data-water-ui~="motor-section"] {
	display: flex;
	align-items: center;
	min-width: 0;
}
& [data-water-ui~="motor-section"] {
	padding-left: ${theme.spacing(1)};
	border-left: 1px solid ${alpha(theme.palette.info.main, 0.16)};
}
& [data-water-ui~="status-icon"] {
	display: none !important;
}
& [data-water-ui~="machine-card"] [data-water-ui~="status-label"] {
	font-weight: 500;
	color: ${theme.palette.info.light};
	font-size: ${theme.typography.pxToRem(10)};
	margin-bottom: ${theme.spacing(0.5)};
}
& [data-water-ui~="mode-section"] .MuiChip-root {
	height: 22px;
	font-size: ${theme.typography.pxToRem(10)};
	font-weight: 500;
}
& [data-water-ui~="mode-section"] .MuiChip-icon {
	font-size: ${theme.typography.pxToRem(14)};
}
& [data-water-ui~="motor-status"] {
	display: inline-flex;
	align-items: center;
	gap: ${theme.spacing(0.5)};
	padding: ${theme.spacing(0.375)} ${theme.spacing(0.875)};
	border-radius: ${theme.spacing(1.5)};
	background: ${theme.palette.background.paper};
	color: ${theme.palette.info.dark};
	font-size: ${theme.typography.pxToRem(10)};
	white-space: nowrap;
}
& [data-water-ui~="motor-status"] svg {
	font-size: ${theme.typography.pxToRem(13)};
}
& [data-water-ui~="motor-running"] {
	color: ${theme.palette.success.dark};
	background: ${theme.palette.background.paper};
}
& [data-water-ui~="motor-running"]:not([data-water-ui~="motor-preview"]) svg {
	animation: wm-spin 4s linear infinite;
}
& [data-water-ui~="motor-control"] {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: ${theme.spacing(1)};
	min-height: 44px;
	padding: 0 ${theme.spacing(1.25)};
	border: 1px solid ${alpha(theme.palette.info.main, 0.16)};
	border-radius: ${theme.spacing(2)};
	background: ${theme.palette.background.paper};
}
& [data-water-ui~="control-label"] {
	display: flex;
	align-items: center;
	gap: ${theme.spacing(0.75)};
	color: ${theme.palette.info.dark};
}
& [data-water-ui~="control-label"] svg {
	font-size: ${theme.typography.pxToRem(17)};
}
& [data-water-ui~="control-label"] .MuiTypography-root,
& [data-water-ui~="toggle-state"].MuiTypography-root {
	font-size: ${theme.typography.pxToRem(11)};
}
& [data-water-ui~="toggle-target"] {
	display: inline-flex;
	align-items: center;
	gap: ${theme.spacing(0.5)};
	min-height: 44px;
	border-radius: ${theme.spacing(2.5)};
	cursor: not-allowed;
	transition: box-shadow 0.2s;
}
& [data-water-ui~="toggle-state"] {
	min-width: 24px;
	color: ${theme.palette.info.light};
	text-align: right;
}
& [data-water-ui~="toggle-target"] .MuiSwitch-switchBase.Mui-checked.Mui-disabled {
	color: ${theme.palette.info.light};
}
& [data-water-ui~="toggle-target"][data-water-ui~="toggle-enabled"] {
	cursor: pointer;
}
& :is([data-water-ui~="machine-card"], [data-water-ui~="reference-card"]) .MuiButton-root:focus-visible, & [data-water-ui~="toggle-target"]:focus-visible {
	outline: 3px solid ${theme.palette.info.main};
	outline-offset: 2px;
}
& :is([data-water-ui~="machine-card"], [data-water-ui~="reference-card"]) [data-water-ui~="data-warning"] {
	font-size: ${theme.typography.pxToRem(11)};
	color: ${theme.palette.error.dark};
}
& [data-water-ui~="empty-state"] {
	padding: ${theme.spacing(4)} ${theme.spacing(2)};
	text-align: center;
	background: ${alpha(theme.palette.background.paper, 0.93)};
	border: 1px dashed ${alpha(theme.palette.info.main, 0.28)};
	border-radius: ${theme.spacing(2.25)};
}
& [data-water-ui~="skeleton-card"] .MuiSkeleton-root {
	max-width: 100%;
}
@keyframes wm-wave {
	to {
		transform: translateX(-120px);
	}
}
@keyframes wm-bubble {
	0% {
		opacity: 0;
		transform: translateY(0);
	}
	25% {
		opacity: 0.6;
	}
	100% {
		opacity: 0;
		transform: translateY(calc(-1 * var(--bubble-rise)));
	}
}
@keyframes wm-glass {
	from {
		stroke-dashoffset: 112;
		opacity: 0.1;
	}
	50% {
		opacity: 0.65;
	}
	to {
		stroke-dashoffset: -112;
		opacity: 0.1;
	}
}
@keyframes wm-spin {
	to {
		transform: rotate(360deg);
	}
}
@container water-list (max-width: 767px) {
}
@media (prefers-reduced-motion: reduce) {
	& *,
	& [data-water-ui~="machine-card"] * {
		animation: none !important;
		transition: none !important;
	}
	& [data-water-ui~="machine-card"]:hover {
		transform: none;
	}
}
@media (prefers-reduced-motion: reduce) {
	& [data-water-ui~="skeleton-card"] .MuiSkeleton-root::after {
		animation: none !important;
	}
}
& [data-water-ui~="tank"] {
	height: 94px;
}
& [data-water-ui~="motor-control"] {
	min-height: 60px;
	padding: ${theme.spacing(0.75)} ${theme.spacing(1.125)};
	border-radius: ${theme.spacing(1.75)};
	background: linear-gradient(135deg, ${theme.palette.background.paper}, ${
		theme.palette.background.paper
	});
	box-shadow:
		inset 0 1px 0 ${theme.palette.background.paper},
		0 2px 5px ${alpha(theme.palette.info.dark, 0.02)};
}
& [data-water-ui~="control-label"] {
	gap: ${theme.spacing(0.875)};
	min-width: 0;
}
& [data-water-ui~="control-label"] [data-water-ui~="control-motor"] {
	width: 44px;
	height: 36px;
	flex-shrink: 0;
	color: ${theme.palette.info.light};
	filter: drop-shadow(0 2px 1px ${alpha(theme.palette.info.dark, 0.1)});
}
& [data-water-ui~="control-label"] .MuiTypography-root {
	font-weight: 600;
	white-space: nowrap;
	font-size: ${theme.typography.pxToRem(11)};
}
& [data-water-ui~="toggle-target"] {
	gap: ${theme.spacing(0.625)};
	padding-left: ${theme.spacing(0.375)};
}
& [data-water-ui~="toggle-state"].MuiTypography-root {
	display: flex;
	align-items: center;
	gap: ${theme.spacing(0.5)};
	font-size: ${theme.typography.pxToRem(10)};
	font-weight: 600;
}
& [data-water-ui~="control-led"] {
	width: 5px;
	height: 5px;
	border-radius: 50%;
	background: ${theme.palette.info.light};
	box-shadow: inset 0 1px 1px ${alpha(theme.palette.text.primary, 0.13)};
}
& [data-water-ui~="control-running"] [data-water-ui~="control-led"] {
	background: ${theme.palette.success.dark};
	box-shadow: 0 0 4px ${alpha(theme.palette.success.dark, 0.2)};
}
& [data-water-ui~="toggle-target"] [data-water-ui~="industrial-switch"] {
	width: 64px;
	height: 36px;
	padding: 4px;
	overflow: visible;
}
& [data-water-ui~="industrial-switch"] .MuiSwitch-switchBase {
	left: 0;
	right: auto;
	padding: 4px;
	transform: translateX(0);
}
& [data-water-ui~="industrial-switch"] .MuiSwitch-switchBase.Mui-checked {
	transform: translateX(28px);
}
& [data-water-ui~="power-thumb"] {
	display: grid;
	place-items: center;
	box-sizing: border-box;
	width: 28px;
	height: 28px;
	border-radius: 50%;
	background: linear-gradient(${theme.palette.background.paper}, ${
		theme.palette.background.paper
	});
	border: 1px solid ${alpha(theme.palette.info.main, 0.28)};
	box-shadow:
		0 2px 4px ${alpha(theme.palette.info.dark, 0.25)},
		inset 0 1px 0 ${theme.palette.background.paper};
	color: ${theme.palette.info.light};
}
& [data-water-ui~="power-thumb"] svg {
	font-size: ${theme.typography.pxToRem(15)};
}
& [data-water-ui~="industrial-switch"] .Mui-checked [data-water-ui~="power-thumb"] {
	color: ${theme.palette.success.light};
	border-color: ${theme.palette.info.light};
}
& [data-water-ui~="control-rotor"] {
	transform-box: fill-box;
	transform-origin: center;
}
& [data-water-ui~="control-motor-active"] [data-water-ui~="control-rotor"] {
	animation: wm-spin 2s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
	& [data-water-ui~="control-motor-active"] [data-water-ui~="control-rotor"] {
		animation: none;
	}
}
& [data-water-ui~="motor-control"] {
	flex-wrap: wrap;
}
& [data-water-ui~="motor-control"] [data-water-ui~="toggle-target"] {
	margin-left: auto;
}
& [data-water-ui~="motor-running"][data-water-ui~="motor-preview"] > svg {
	animation: wm-spin 5s linear infinite;
}
& [data-water-ui~="control-running"] [data-water-ui~="control-led"] {
	animation: wm-running-glow 2.5s ease-in-out infinite;
}
& [data-water-ui~="status-demo"] {
	font-size: ${theme.typography.pxToRem(9)};
	opacity: 0.8;
	padding-left: ${theme.spacing(0.5)};
	border-left: 1px solid ${alpha(theme.palette.success.dark, 0.2)};
}
@keyframes wm-running-glow {
	50% {
		box-shadow:
			0 0 0 3px ${alpha(theme.palette.success.dark, 0.09)},
			0 0 7px ${alpha(theme.palette.success.dark, 0.33)};
	}
}
@media (prefers-reduced-motion: reduce) {
	& [data-water-ui~="motor-running"][data-water-ui~="motor-preview"] > svg,
	& [data-water-ui~="control-running"] [data-water-ui~="control-led"],
	& [data-water-ui~="control-motor-active"] [data-water-ui~="control-rotor"] {
		animation: none !important;
	}
}
& [data-water-ui~="metric-comparison"] {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: ${theme.spacing(0.375)} ${theme.spacing(0.625)};
	margin-top: ${theme.spacing(0.625)};
}
& [data-water-ui~="change"] {
	display: inline-flex;
	align-items: center;
	gap: ${theme.spacing(0.25)};
	border-radius: ${theme.spacing(0.75)};
	padding: ${theme.spacing(0.25)} ${theme.spacing(0.5)};
	background: ${theme.palette.background.paper};
	color: ${theme.palette.info.light};
	font-size: ${theme.typography.pxToRem(10)};
	white-space: nowrap;
}
& [data-water-ui~="change"] svg {
	font-size: ${theme.typography.pxToRem(13)};
}
& [data-water-ui~="change-up"] {
	color: ${theme.palette.info.dark};
	background: ${theme.palette.background.paper};
}
& [data-water-ui~="change-down"] {
	color: ${theme.palette.error.dark};
	background: ${alpha(theme.palette.info.main, 0.16)};
}
& [data-water-ui~="metric-inline"] {
	justify-content: space-between;
	align-items: center;
	gap: ${theme.spacing(0.625)};
	padding: ${theme.spacing(0.875)} ${theme.spacing(0.875)} ${theme.spacing(
		0.875
	)} ${theme.spacing(1.125)};
	min-height: 58px;
}
& [data-water-ui~="metric-inline"] [data-water-ui~="metric-copy"] {
	flex: 1;
	min-width: 0;
}
& [data-water-ui~="metric-inline"] [data-water-ui~="metric-copy"] h3 {
	line-height: 1.3;
	font-size: ${theme.typography.pxToRem(10)};
	font-weight: 500;
}
& [data-water-ui~="value-line"] {
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: ${theme.spacing(0.375)};
}
& [data-water-ui~="metric-inline"] [data-water-ui~="metric-value"] {
	font-size: ${theme.typography.pxToRem(15)};
	font-weight: 700;
	white-space: nowrap;
}
& [data-water-ui~="metric-inline"] [data-water-ui~="metric-unit"] {
	font-size: ${theme.typography.pxToRem(9)};
	font-weight: 400;
}
& [data-water-ui~="metric-inline"] [data-water-ui~="metric-comparison"] {
	flex: 0 0 auto;
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: ${theme.spacing(0.375)};
	margin: 0;
}
& [data-water-ui~="metric-inline"] [data-water-ui~="change"] {
	border-radius: ${theme.spacing(1.25)};
	gap: ${theme.spacing(0.125)};
	font-size: ${theme.typography.pxToRem(9)};
	font-weight: 400;
	padding: ${theme.spacing(0.375)} ${theme.spacing(0.5)};
}
& [data-water-ui~="metric-inline"] [data-water-ui~="change"] svg {
	font-size: ${theme.typography.pxToRem(12)};
}
& [data-water-ui~="metric-inline"] [data-water-ui~="comparison-range"] {
	color: ${theme.palette.info.light};
	white-space: nowrap;
	font-size: ${theme.typography.pxToRem(8)};
	line-height: 1.4;
}
& [data-water-ui~="machine-card"] {
	padding: ${theme.spacing(1.25)};
	border-radius: ${theme.spacing(2.25)};
	box-shadow: 0 8px 24px ${alpha(theme.palette.info.dark, 0.09)};
}
& [data-water-ui~="card-header"] {
	background: ${theme.palette.background.paper};
	border-color: ${alpha(theme.palette.info.main, 0.16)};
	min-height: 74px;
	grid-template-columns: 34px minmax(0, 1fr) auto;
	gap: ${theme.spacing(1)};
	padding: ${theme.spacing(1)};
	border-radius: ${theme.spacing(1.5)};
}
& [data-water-ui~="card-header"]::after {
	content: none;
}
& [data-water-ui~="card-body"] {
	gap: ${theme.spacing(0.75)};
	padding-top: ${theme.spacing(0.875)};
}
& [data-water-ui~="instruments"] {
	display: grid;
	align-items: stretch;
	grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
	gap: ${theme.spacing(0.75)};
}
& [data-water-ui~="tank-panel"] {
	display: flex;
	flex-direction: column;
	padding: 0;
	min-width: 0;
}
& [data-water-ui~="home-tank"] {
	width: 100%;
	min-height: 0;
	height: 146px;
	flex: 1;
}
& [data-water-ui~="measurements"] {
	grid-template-columns: minmax(0, 1fr);
	grid-template-rows: repeat(2, minmax(0, 1fr));
	gap: ${theme.spacing(0.75)};
}
& [data-water-ui~="metric-inline"] {
	min-height: 72px;
	padding: ${theme.spacing(0.875)};
	border-radius: ${theme.spacing(1.375)};
}
& [data-water-ui~="metric-inline"] [data-water-ui~="metric-value"] {
	font-size: ${theme.typography.pxToRem(17)};
	font-weight: 600;
	line-height: 1.4;
	letter-spacing: -0.3px;
}
& [data-water-ui~="status-panel"] {
	min-height: 54px;
	padding: ${theme.spacing(0.75)} ${theme.spacing(1)};
	border-radius: ${theme.spacing(1.375)};
}
& [data-water-ui~="motor-control"] {
	min-height: 50px;
	padding: ${theme.spacing(0.375)} ${theme.spacing(1)};
	border-radius: ${theme.spacing(1.375)};
}
& [data-water-ui~="control-label"] [data-water-ui~="control-motor"] {
	width: 36px;
	height: 30px;
}
@container water-list (min-width: 960px) and (max-width: 1279px) {
	& [data-water-ui~="machine-card"] {
		padding: ${theme.spacing(0.875)};
	}
	& [data-water-ui~="card-header"] {
		grid-template-columns: 28px minmax(0, 1fr);
		gap: ${theme.spacing(0.625)} ${theme.spacing(0.875)};
		padding: ${theme.spacing(0.875)};
	}
	& [data-water-ui~="instruments"] {
		grid-template-columns: minmax(0, 0.7fr) minmax(0, 1.3fr);
		gap: ${theme.spacing(0.5)};
	}
	& [data-water-ui~="home-tank"] g text {
		font-size: ${theme.typography.pxToRem(12)};
	}
	& [data-water-ui~="metric-inline"] {
		padding: ${theme.spacing(0.75)};
		gap: ${theme.spacing(0.375)};
	}
	& [data-water-ui~="metric-inline"] [data-water-ui~="metric-value"] {
		font-size: ${theme.typography.pxToRem(13)};
	}
	& [data-water-ui~="metric-inline"] [data-water-ui~="change"] {
		font-size: ${theme.typography.pxToRem(9)};
	}
	& [data-water-ui~="control-label"] [data-water-ui~="control-motor"] {
		width: 24px;
		height: 24px;
	}
	& [data-water-ui~="control-label"] {
		gap: ${theme.spacing(0.5)};
	}
	& [data-water-ui~="motor-control"] {
		gap: ${theme.spacing(0.5)};
		padding: 0 ${theme.spacing(0.75)};
	}
}
& [data-water-ui~="period-grid"] {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: ${theme.spacing(0.75)};
}
& [data-water-ui~="period-panel"] {
	position: relative;
	min-width: 0;
	border: 1px solid ${alpha(theme.palette.info.main, 0.16)};
	border-radius: ${theme.spacing(1.5)};
	background: ${theme.palette.background.paper};
	overflow: hidden;
}
& [data-water-ui~="period-panel"] [data-water-ui~="metric"] {
	border: 0;
	box-shadow: none;
	border-radius: 0;
	min-height: 58px;
	padding: ${theme.spacing(0.75)} ${theme.spacing(0.75)} ${theme.spacing(2.875)};
}
& [data-water-ui~="period-panel"] [data-water-ui~="metric"]::before {
	content: none;
}
& [data-water-ui~="period-panel"] [data-water-ui~="metric-copy"] h3 {
	padding-left: ${theme.spacing(1.875)};
}
& [data-water-ui~="period-panel"] [data-water-ui~="metric-value"] {
	font-size: ${theme.typography.pxToRem(14)};
	font-weight: 700;
}
& [data-water-ui~="period-panel"] [data-water-ui~="metric-unit"] {
	font-size: ${theme.typography.pxToRem(9)};
}
& [data-water-ui~="period-panel"] [data-water-ui~="metric-inline"] [data-water-ui~="change"] {
	font-size: ${theme.typography.pxToRem(9)};
}
& [data-water-ui~="period-sparkline"] {
	display: block;
	position: absolute;
	bottom: 3px;
	left: 7px;
	width: calc(100% - 14px);
	height: 20px;
}
& [data-water-ui~="control-motor-active"] [data-water-ui~="control-rotor"] {
	animation-duration: 0.9s;
}
& [data-water-ui~="control-running"] [data-water-ui~="control-motor"] {
	color: ${theme.palette.success.dark};
	animation: wm-motor-motion 0.6s ease-in-out infinite;
}
& [data-water-ui~="control-running"] [data-water-ui~="control-led"] {
	background: ${theme.palette.success.dark};
	animation-duration: 1.3s;
}
& [data-water-ui~="motor-running"]:not([data-water-ui~="motor-preview"]) svg,
& [data-water-ui~="motor-running"][data-water-ui~="motor-preview"] > svg {
	animation-duration: 1.6s;
}
@keyframes wm-motor-motion {
	50% {
		transform: translateY(-0.6px);
	}
}
@container water-list (max-width: 1279px) {
	& [data-water-ui~="period-panel"] [data-water-ui~="metric-value"] {
		font-size: ${theme.typography.pxToRem(13)};
	}
}
@media (prefers-reduced-motion: reduce) {
	& [data-water-ui~="control-running"] [data-water-ui~="control-motor"] {
		animation: none !important;
	}
}
& [data-water-ui~="machine-card"] {
	container: water-card / inline-size;
	border-color: ${alpha(theme.palette.info.main, 0.16)};
	transition:
		border-color 0.25s ease,
		box-shadow 0.25s ease,
		transform 0.25s ease;
}
& [data-water-ui~="machine-card"]:hover,
& [data-water-ui~="machine-card"]:focus-within {
	border-color: ${theme.palette.info.main};
	box-shadow: 0 8px 24px ${alpha(theme.palette.info.main, 0.14)};
}
& [data-water-ui~="machine-card"]:hover {
	transform: translateY(-2px);
}
& [data-water-ui~="instruments"] {
	grid-template-columns: minmax(65px, 0.75fr) repeat(2, minmax(0, 1fr));
	gap: ${theme.spacing(0.625)};
	align-items: stretch;
}
& [data-water-ui~="tank-panel"] {
	justify-content: center;
	align-items: center;
}
& [data-water-ui~="home-tank"] {
	width: 100%;
	max-width: 85px;
	height: 105px;
	flex: none;
}
& [data-water-ui~="instruments"] [data-water-ui~="measurements"],
& [data-water-ui~="instruments"] [data-water-ui~="period-grid"] {
	display: grid;
	grid-template-columns: minmax(0, 1fr);
	grid-template-rows: repeat(2, minmax(0, 1fr));
	gap: ${theme.spacing(0.625)};
}
& [data-water-ui~="instruments"] [data-water-ui~="metric-inline"] {
	flex-direction: column;
	align-items: flex-start;
	justify-content: center;
	gap: ${theme.spacing(0.5)};
	min-height: 68px;
	padding: ${theme.spacing(0.75)};
}
& [data-water-ui~="instruments"] [data-water-ui~="metric-copy"] {
	flex: none;
	width: 100%;
	overflow: visible;
}
& [data-water-ui~="instruments"] [data-water-ui~="metric-copy"] h3 {
	display: flex;
	align-items: center;
	gap: ${theme.spacing(0.375)};
	font-size: ${theme.typography.pxToRem(10)};
	font-weight: 500;
	padding-left: 0;
}
& [data-water-ui~="instruments"] [data-water-ui~="metric-copy"] h3 svg {
	font-size: ${theme.typography.pxToRem(12)};
	flex-shrink: 0;
	color: ${theme.palette.info.main};
}
& [data-water-ui~="instruments"] [data-water-ui~="metric-value"] {
	font-size: ${theme.typography.pxToRem(15)};
	line-height: 1.3;
}
& [data-water-ui~="instruments"] [data-water-ui~="metric-unit"] {
	font-size: ${theme.typography.pxToRem(10)};
}
& [data-water-ui~="instruments"] [data-water-ui~="metric-comparison"] {
	flex: none;
	align-items: flex-start;
	gap: ${theme.spacing(0.25)};
}
& [data-water-ui~="instruments"] [data-water-ui~="change"] {
	font-size: ${theme.typography.pxToRem(10)};
}
& [data-water-ui~="instruments"] [data-water-ui~="comparison-range"] {
	white-space: normal;
	font-size: ${theme.typography.pxToRem(9)};
}
& [data-water-ui~="instruments"] [data-water-ui~="period-panel"] [data-water-ui~="metric"] {
	height: 100%;
	padding-bottom: ${theme.spacing(0.75)};
}
& [data-water-ui~="instruments"] [data-water-ui~="period-sparkline"] {
	display: none;
}
@container water-card (max-width: 200px) {
	& [data-water-ui~="instruments"] {
		grid-template-columns: 65px minmax(0, 1fr);
	}
	& [data-water-ui~="instruments"] [data-water-ui~="period-grid"] {
		grid-column: 1 / -1;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		grid-template-rows: auto;
	}
}
& [data-water-ui~="motor-stopped"] {
	color: ${theme.palette.info.light};
	background: ${theme.palette.background.paper};
	border: 1px solid ${theme.palette.divider};
}
& [data-water-ui~="control-stopped"] [data-water-ui~="control-led"] {
	background: ${theme.palette.info.light};
	box-shadow: none;
}
& [data-water-ui~="control-stopped"] [data-water-ui~="toggle-state"] {
	color: ${theme.palette.info.light};
}
& [data-water-ui~="power-thumb"],
& [data-water-ui~="industrial-switch"] .Mui-checked [data-water-ui~="power-thumb"] {
	background: ${theme.palette.background.paper};
	border-color: ${theme.palette.divider};
	color: ${theme.palette.info.light};
}
& [data-water-ui~="control-running"] .Mui-checked [data-water-ui~="power-thumb"] {
	color: ${theme.palette.success.dark};
}
@media (prefers-reduced-motion: reduce) {
	& [data-water-ui~="machine-card"]:hover {
		transform: none;
	}
}
& [data-water-ui~="instruments"] [data-water-ui~="measurements"] [data-water-ui~="metric-copy"] {
	width: 100%;
}
& [data-water-ui~="instruments"] [data-water-ui~="measurements"] [data-water-ui~="metric-comparison"] {
	align-self: flex-end;
	align-items: flex-end;
	margin-left: auto;
	text-align: right;
}
& [data-water-ui~="instruments"] [data-water-ui~="period-panel"] [data-water-ui~="metric-comparison"] {
	align-self: flex-end;
	align-items: flex-end;
	margin-left: auto;
	text-align: right;
}
@container water-card (min-width: 350px) {
	& [data-water-ui~="instruments"] [data-water-ui~="measurements"] [data-water-ui~="metric-inline"] {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
	}
	& [data-water-ui~="instruments"] [data-water-ui~="measurements"] [data-water-ui~="metric-copy"] {
		width: auto;
	}
	& [data-water-ui~="instruments"] [data-water-ui~="measurements"] [data-water-ui~="metric-comparison"] {
		align-self: center;
	}
}
& [data-water-ui~="instruments"] [data-water-ui~="metric-value"] {
	font-size: clamp(13px, 4cqi, 15px);
}
& [data-water-ui~="instruments"] {
	grid-template-columns: minmax(65px, 0.7fr) minmax(0, 1.3fr);
}
& [data-water-ui~="card-body"] > [data-water-ui~="period-grid"] {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	grid-template-rows: auto;
	gap: ${theme.spacing(0.75)};
}
& [data-water-ui~="card-body"] > [data-water-ui~="period-grid"] [data-water-ui~="metric-inline"] {
	align-items: center;
	min-height: 64px;
	padding: ${theme.spacing(0.75)};
}
& [data-water-ui~="card-body"] > [data-water-ui~="period-grid"] [data-water-ui~="metric-comparison"] {
	align-items: flex-end;
	margin-left: auto;
	text-align: right;
}
& [data-water-ui~="period-panel"] [data-water-ui~="metric-copy"] h3 {
	display: flex;
	align-items: center;
	gap: ${theme.spacing(0.375)};
	padding-left: 0;
}
& [data-water-ui~="period-panel"] [data-water-ui~="metric-copy"] h3 svg {
	font-size: ${theme.typography.pxToRem(12)};
	flex-shrink: 0;
	color: ${theme.palette.info.main};
}
& [data-water-ui~="instruments"] [data-water-ui~="measurements"] {
	align-self: stretch;
	grid-template-rows: repeat(2, minmax(0, 1fr));
	gap: ${theme.spacing(0.625)};
}
& [data-water-ui~="instruments"] [data-water-ui~="measurements"] [data-water-ui~="metric-inline"] {
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	align-items: center;
	min-height: 52px;
	padding: ${theme.spacing(0.5)} ${theme.spacing(0.75)};
	gap: ${theme.spacing(0.5)};
}
& [data-water-ui~="instruments"] [data-water-ui~="measurements"] [data-water-ui~="metric-copy"] {
	width: auto;
}
& [data-water-ui~="instruments"] [data-water-ui~="measurements"] [data-water-ui~="metric-comparison"] {
	align-self: center;
	align-items: flex-end;
	gap: ${theme.spacing(0.125)};
	margin-left: auto;
}
& [data-water-ui~="instruments"] [data-water-ui~="measurements"] [data-water-ui~="comparison-range"] {
	line-height: 1.2;
}
& [data-water-ui~="instruments"] {
	grid-template-columns: minmax(85px, 0.95fr) minmax(0, 1.05fr);
	gap: ${theme.spacing(0.875)};
}
& [data-water-ui~="home-tank"] {
	max-width: 110px;
	height: 125px;
}
& [data-water-ui~="instruments"] [data-water-ui~="measurements"] {
	gap: ${theme.spacing(0.75)};
}
& [data-water-ui~="instruments"] [data-water-ui~="measurements"] [data-water-ui~="metric-inline"] {
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: ${theme.spacing(0.375)} ${theme.spacing(0.625)};
	min-height: 60px;
	padding: ${theme.spacing(0.75)} ${theme.spacing(0.875)};
	border: 1px solid ${alpha(theme.palette.info.main, 0.16)};
	border-radius: ${theme.spacing(1.5)};
	background: linear-gradient(145deg, ${theme.palette.background.paper}, ${
		theme.palette.background.paper
	});
	box-shadow:
		inset 0 1px 0 ${theme.palette.background.paper},
		0 3px 8px ${alpha(theme.palette.info.dark, 0.03)};
}
& [data-water-ui~="instruments"] [data-water-ui~="measurements"] [data-water-ui~="metric-inline"]::before {
	content: none;
}
& [data-water-ui~="instruments"] [data-water-ui~="measurements"] [data-water-ui~="metric-copy"] {
	flex: 1 0 60px;
	width: auto;
	min-width: 0;
}
& [data-water-ui~="instruments"] [data-water-ui~="measurements"] [data-water-ui~="metric-copy"] h3 {
	gap: ${theme.spacing(0.5)};
	color: ${theme.palette.info.dark};
}
& [data-water-ui~="instruments"] [data-water-ui~="measurements"] [data-water-ui~="metric-copy"] h3 svg {
	width: 19px;
	height: 19px;
	padding: ${theme.spacing(0.375)};
	color: ${theme.palette.info.main};
	background: ${alpha(theme.palette.info.main, 0.16)};
	border-radius: ${theme.spacing(0.625)};
}
& [data-water-ui~="instruments"] [data-water-ui~="measurements"] [data-water-ui~="metric-comparison"] {
	flex: 0 0 auto;
	align-self: center;
	align-items: flex-end;
	margin-left: auto;
}
& [data-water-ui~="instruments"] [data-water-ui~="measurements"] [data-water-ui~="metric-unit"] {
	padding: ${theme.spacing(0.125)} ${theme.spacing(0.375)};
	border-radius: ${theme.spacing(0.5)};
	background: ${theme.palette.background.paper};
	color: ${theme.palette.info.dark};
}
& [data-water-ui~="instruments"] [data-water-ui~="measurements"] [data-water-ui~="metric-inline"]:focus-within {
	border-color: ${theme.palette.info.light};
}
@container water-card (max-width: 200px) {
	& [data-water-ui~="instruments"] {
		grid-template-columns: 75px minmax(0, 1fr);
		gap: ${theme.spacing(0.625)};
	}
	& [data-water-ui~="home-tank"] {
		max-width: 90px;
		height: 115px;
	}
}
/* Motor feedback is independent of remote-control availability. */
& [data-water-ui~="motor-status"] {
	color: #64748b;
	border: 1px solid currentColor;
}
& [data-water-ui~="motor-status"][data-water-ui~="motor-running"] {
	color: #16a34a;
}
& [data-water-ui~="motor-status"][data-water-ui~="motor-stopped"] {
	color: #dc2626;
}
& [data-water-ui~="motor-user-control"] {
	--motor-color: #94a3b8;
}
& [data-water-ui~="control-running"][data-control-enabled] {
	--motor-color: #166534;
	--motor-hover: #14532d;
	--motor-hover-fill: rgba(21, 128, 61, 0.1);
	--motor-ring: rgba(21, 128, 61, 0.28);
}
& [data-water-ui~="control-stopped"][data-control-enabled] {
	--motor-color: #dc2626;
	--motor-hover: #b91c1c;
	--motor-hover-fill: rgba(220, 38, 38, 0.08);
	--motor-ring: rgba(220, 38, 38, 0.24);
}
& [data-water-ui~="motor-user-control"] :is([data-water-ui~="control-motor"], [data-water-ui~="toggle-state"]),
& [data-water-ui~="motor-user-control"] [data-water-ui~="industrial-switch"] .MuiSwitch-switchBase [data-water-ui~="power-thumb"] {
	color: var(--motor-color);
}
& [data-water-ui~="motor-user-control"] [data-water-ui~="control-led"] {
	background: var(--motor-color);
	box-shadow: none;
	animation: none;
}
& [data-water-ui~="motor-user-control"] [data-water-ui~="toggle-target"] [data-water-ui~="industrial-switch"] .MuiSwitch-track {
	border-radius: 999px;
	border: 1px solid;
	background: var(--motor-color);
	border-color: var(--motor-color);
	opacity: 1;
	box-shadow: none;
	transition: background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}
& [data-water-ui~="motor-user-control"] [data-water-ui~="toggle-enabled"] {
	transition: background-color 180ms ease, box-shadow 180ms ease;
}
& [data-water-ui~="motor-user-control"] [data-water-ui~="toggle-enabled"]:hover {
	background-color: var(--motor-hover-fill);
	box-shadow: 0 0 0 2px var(--motor-ring);
}
& [data-water-ui~="motor-user-control"] [data-water-ui~="toggle-enabled"]:hover [data-water-ui~="industrial-switch"] .MuiSwitch-track {
	background: var(--motor-hover);
	border-color: var(--motor-hover);
}
& [data-water-ui~="motor-user-control"] [data-water-ui~="industrial-switch"] .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track {
	background: linear-gradient(105deg,#138A3F 0%,#1DAA50 100%);
	border-color: #138a3f;
	opacity: 1;
}
& [data-water-ui~="motor-user-control"] [data-water-ui~="industrial-switch"] .MuiSwitch-switchBase.Mui-focusVisible + .MuiSwitch-track {
	outline: 2px solid var(--motor-color);
	outline-offset: 3px;
}
@media (prefers-reduced-motion: reduce) {
	& [data-water-ui~="motor-user-control"] [data-water-ui~="toggle-enabled"],
	& [data-water-ui~="motor-user-control"] [data-water-ui~="toggle-target"] [data-water-ui~="industrial-switch"] .MuiSwitch-switchBase,
	& [data-water-ui~="motor-user-control"] [data-water-ui~="toggle-target"] [data-water-ui~="industrial-switch"] .MuiSwitch-track {
		transition: none;
	}
}
& [data-water-ui~="machine-card"] {
	border-color: var(--wm-line);
	background: linear-gradient(
		180deg,
		var(--wm-status-fill, var(--wm-tint)),
		var(--wm-card-surface, ${theme.palette.background.paper}) 180px
	);
	box-shadow: 0 7px 22px ${alpha(theme.palette.text.primary, 0.05)};
}
& [data-water-ui~="machine-card"]:hover,
& [data-water-ui~="machine-card"]:focus-within {
	border-color: var(--wm-accent);
	box-shadow: 0 10px 26px ${alpha(theme.palette.text.primary, 0.08)};
}
& [data-water-ui~="card-header"] {
	grid-template-columns: 40px minmax(0, 1fr);
	min-height: 94px;
	padding: ${theme.spacing(3.5)} ${theme.spacing(1.25)} ${theme.spacing(1.5)};
	border-color: var(--wm-line);
	background: linear-gradient(
		120deg,
		var(--wm-status-fill, var(--wm-tint)),
		var(--wm-card-surface, ${theme.palette.background.paper})
	);
}
& [data-water-ui~="card-header"]::after {
	content: '';
	right: -20px;
	bottom: -40px;
	opacity: 0.28;
}
& [data-water-ui~="tank-panel"] {
	gap: ${theme.spacing(1)};
	align-items: center;
	padding: ${theme.spacing(1)} ${theme.spacing(0.375)};
}
& [data-water-ui~="tank-visual"] {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: ${theme.spacing(1)};
	width: 100%;
	max-width: 145px;
	min-width: 0;
	margin: 0 auto;
}
& [data-water-ui~="tank-visual"] [data-water-ui~="home-tank"] {
	display: block;
	flex: none;
	width: 100%;
	max-width: 140px;
	height: auto;
	min-height: 0;
	aspect-ratio: 140 / 144;
	overflow: visible;
}
& [data-water-ui~="tank-visual"] [data-water-ui~="tank-scale-text"] {
	fill: ${theme.palette.text.primary};
	font-size: ${theme.typography.pxToRem(9)};
	font-weight: 800;
	font-variant-numeric: tabular-nums;
}
& [data-water-ui~="tank-visual"] [data-tank-active-marker] [data-water-ui~="tank-scale-text"] {
	font-size: ${theme.typography.pxToRem(12)};
}
& [data-tank-level="0"] {
	--wm-level-color: #b91c1c;
	--wm-level-bg: #fee2e2;
}
& [data-tank-level="25"] {
	--wm-level-color: #854d0e;
	--wm-level-bg: #fef08a;
}
& [data-tank-level="50"] {
	--wm-level-color: #9a3412;
	--wm-level-bg: #fed7aa;
}
& [data-tank-level="75"] {
	--wm-level-color: #15803d;
	--wm-level-bg: #dcfce7;
}
& [data-tank-level="100"] {
	--wm-level-color: #064e3b;
	--wm-level-bg: #a7f3d0;
}
& [data-tank-active-marker] rect {
	fill: var(--wm-level-bg);
	stroke: var(--wm-level-color);
	stroke-width: 1.2;
}
& [data-tank-active-marker] :is(path, circle) {
	stroke: var(--wm-level-color);
	stroke-width: 1.4;
}
& [data-tank-active-marker] [data-water-ui~="tank-scale-text"],
& [data-water-ui~="tank-current-level"] {
	fill: var(--wm-level-color);
}


/* Water Machine List metric and section styles for OHT telemetry. */
& [data-water-ui~="reference-card"] [data-water-ui~="card-body"] {
	gap: ${theme.spacing(0.65)};
	padding: 0;
}
& [data-water-ui~="reference-card"] :is(
	[data-water-ui~="status-panel"],
	[data-water-ui~="motor-control"],
	[data-water-ui~="period-panel"]
) {
	border: 1px solid ${theme.palette.divider};
	border-radius: ${theme.spacing(MACHINE_CARD_DESIGN.sectionRadius)};
	background: ${theme.palette.background.paper};
}
& [data-water-ui~="reference-card"] [data-water-ui~="period-grid"] {
	gap: ${theme.spacing(0.65)};
}
& [data-water-ui~="reference-card"] [data-water-ui~="period-panel"] {
	min-height: 42px;
	box-shadow: 0 3px 10px rgba(37, 69, 111, .04);
}
& [data-water-ui~="reference-card"] [data-water-ui~="period-grid"] [data-water-ui~="period-panel"] [data-water-ui~="metric-inline"] {
	min-height: 0;
	padding: ${theme.spacing(0.75)};
	align-items: flex-start;
	flex-wrap: wrap;
}
& [data-water-ui~="reference-card"] [data-water-ui~="period-sparkline"] {
	position: static;
	width: calc(100% - 16px);
	height: 16px;
	margin: 0 8px 3px;
}
& [data-water-ui~="reference-card"] [data-water-ui~="instruments"] [data-water-ui~="measurements"] {
	grid-template-rows: repeat(2, minmax(0, 1fr));
	gap: ${theme.spacing(0.65)};
}
& [data-water-ui~="reference-card"] [data-water-ui~="instruments"] [data-water-ui~="measurements"] [data-water-ui~="metric-inline"] {
	align-items: flex-start;
	min-height: 0;
	padding: ${theme.spacing(0.75, 0.75, 0.75, 1.15)};
	border: 1px solid ${theme.palette.divider};
	border-radius: ${theme.spacing(MACHINE_CARD_DESIGN.sectionRadius)};
	background: ${theme.palette.background.paper};
	box-shadow: 0 3px 10px rgba(37, 69, 111, .04);
}
& [data-water-ui~="reference-card"] [data-water-ui~="instruments"] [data-water-ui~="measurements"] [data-water-ui~="metric-inline"]::before {
	content: '';
	top: 7px;
	bottom: 7px;
	border-radius: 0 4px 4px 0;
	background: #7c3aed;
}
& [data-water-ui~="reference-card"] [data-water-ui~="instruments"] [data-water-ui~="measurements"] [data-water-ui~="metric-inline"]:last-child::before {
	background: #14b8a6;
}
& [data-water-ui~="reference-card"] [data-water-ui~="card-body"] [data-water-ui~="metric-inline"] [data-water-ui~="metric-copy"] h3 {
	font-size: 0.66rem;
	font-weight: 600;
	color: ${theme.palette.text.secondary};
}
& [data-water-ui~="reference-card"] [data-water-ui~="period-grid"] [data-water-ui~="metric-copy"] h3 {
	font-size: 0.65rem;
}
& [data-water-ui~="reference-card"] [data-water-ui~="measurements"] [data-water-ui~="metric-copy"] h3 svg {
	display: none;
}
& [data-water-ui~="reference-card"] [data-water-ui~="period-panel"] [data-water-ui~="metric-copy"] h3 svg {
	font-size: 16px;
	color: #16a34a;
}
& [data-water-ui~="reference-card"] [data-water-ui~="card-body"] [data-water-ui~="metric-inline"] :is([data-water-ui~="metric-value"], [data-water-ui~="metric-unit"]) {
	padding: 0;
	background: none;
	color: ${theme.palette.text.primary};
	font-size: 0.88rem;
	font-weight: 900;
	letter-spacing: normal;
	white-space: normal;
	overflow-wrap: anywhere;
}
& [data-water-ui~="reference-card"] [data-water-ui~="period-panel"] [data-water-ui~="metric-inline"] :is([data-water-ui~="metric-value"], [data-water-ui~="metric-unit"]) {
	font-size: 0.86rem;
}
& [data-water-ui~="reference-card"] [data-water-ui~="card-body"] [data-water-ui~="metric-inline"] [data-water-ui~="change"] {
	padding: ${theme.spacing(0.25, 0.55)};
	border-radius: ${theme.spacing(1)};
	color: ${theme.palette.text.secondary};
	font-size: 0.68rem;
	font-weight: 900;
}
& [data-water-ui~="reference-card"] [data-water-ui~="card-body"] [data-water-ui~="metric-inline"] [data-water-ui~="change"][data-water-ui~="change-positive"] {
	color: #16a34a;
	background: ${alpha('#16a34a', 0.08)};
}
& [data-water-ui~="reference-card"] [data-water-ui~="card-body"] [data-water-ui~="metric-inline"] [data-water-ui~="change"][data-water-ui~="change-down"] {
	color: #f23857;
	background: ${alpha('#f23857', 0.08)};
}
& [data-water-ui~="reference-card"] [data-water-ui~="metric-inline"] [data-water-ui~="change"] svg {
	font-size: 15px;
}
& [data-water-ui~="reference-card"] [data-water-ui~="card-body"] [data-water-ui~="metric-inline"] [data-water-ui~="comparison-range"] {
	color: ${theme.palette.text.secondary};
	font-size: 0.5rem;
}
& [data-water-ui~="reference-card"] :is(
	[data-water-ui~="status-label"],
	[data-water-ui~="control-label"] .MuiTypography-root
) {
	color: ${theme.palette.text.secondary};
	font-size: ${MACHINE_CARD_DESIGN.metricLabelSize};
	font-weight: 600;
}

& [data-water-ui~="reference-card"] {
	container: tank-card / inline-size;
}
& [data-water-ui~="reference-card"] [data-water-ui~="tank-visual"],
& [data-water-ui~="reference-card"] [data-water-ui~="tank-visual"] [data-water-ui~="home-tank"] {
	max-width: 130px;
}
& [data-water-ui~="reference-card"] [data-water-ui~="tank-panel"] {
	padding-block: 0;
}
& [data-water-ui~="reference-card"] [data-water-ui~="instruments"] [data-water-ui~="measurements"] [data-water-ui~="metric-inline"] {
	align-items: center;
	padding-block: 4px;
}
& [data-water-ui~="reference-card"] [data-water-ui~="measurements"] [data-water-ui~="metric-copy"] h3 svg {
	display: block;
	padding: 0;
	flex-shrink: 0;
	background: transparent;
	color: #7c3aed;
}
& [data-water-ui~="reference-card"] [data-water-ui~="measurements"] [data-water-ui~="metric"]:last-child h3 svg {
	color: #059669;
}
& [data-water-ui~="reference-card"] [data-water-ui~="measurements"] [data-water-ui~="metric-inline"] [data-water-ui~="comparison-range"] {
	font-size: 0.65rem;
	text-align: right;
}
& [data-water-ui~="reference-card"] [data-water-ui~="change-flat"]:not([data-water-ui~="change-positive"]) {
	background: ${theme.palette.action.selected};
}
& [data-water-ui~="reference-card"] [data-water-ui~="status-panel"] {
	gap: 6px;
	min-height: 0;
	padding: 4px 8px;
}
& [data-water-ui~="reference-card"] [data-water-ui~="status-panel"] > * {
	display: flex;
	flex-direction: column;
	min-width: 0;
}
& [data-water-ui~="control-type"],
& [data-water-ui~="motor-command"] {
	border-inline-start: 1px solid ${theme.palette.divider};
	padding-inline-start: 8px;
	min-width: 0;
}
& [data-water-ui~="segments"] {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 2px;
	margin-top: 3px;
	padding: 1px;
	border-radius: 12px;
	background: ${theme.palette.action.selected};
}
& [data-water-ui~="segments"] > * {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 2px;
	min-height: 28px;
	padding: 2px;
	border-radius: 11px;
	text-align: center;
	font-size: 0.7rem;
	font-weight: 700;
	line-height: 1.15;
	color: ${theme.palette.text.primary};
}
& [data-water-ui~="control-type"] [data-water-ui~="segments"]:is(:hover, :focus-within) {
	outline: 1px solid ${theme.palette.info.main};
}
& [data-water-ui~="segments"][data-control-type-unknown] {
	border: 1px solid ${theme.palette.divider};
	background: ${theme.palette.background.paper};
}
& [data-water-ui~="segments"] > [data-water-ui~="control-type-status"] {
	grid-column: 1 / -1;
	flex-direction: row;
	gap: 4px;
	min-height: 24px;
	padding-inline: 6px;
	border-radius: 10px 10px 4px 4px;
	background: ${theme.palette.action.hover};
	color: ${theme.palette.text.secondary};
}
& [data-water-ui~="control-type-status"] svg {
	flex-shrink: 0;
}
& [data-water-ui~="segments"][data-control-type-disabled] {
	cursor: not-allowed;
}
& [data-water-ui~="control-type"] [data-control-type-disabled]:is(:hover, :focus-visible) {
	outline: 1px solid ${theme.palette.warning.main};
}
& [data-water-ui~="segments"] .Mui-focusVisible {
	outline: 2px solid ${theme.palette.info.main};
	outline-offset: 2px;
}
& [data-water-ui~="segments"] svg {
	font-size: 13px;
}
& [data-water-ui~="segments"] [data-active="true"] {
	background: linear-gradient(120deg, #15803d, #16983a);
	color: #fff;
}
& [data-water-ui~="control-type"] [data-active="true"] {
	background: linear-gradient(120deg, #076fda, #0058dc);
}
& [data-water-ui~="motor-feedback"],
& [data-water-ui~="motor-command"] {
	display: flex;
	align-items: center;
	gap: 6px;
}
& [data-water-ui~="motor-state-toggle"] {
	flex-shrink: 0;
}
& [data-water-ui~="reference-card"] [data-water-ui~="motor-control"] {
	display: grid;
	grid-template-columns: 1fr 1fr;
	padding: 4px 8px;
}
& [data-water-ui~="motor-feedback"] [data-water-ui~="control-motor"] {
	width: clamp(24px, 9cqw, 50px);
	flex-shrink: 0;
	color: ${theme.palette.info.main};
}

& [data-water-ui~="status-panel"] [data-water-ui~="status-label"] {
	display: flex;
	align-items: center;
	justify-content: flex-start;
	gap: 4px;
	text-align: left;
}
& [data-water-ui~="status-panel"] [data-water-ui~="status-label"] svg {
	font-size: 0.95rem;
}
& [data-water-ui~="status-info"] {
	display: inline-flex;
	border-radius: 50%;
	cursor: help;
}
& [data-water-ui~="status-info"]:focus-visible {
	outline: 1px solid ${theme.palette.info.main};
	outline-offset: 2px;
}
& [data-water-ui~="mode-badge"] {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	width: fit-content;
	min-height: 28px;
	margin: auto;
	padding: 2px clamp(6px, 2.5cqi, 14px);
	border-radius: 999px;
	background: ${theme.palette.action.selected};
	color: ${theme.palette.text.secondary};
	font-size: clamp(0.7rem, 2.6cqi, 0.85rem);
	font-weight: 800;
}
& [data-water-ui~="mode-badge"][data-mode="Remote"] {
	background: ${alpha(theme.palette.success.main, 0.16)};
	color: ${theme.palette.success.dark};
}
& [data-water-ui~="mode-badge"][data-mode="Manual"] {
	background: ${alpha(theme.palette.warning.main, 0.16)};
	color: ${theme.palette.warning.dark};
}
& [data-water-ui~="mode-badge"] svg {
	font-size: 1.15em;
}
& [data-water-ui~="offline-note"],
& [data-water-ui~="tank-alert"] {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 5px 8px;
	border: 1px solid;
	border-radius: 14px;
}
& [data-water-ui~="offline-note"] {
	border-color: ${alpha(theme.palette.info.main, 0.22)};
	background:
		radial-gradient(ellipse 80px 28px at 100% 108%, ${alpha(
			theme.palette.info.main,
			0.22
		)} 99%, transparent),
		radial-gradient(ellipse 100px 22px at 92% 116%, ${alpha(
			theme.palette.info.main,
			0.17
		)} 99%, transparent),
		linear-gradient(120deg, ${alpha(theme.palette.info.main, 0.08)}, ${alpha(
			theme.palette.info.main,
			0.16
		)});
	color: ${theme.palette.text.primary};
}
& [data-water-ui~="offline-icon"] {
	display: grid;
	place-items: center;
	flex-shrink: 0;
	width: 32px;
	height: 32px;
	border-radius: 10px;
	background: ${alpha(theme.palette.info.main, 0.2)};
}
& [data-water-ui~="notice-copy"] {
	flex: 1;
	min-width: 0;
	padding-inline-start: 8px;
	border-inline-start: 1px solid ${theme.palette.divider};
}
& [data-water-ui~="notice-title"] {
	font-size: clamp(0.72rem, 2.9cqi, 1rem);
	font-weight: 800;
	line-height: 1.25;
}
& [data-water-ui~="notice-detail"] {
	display: flex;
	align-items: center;
	gap: 4px;
	margin-top: 2px;
	color: ${theme.palette.text.secondary};
	font-size: clamp(0.65rem, 2.5cqi, 0.88rem);
	line-height: 1.3;
}
& [data-water-ui~="notice-detail"] svg {
	font-size: 1.1em;
	flex-shrink: 0;
}
& [data-water-ui~="tank-alert"] {
	border-color: ${alpha(theme.palette.error.main, 0.52)};
	background: ${alpha(theme.palette.error.main, 0.1)};
	color: ${theme.palette.error.main};
}
& [data-water-ui~="tank-alert"] [data-water-ui~="notice-title"] {
	font-size: clamp(0.85rem, 3.8cqi, 1.2rem);
}
& [data-water-ui~="alert-icon"] {
	font-size: 26px;
	flex-shrink: 0;
}
& [data-water-ui~="level-symbol"] {
	display: grid;
	justify-items: center;
	flex-shrink: 0;
}
& [data-water-ui~="level-symbol"] svg:first-child {
	font-size: 16px;
	margin-bottom: -4px;
}
@container tank-card (max-width: 280px) {
	& [data-water-ui~="reference-card"] [data-water-ui~="motor-control"] {
		grid-template-columns: 1fr;
	}
	& [data-water-ui~="motor-command"] {
		border-inline-start: 0;
		border-top: 1px solid ${theme.palette.divider};
		padding: 0;
	}
}
@container tank-card (min-width: 330px) {
	& [data-water-ui~="segments"] > * {
		flex-direction: row;
	}
}
@container tank-card (min-width: 380px) {
	& [data-water-ui~="segments"] > * {
		font-size: 0.8rem;
	}
	& [data-water-ui~="reference-card"] [data-water-ui~="card-body"] [data-water-ui~="metric-inline"] :is([data-water-ui~="metric-value"], [data-water-ui~="metric-unit"]) {
		font-size: 1.05rem;
	}
}
@media (prefers-reduced-motion: reduce) {
	& [data-water-ui~="tank-visual"] *,
	& [data-water-ui~="machine-card"] {
		animation: none !important;
		transition: none !important;
	}
}

`
);
