import { Box } from '@mui/material';
import { alpha, styled } from '@mui/material/styles';

export const DashboardSurface = styled(Box)(
	({ theme }) => `
& {
	container: scada / inline-size;
	display: flex;
	flex-direction: column;
	gap: ${theme.spacing(1.25)};
	min-height: 0;
	height: 100%;
	overflow: auto;
	color: ${theme.palette.text.primary};
	font-family: inherit;
}
& *,
& *::before,
& *::after {
	box-sizing: border-box;
}
& [data-water-ui~="header"] {
	display: flex;
	align-items: center;
	gap: ${theme.spacing(1.5)};
	padding: ${theme.spacing(0.5)} ${theme.spacing(0.25)};
	flex-wrap: wrap;
}
& [data-water-ui~="heading-icon"] {
	display: grid;
	place-items: center;
	width: 44px;
	height: 44px;
	color: ${theme.palette.info.main};
	background: ${alpha(theme.palette.info.main, 0.16)};
	border: 1px solid ${alpha(theme.palette.info.main, 0.28)};
	border-radius: ${theme.spacing(1.625)};
}
& [data-water-ui~="heading"] {
	flex: 1;
	min-width: 210px;
}
& [data-water-ui~="heading"] h1 {
	font-size: ${theme.typography.pxToRem(23)};
	font-weight: 700;
	letter-spacing: -0.6px;
	margin: 0;
}
& [data-water-ui~="heading"] p {
	color: ${theme.palette.info.light};
	font-size: ${theme.typography.pxToRem(11)};
	margin: ${theme.spacing(0.375)} 0 0;
}
& [data-water-ui~="header"] .MuiChip-root {
	font-size: ${theme.typography.pxToRem(10)};
	background: ${alpha(theme.palette.background.paper, 0.79)};
}
& [data-water-ui~="mode-badge"] {
	font-size: ${theme.typography.pxToRem(10)};
	font-weight: 600;
	padding: ${theme.spacing(0.75)} ${theme.spacing(1.25)};
	border-radius: ${theme.spacing(1)};
	border: 1px solid ${alpha(theme.palette.info.main, 0.16)};
	background: ${theme.palette.background.paper};
	color: ${theme.palette.info.light};
}
& [data-water-ui~="mode-monitor"] {
	background: ${alpha(theme.palette.info.main, 0.16)};
	color: ${theme.palette.info.main};
	border-color: ${alpha(theme.palette.info.main, 0.28)};
}
& [data-water-ui~="toolbar"] {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: ${theme.spacing(1.25)};
	background: ${alpha(theme.palette.background.paper, 0.93)};
	border: 1px solid ${alpha(theme.palette.info.main, 0.16)};
	border-radius: ${theme.spacing(1.625)};
	padding: ${theme.spacing(1.25)};
}
& [data-water-ui~="toolbar"] > .MuiTextField-root {
	width: 200px;
}
& [data-water-ui~="toolbar"] > .MuiTextField-root:first-child {
	width: 170px;
}
& .MuiOutlinedInput-root {
	font-size: ${theme.typography.pxToRem(12)};
	border-radius: ${theme.spacing(1.125)};
	background: ${theme.palette.background.paper};
}
& .MuiInputLabel-root {
	font-size: ${theme.typography.pxToRem(12)};
}
& .MuiButton-root {
	text-transform: none;
	font-size: ${theme.typography.pxToRem(11)};
	border-radius: ${theme.spacing(1)};
	min-height: 36px;
	box-shadow: none;
}
& .MuiButton-contained {
	background: ${theme.palette.info.main};
}
& [data-water-ui~="toolbar-modes"] {
	display: flex;
	gap: ${theme.spacing(0.75)};
	flex-wrap: wrap;
}
& [data-water-ui~="layout-status"] {
	font-size: ${theme.typography.pxToRem(10)};
	color: ${theme.palette.info.light};
	margin-left: auto;
}
& [data-water-ui~="preview-note"] {
	display: flex;
	align-items: center;
	gap: ${theme.spacing(0.75)};
	font-size: ${theme.typography.pxToRem(10)};
	color: ${theme.palette.warning.dark};
	padding: 0 ${theme.spacing(0.375)};
}
& [data-water-ui~="preview-note"] > span {
	width: 6px;
	height: 6px;
	background: ${theme.palette.warning.main};
	border-radius: 50%;
	flex-shrink: 0;
}
& [data-water-ui~="editor-actions"] {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: ${theme.spacing(0.625)};
}
& [data-water-ui~="editor-actions"] > span {
	font-size: ${theme.typography.pxToRem(10)};
	color: ${theme.palette.info.light};
	margin-left: auto;
}
& [data-water-ui~="editor-actions"] .MuiButton-root {
	min-height: 32px;
}
& [data-water-ui~="workspace"] {
	position: relative;
	display: grid;
	grid-template-columns: minmax(0, 1fr);
	min-height: 560px;
	flex: 1;
	border: 1px solid ${alpha(theme.palette.info.main, 0.16)};
	border-radius: ${theme.spacing(1.875)};
	background: ${theme.palette.background.paper};
	overflow: hidden;
	box-shadow: 0 6px 22px ${alpha(theme.palette.info.dark, 0.04)};
}
& [data-water-ui~="workspace"][data-water-ui~="with-library"] {
	grid-template-columns: 230px minmax(0, 1fr);
}
& [data-water-ui~="workspace"][data-water-ui~="with-inspector"] {
	grid-template-columns: minmax(0, 1fr) 265px;
}
& [data-water-ui~="workspace"][data-water-ui~="with-library"][data-water-ui~="with-inspector"] {
	grid-template-columns: 230px minmax(0, 1fr) 265px;
}
& [data-water-ui~="library"],
& [data-water-ui~="inspector"] {
	display: flex;
	flex-direction: column;
	gap: ${theme.spacing(1.5)};
	padding: ${theme.spacing(1.75)} ${theme.spacing(1.5)};
	min-width: 0;
	background: ${theme.palette.background.paper};
	max-height: 72vh;
	overflow-y: auto;
	z-index: 3;
}
& [data-water-ui~="library"] {
	border-right: 1px solid ${alpha(theme.palette.info.main, 0.16)};
}
& [data-water-ui~="panel-title"] {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: ${theme.spacing(1)};
}
& [data-water-ui~="panel-title"] strong {
	font-size: ${theme.typography.pxToRem(12)};
	font-weight: 700;
}
& [data-water-ui~="panel-title"] small {
	display: block;
	margin-top: ${theme.spacing(0.375)};
	font-size: ${theme.typography.pxToRem(9)};
	color: ${theme.palette.info.light};
}
& [data-water-ui~="library-count"] {
	display: grid;
	place-items: center;
	width: 25px;
	height: 25px;
	font-size: ${theme.typography.pxToRem(10)};
	color: ${theme.palette.info.main};
	background: ${alpha(theme.palette.info.main, 0.07)};
	border-radius: ${theme.spacing(0.875)};
}
& [data-water-ui~="library-groups"] {
	display: flex;
	flex-direction: column;
	gap: ${theme.spacing(1.25)};
	flex: 1;
}
& [data-water-ui~="group-heading"] {
	width: 100%;
	display: flex;
	justify-content: space-between;
	padding: ${theme.spacing(0.625)} 0;
	border: 0;
	background: transparent;
	font-size: ${theme.typography.pxToRem(10)};
	color: ${theme.palette.info.light};
	font-weight: 700;
	cursor: pointer;
	text-align: left;
}
& [data-water-ui~="library-item"] {
	display: flex;
	align-items: center;
	gap: ${theme.spacing(0.875)};
	min-height: 56px;
	padding: ${theme.spacing(0.625)};
	margin-top: ${theme.spacing(0.625)};
	border: 1px solid ${alpha(theme.palette.info.main, 0.16)};
	border-radius: ${theme.spacing(1.25)};
	background: ${theme.palette.background.paper};
	cursor: grab;
	transition:
		border-color 0.15s,
		background 0.15s;
}
& [data-water-ui~="library-item"]:hover {
	border-color: ${theme.palette.info.light};
	background: ${theme.palette.background.paper};
}
& [data-water-ui~="library-item"] > [data-water-ui~="art"] {
	width: 49px;
	height: 41px;
	flex-shrink: 0;
}
& [data-water-ui~="library-item"] > div {
	min-width: 0;
	flex: 1;
}
& [data-water-ui~="library-item"] strong {
	display: block;
	font-size: ${theme.typography.pxToRem(10)};
	font-weight: 600;
}
& [data-water-ui~="library-item"] small {
	font-size: ${theme.typography.pxToRem(9)};
	color: ${theme.palette.info.light};
}
& [data-water-ui~="library-item"] > button {
	width: 28px;
	height: 32px;
	border: 0;
	border-radius: ${theme.spacing(0.875)};
	color: ${theme.palette.info.main};
	font-size: ${theme.typography.pxToRem(20)};
	background: ${alpha(theme.palette.info.main, 0.16)};
	cursor: pointer;
	flex-shrink: 0;
}
& [data-water-ui~="library-item"] > button:disabled {
	color: ${theme.palette.info.light};
	background: ${theme.palette.background.paper};
	cursor: not-allowed;
}
& [data-water-ui~="unavailable"] {
	opacity: 0.6;
	cursor: not-allowed;
}
& [data-water-ui~="library-footer"] {
	display: flex;
	flex-direction: column;
	gap: ${theme.spacing(0.75)};
	border-top: 1px solid ${alpha(theme.palette.info.main, 0.16)};
	padding-top: ${theme.spacing(1.25)};
}
& [data-water-ui~="library-footer"] small,
& [data-water-ui~="muted"] {
	font-size: ${theme.typography.pxToRem(10)};
	color: ${theme.palette.info.light};
	line-height: 1.5;
}
& [data-water-ui~="canvas-shell"] {
	position: relative;
	min-width: 0;
	min-height: 560px;
	overflow: hidden;
}
& [data-water-ui~="canvas"] {
	position: absolute;
	inset: 0;
	touch-action: none;
	overflow: hidden;
	background-color: ${theme.palette.background.paper};
	background-image: radial-gradient(${alpha(
		theme.palette.info.main,
		0.28
	)} 1px, transparent 1px);
	outline: none;
	cursor: grab;
}
& [data-water-ui~="canvas"]:active {
	cursor: grabbing;
}
& [data-water-ui~="canvas"]:focus-visible {
	outline: 2px solid ${theme.palette.info.main};
	outline-offset: -3px;
}
& [data-water-ui~="world"] {
	position: absolute;
	top: 0;
	left: 0;
	transform-origin: 0 0;
	pointer-events: none;
}
& [data-water-ui~="pipelines"] {
	position: absolute;
	inset: 0;
	overflow: visible;
	pointer-events: none;
}
& [data-water-ui~="pipe-body"] {
	stroke: ${alpha(theme.palette.info.main, 0.28)};
	stroke-width: 6;
	fill: none;
	stroke-linecap: round;
	stroke-linejoin: round;
}
& [data-water-ui~="pipe-hit"] {
	fill: none;
	stroke: transparent;
	stroke-width: 24;
	pointer-events: stroke;
	cursor: pointer;
}
& [data-water-ui~="pipe-hit"]:focus-visible {
	stroke: ${alpha(theme.palette.info.main, 0.16)};
	outline: none;
}
& [data-water-ui~="pipe-flowing"] [data-water-ui~="pipe-body"] {
	stroke: ${theme.palette.info.main};
}
& [data-water-ui~="pipe-stopped"] [data-water-ui~="pipe-body"] {
	stroke: ${theme.palette.info.light};
}
& [data-water-ui~="pipe-unknown"] [data-water-ui~="pipe-body"] {
	stroke-dasharray: 8 5;
}
& [data-water-ui~="pipe-flow"] {
	fill: none;
	stroke: ${alpha(theme.palette.info.main, 0.28)};
	stroke-width: 2.5;
	stroke-dasharray: 7 12;
	stroke-linejoin: round;
	animation: sc-water-flow 1.6s linear infinite;
}
& [data-water-ui~="pipe-selected"] [data-water-ui~="pipe-body"] {
	stroke: ${theme.palette.info.main};
	filter: drop-shadow(0 0 3px ${theme.palette.info.main});
}
& [data-water-ui~="pipe-signal"] [data-water-ui~="pipe-body"] {
	stroke: ${theme.palette.info.light};
	stroke-width: 2;
	stroke-dasharray: 4 5;
}
& [data-water-ui~="connection-ghost"] {
	fill: none;
	stroke: ${theme.palette.info.main};
	stroke-width: 3;
	stroke-dasharray: 5 5;
}
& [data-water-ui~="node"] {
	position: absolute;
	top: 0;
	left: 0;
	padding: ${theme.spacing(1)};
	border: 1px solid ${alpha(theme.palette.info.main, 0.16)};
	border-radius: ${theme.spacing(1.75)};
	background: ${alpha(theme.palette.background.paper, 0.93)};
	box-shadow: 0 4px 15px ${alpha(theme.palette.info.dark, 0.05)};
	pointer-events: auto;
	cursor: default;
}
& [data-water-ui~="node-selected"] {
	border-color: ${theme.palette.info.main};
	box-shadow:
		0 0 0 3px ${alpha(theme.palette.info.main, 0.1)},
		0 4px 15px ${alpha(theme.palette.info.dark, 0.08)};
}
& [data-water-ui~="node-running"] {
	border-color: ${alpha(theme.palette.info.main, 0.28)};
}
& [data-water-ui~="node-running"][data-water-ui~="node-selected"] {
	border-color: ${theme.palette.info.main};
}
& [data-water-ui~="node-title"] {
	display: block;
	width: 100%;
	min-height: 26px;
	max-height: 34px;
	padding: 0 ${theme.spacing(0.25)};
	border: 0;
	background: transparent;
	color: ${theme.palette.text.primary};
	font-size: ${theme.typography.pxToRem(11)};
	font-weight: 700;
	text-align: center;
	cursor: grab;
	overflow: hidden;
	line-height: 1.4;
	touch-action: none;
}
& [data-water-ui~="node-art"] {
	height: 86px;
}
& [data-water-ui~="art"] {
	display: block;
	width: 100%;
	height: 100%;
	overflow: visible;
}
& [data-water-ui~="node-readings"] {
	text-align: center;
	min-height: 34px;
	display: flex;
	flex-direction: column;
	gap: ${theme.spacing(0.25)};
}
& [data-water-ui~="node-readings"] strong {
	font-size: ${theme.typography.pxToRem(12)};
	font-weight: 700;
	color: ${theme.palette.text.primary};
}
& [data-water-ui~="node-readings"] small {
	font-size: ${theme.typography.pxToRem(9)};
	color: ${theme.palette.info.light};
}
& [data-water-ui~="node-readings"] [data-water-ui~="text-green"] {
	color: ${theme.palette.success.dark};
}
& [data-water-ui~="node-connection"] {
	position: absolute;
	bottom: 6px;
	left: 8px;
	font-size: ${theme.typography.pxToRem(8)};
	color: ${theme.palette.info.light};
}
& [data-water-ui~="node-connection"][data-water-ui~="good"] {
	color: ${theme.palette.success.dark};
}
& [data-water-ui~="port"] {
	position: absolute;
	width: 24px;
	height: 24px;
	padding: 0;
	border: 0;
	background: transparent;
	cursor: crosshair;
	z-index: 2;
}
& [data-water-ui~="port"]::after {
	content: '';
	position: absolute;
	inset: 7px;
	border: 2px solid ${theme.palette.background.paper};
	border-radius: 50%;
	background: ${theme.palette.info.main};
	box-shadow: 0 0 0 1px ${theme.palette.info.main};
}
& [data-water-ui~="port-signal"]::after {
	background: ${theme.palette.info.light};
	box-shadow: 0 0 0 1px ${theme.palette.info.light};
}
& [data-water-ui~="port-left"] {
	left: -12px;
	top: 74px;
}
& [data-water-ui~="port-right"] {
	right: -12px;
	top: 74px;
}
& [data-water-ui~="port-top"] {
	top: -12px;
	left: calc(50% - 12px);
}
& [data-water-ui~="port-bottom"] {
	bottom: -12px;
	left: calc(50% - 12px);
}
& [data-water-ui~="port"]:disabled {
	cursor: default;
}
& [data-water-ui~="port"]:disabled::after {
	opacity: 0.45;
}
& [data-water-ui~="motor-switch"] {
	position: absolute;
	bottom: 4px;
	right: 6px;
	display: inline-flex;
	align-items: center;
	gap: ${theme.spacing(0.625)};
	min-width: 57px;
	height: 24px;
	padding: ${theme.spacing(0.375)} ${theme.spacing(0.625)} ${theme.spacing(
		0.375
	)} ${theme.spacing(0.875)};
	border: 1px solid ${alpha(theme.palette.info.main, 0.28)};
	border-radius: ${theme.spacing(1.875)};
	background: ${theme.palette.background.paper};
	color: ${theme.palette.info.light};
	font-size: ${theme.typography.pxToRem(9)};
	font-weight: 700;
}
& [data-water-ui~="motor-switch"] i {
	width: 15px;
	height: 15px;
	border-radius: 50%;
	background: ${theme.palette.background.paper};
	box-shadow: 0 1px 3px ${alpha(theme.palette.info.dark, 0.15)};
}
& [data-water-ui~="switch-on"] {
	background: ${alpha(theme.palette.info.main, 0.16)};
	border-color: ${theme.palette.success.light};
	color: ${theme.palette.success.dark};
}
& [data-water-ui~="motor-switch"]:disabled {
	cursor: not-allowed;
	opacity: 0.65;
}
& [data-water-ui~="inspector"] {
	border-left: 1px solid ${alpha(theme.palette.info.main, 0.16)};
}
& [data-water-ui~="panel-title"] > button {
	border: 0;
	background: ${theme.palette.background.paper};
	border-radius: ${theme.spacing(0.875)};
	width: 28px;
	height: 28px;
	color: ${theme.palette.info.light};
	font-size: ${theme.typography.pxToRem(20)};
	cursor: pointer;
}
& [data-water-ui~="inspector"] h3 {
	font-size: ${theme.typography.pxToRem(15)};
	margin: 0;
}
& [data-water-ui~="inspector"] p {
	font-size: ${theme.typography.pxToRem(11)};
	line-height: 1.6;
	margin: 0;
}
& [data-water-ui~="inspector"] small {
	color: ${theme.palette.info.light};
	font-size: ${theme.typography.pxToRem(10)};
	line-height: 1.5;
}
& [data-water-ui~="property-type"] {
	font-size: ${theme.typography.pxToRem(10)};
	align-self: flex-start;
	padding: ${theme.spacing(0.625)} ${theme.spacing(1)};
	background: ${alpha(theme.palette.info.main, 0.07)};
	border-radius: ${theme.spacing(0.75)};
	color: ${theme.palette.info.dark};
}
& [data-water-ui~="position-fields"] {
	display: flex;
	gap: ${theme.spacing(1)};
}
& [data-water-ui~="position-fields"] .MuiTextField-root {
	min-width: 0;
	flex: 1;
}
& [data-water-ui~="inspector"] dl {
	display: grid;
	grid-template-columns: 1fr 1fr;
	margin: 0;
	gap: ${theme.spacing(1.25)};
	font-size: ${theme.typography.pxToRem(10)};
}
& [data-water-ui~="inspector"] dt {
	color: ${theme.palette.info.light};
}
& [data-water-ui~="inspector"] dd {
	margin: 0;
	overflow-wrap: anywhere;
	color: ${theme.palette.text.primary};
}
& [data-water-ui~="canvas-empty"] {
	position: absolute;
	inset: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	pointer-events: none;
	padding: ${theme.spacing(2.5)};
}
& [data-water-ui~="empty-symbol"] {
	display: grid;
	place-items: center;
	width: 68px;
	height: 68px;
	border: 1px dashed ${alpha(theme.palette.info.main, 0.28)};
	border-radius: ${theme.spacing(2.25)};
	color: ${theme.palette.info.light};
	background: ${theme.palette.background.paper};
	font-size: ${theme.typography.pxToRem(32)};
	margin-bottom: ${theme.spacing(1.875)};
}
& [data-water-ui~="canvas-empty"] h2 {
	margin: 0;
	font-size: ${theme.typography.pxToRem(20)};
	font-weight: 600;
	color: ${theme.palette.info.dark};
	letter-spacing: -0.4px;
}
& [data-water-ui~="canvas-empty"] p {
	font-size: ${theme.typography.pxToRem(12)};
	color: ${theme.palette.info.light};
	margin: ${theme.spacing(1)} 0;
}
& [data-water-ui~="canvas-empty"] small {
	font-size: ${theme.typography.pxToRem(10)};
	color: ${theme.palette.info.light};
}
& [data-water-ui~="canvas-controls"] {
	position: absolute;
	bottom: 16px;
	left: 16px;
	display: flex;
	align-items: center;
	gap: ${theme.spacing(0.25)};
	padding: ${theme.spacing(0.5)};
	border: 1px solid ${alpha(theme.palette.info.main, 0.16)};
	border-radius: ${theme.spacing(1.25)};
	background: ${alpha(theme.palette.background.paper, 0.95)};
	box-shadow: 0 2px 12px ${alpha(theme.palette.info.dark, 0.07)};
}
& [data-water-ui~="canvas-controls"] button {
	border: 0;
	border-radius: ${theme.spacing(0.75)};
	background: transparent;
	padding: ${theme.spacing(0.875)} ${theme.spacing(1.125)};
	min-height: 34px;
	color: ${theme.palette.info.light};
	font-size: ${theme.typography.pxToRem(11)};
	cursor: pointer;
}
& [data-water-ui~="canvas-controls"] button:hover,
& [data-water-ui~="canvas-controls"] [data-water-ui~="control-active"] {
	color: ${theme.palette.info.main};
	background: ${alpha(theme.palette.info.main, 0.07)};
}
& [data-water-ui~="canvas-controls"] > span {
	font-size: ${theme.typography.pxToRem(9)};
	color: ${theme.palette.info.light};
	padding: 0 ${theme.spacing(0.375)};
}
& [data-water-ui~="canvas-caption"] {
	position: absolute;
	bottom: 27px;
	right: 14px;
	font-size: ${theme.typography.pxToRem(8)};
	color: ${theme.palette.info.light};
	pointer-events: none;
}
& [data-water-ui~="connect-hint"] {
	position: absolute;
	top: 10px;
	left: 10px;
	right: 10px;
	font-size: ${theme.typography.pxToRem(11)};
	color: ${theme.palette.info.main};
	background: ${alpha(theme.palette.info.main, 0.93)};
	border: 1px solid ${alpha(theme.palette.info.main, 0.28)};
	border-radius: ${theme.spacing(1)};
	padding: ${theme.spacing(1.125)};
}
& [data-water-ui~="connect-hint"] button {
	margin-left: ${theme.spacing(1)};
	border: 0;
	background: transparent;
	color: ${theme.palette.info.dark};
	text-decoration: underline;
	cursor: pointer;
}
& [data-water-ui~="footer"] {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: ${theme.spacing(1.5)};
	flex-wrap: wrap;
	padding: 0 ${theme.spacing(0.375)};
	color: ${theme.palette.info.light};
	font-size: ${theme.typography.pxToRem(9)};
}
& [data-water-ui~="footer"] > span:first-child {
	display: inline-flex;
	align-items: center;
	gap: ${theme.spacing(0.75)};
	flex-wrap: wrap;
}
& [data-water-ui~="footer"] i {
	display: inline-block;
	width: 17px;
	height: 3px;
	border-radius: ${theme.spacing(0.25)};
	margin-left: ${theme.spacing(0.625)};
}
& [data-water-ui~="legend-flow"] {
	background: ${theme.palette.info.main};
}
& [data-water-ui~="legend-still"] {
	background: ${theme.palette.info.light};
}
& [data-water-ui~="legend-unknown"] {
	background: repeating-linear-gradient(
		90deg,
		${alpha(theme.palette.info.main, 0.28)} 0 4px,
		transparent 4px 6px
	);
}
& [data-water-ui~="impeller"] {
	transform-box: fill-box;
	transform-origin: center;
}
& [data-water-ui~="art-running"] [data-water-ui~="impeller"] {
	animation: sc-spin 1.6s linear infinite;
}
& [data-water-ui~="water-wave"] {
	animation: sc-wave 3s linear infinite;
}
& [data-water-ui~="water-bubble"] {
	animation: sc-bubble 3.5s ease-in infinite;
}
@keyframes sc-water-flow {
	to {
		stroke-dashoffset: -38;
	}
}
@keyframes sc-spin {
	to {
		transform: rotate(360deg);
	}
}
@keyframes sc-wave {
	to {
		transform: translateX(-40px);
	}
}
@keyframes sc-bubble {
	from {
		opacity: 0;
		transform: translateY(0);
	}
	30% {
		opacity: 0.5;
	}
	to {
		opacity: 0;
		transform: translateY(calc(-1 * var(--rise)));
	}
}
& button:focus-visible,
& input:focus-visible,
& select:focus-visible {
	outline: 2px solid ${theme.palette.info.main};
	outline-offset: 2px;
}
@container scada (max-width: 1050px) {
	& [data-water-ui~="workspace"][data-water-ui~="with-library"][data-water-ui~="with-inspector"] {
		grid-template-columns: 220px minmax(0, 1fr);
	}
	& [data-water-ui~="with-inspector"] [data-water-ui~="inspector"] {
		position: absolute;
		right: 0;
		top: 0;
		bottom: 0;
		width: 265px;
		max-height: none;
		box-shadow: -8px 0 25px ${alpha(theme.palette.info.dark, 0.09)};
	}
	& [data-water-ui~="canvas-caption"] {
		display: none;
	}
}
@container scada (max-width: 750px) {
	& [data-water-ui~="workspace"][data-water-ui~="with-library"],
	& [data-water-ui~="workspace"][data-water-ui~="with-inspector"],
	& [data-water-ui~="workspace"][data-water-ui~="with-library"][data-water-ui~="with-inspector"] {
		grid-template-columns: minmax(0, 1fr);
	}
	& [data-water-ui~="library"] {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 220px;
		max-height: none;
		box-shadow: 6px 0 20px ${alpha(theme.palette.info.dark, 0.09)};
	}
	& [data-water-ui~="header"] {
		gap: ${theme.spacing(1)};
	}
	& [data-water-ui~="heading"] h1 {
		font-size: ${theme.typography.pxToRem(20)};
	}
	& [data-water-ui~="heading-icon"] {
		width: 36px;
		height: 36px;
	}
	& [data-water-ui~="layout-status"] {
		margin-left: 0;
	}
	& [data-water-ui~="toolbar"] > .MuiTextField-root {
		flex: 1 1 160px;
		width: auto;
	}
	& [data-water-ui~="toolbar-modes"] {
		flex-basis: 100%;
	}
	& [data-water-ui~="editor-actions"] > span {
		display: none;
	}
}
@media (pointer: coarse) {
	& [data-water-ui~="port"] {
		width: 32px;
		height: 32px;
	}
	& [data-water-ui~="port-left"] {
		left: -16px;
		top: 70px;
	}
	& [data-water-ui~="port-right"] {
		right: -16px;
		top: 70px;
	}
	& [data-water-ui~="port-top"] {
		top: -16px;
		left: calc(50% - 16px);
	}
	& [data-water-ui~="port-bottom"] {
		bottom: -16px;
		left: calc(50% - 16px);
	}
	& [data-water-ui~="port"]::after {
		inset: 11px;
	}
	& [data-water-ui~="library-item"] > button {
		width: 36px;
		height: 36px;
	}
}
@media (prefers-reduced-motion: reduce) {
	& *,
	& *::before,
	& *::after {
		animation: none !important;
		transition: none !important;
	}
}
& [data-water-ui~="motor-switch"] [data-water-ui~="command-spinner"] {
	background: transparent;
	border: 2px solid ${alpha(theme.palette.info.main, 0.28)};
	border-top-color: ${theme.palette.info.main};
	box-shadow: none;
	animation: sc-spin 1s linear infinite;
}
& [data-water-ui~="switch-manual"],
& [data-water-ui~="switch-manual"][data-water-ui~="switch-on"] {
	color: ${theme.palette.info.light};
	border-color: ${alpha(theme.palette.info.main, 0.28)};
	background: ${theme.palette.background.paper};
	box-shadow: none;
}
& [data-water-ui~="motor-switch"]::before {
	content: '';
	position: absolute;
	inset: -10px -4px;
}
@media (pointer: coarse) {
	& [data-water-ui~="canvas-controls"] button,
	& [data-water-ui~="panel-title"] > button {
		min-width: 44px;
		min-height: 44px;
	}
	& [data-water-ui~="library-item"] > button {
		width: 44px;
		height: 44px;
	}
	& [data-water-ui~="port"] {
		width: 44px;
		height: 44px;
	}
	& [data-water-ui~="port-left"] {
		left: -22px;
		top: 64px;
	}
	& [data-water-ui~="port-right"] {
		right: -22px;
		top: 64px;
	}
	& [data-water-ui~="port-top"] {
		top: -22px;
		left: calc(50% - 22px);
	}
	& [data-water-ui~="port-bottom"] {
		bottom: -22px;
		left: calc(50% - 22px);
	}
	& [data-water-ui~="port"]::after {
		inset: 17px;
	}
}
& .MuiInputBase-input {
	color: ${theme.palette.text.primary};
}
& .MuiInputBase-input.Mui-disabled {
	-webkit-text-fill-color: ${theme.palette.info.light};
}
& .MuiInputLabel-root,
& .MuiSelect-icon {
	color: ${theme.palette.info.light};
}
& [data-water-ui~="header"] .MuiChip-root {
	color: ${theme.palette.warning.dark};
}
& [data-water-ui~="header"] .MuiChip-colorInfo {
	color: ${theme.palette.info.main};
}
& .MuiButton-text,
& .MuiButton-outlined {
	color: ${theme.palette.info.main};
}
& .MuiButton-colorError {
	color: ${theme.palette.error.main};
}
& .MuiButton-root.Mui-disabled {
	color: ${theme.palette.info.light};
}

`
);
