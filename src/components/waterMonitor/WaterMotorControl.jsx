import { Box, Switch, Tooltip, Typography } from '@mui/material';
import { PowerSettingsNewRounded } from '@mui/icons-material';

// No command transport/capability contract exists yet. Fail closed in every mode.
// checked is controlled exclusively by telemetry, never by user intent or ACKs.
export default function WaterMotorControl({ state, title, preview }) {
	const reason =
		state.mode === 'Manual'
			? 'Motor control disabled in Manual mode.'
			: state.mode !== 'Auto'
			  ? 'Motor control is unavailable until Auto mode is confirmed.'
			  : preview
			    ? 'Demo data: equipment commands are disabled.'
			    : state.unavailable || state.motor === 'Unknown'
			      ? 'Current motor feedback and verified device connectivity are required.'
			      : 'Remote control is unavailable: backend authorization, commissioning and gateway interlocks are not configured.';
	const label =
		state.motor === 'Running'
			? 'ON'
			: state.motor === 'Stopped'
			  ? 'OFF'
			  : 'Unknown';
	return (
		<Box
			className={`wm-motor-control wm-control-${state.motor.toLowerCase()} wm-control-mode-${state.mode.toLowerCase()}`}
		>
			<Box className="wm-control-label">
				<svg
					className={`wm-control-motor ${
						state.mode === 'Auto' && state.motor === 'Running'
							? 'wm-control-motor-active'
							: ''
					}`}
					viewBox="0 0 64 48"
					aria-hidden="true"
				>
					<path
						d="M7 36h45v5H7zM15 10h30v27H15z"
						fill="currentColor"
						opacity=".16"
					/>
					<rect
						x="13"
						y="12"
						width="34"
						height="23"
						rx="5"
						fill="currentColor"
						opacity=".75"
					/>
					<path
						d="M23 16v15m6-15v15m6-15v15m6-15v15"
						stroke="white"
						strokeOpacity=".6"
						strokeWidth="2"
					/>
					<path d="M25 6h13v7H25zM47 20h10v7H47z" fill="currentColor" />
					<circle
						cx="14"
						cy="24"
						r="11"
						fill="#e5edf3"
						stroke="currentColor"
						strokeWidth="2"
					/>
					<g className="wm-control-rotor">
						<path
							d="M14 16v16M6 24h16m-14-6 12 12m-12 0 12-12"
							stroke="currentColor"
							strokeWidth="2"
						/>
					</g>
					<circle cx="14" cy="24" r="3" fill="currentColor" />
				</svg>
				<Box>
					<Typography>Motor Control</Typography>
					<Typography className="wm-control-caption">
						{state.mode === 'Manual'
							? 'Manual mode'
							: preview
							  ? 'Demo control'
							  : 'Remote unavailable'}
					</Typography>
				</Box>
			</Box>
			<Tooltip title={reason} describeChild>
				<span
					className="wm-toggle-target"
					tabIndex={0}
					role="group"
					aria-label={`${title}: Motor control ${label}. ${reason}`}
				>
					<Typography component="span" className="wm-toggle-state">
						<span className="wm-control-led" />
						{label}
					</Typography>
					<Switch
						icon={
							<span className="wm-power-thumb">
								<PowerSettingsNewRounded />
							</span>
						}
						checkedIcon={
							<span className="wm-power-thumb">
								<PowerSettingsNewRounded />
							</span>
						}
						className="wm-industrial-switch"
						color="success"
						disabled
						checked={state.motor === 'Running'}
						inputProps={{ 'aria-label': `${title} motor control` }}
					/>
				</span>
			</Tooltip>
		</Box>
	);
}
