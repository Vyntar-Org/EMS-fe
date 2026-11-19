import { PowerSettingsNewRounded } from '@mui/icons-material';
import {
	Box,
	CircularProgress,
	Switch,
	Tooltip,
	Typography,
} from '@mui/material';

import { motorControlReason } from './motorCommandState';

// checked is controlled exclusively by telemetry, never by user intent or ACKs.
export default function WaterMotorControl({
	machine,
	state,
	title,
	preview,
	control,
	failed,
	onRequest,
}) {
	const waiting = Boolean(
		control?.dialog &&
			!control.dialog.message &&
			String(control.dialog.slaveId) === String(machine.slave_id)
	);
	const reason = motorControlReason(machine, state, {
		unavailable: preview || !control || !onRequest,
		locked: control?.locked,
		failed,
		onRequest,
		blockedReason: control?.blockedReason,
	});
	const canControlMotor = !reason;
	const label =
		state.motor === 'Running'
			? 'ON'
			: state.motor === 'Stopped'
			  ? 'OFF'
			  : 'Unknown';
	return (
		<>
			<Box
				className={`wm-motor-control wm-motor-user-control wm-control-${state.motor.toLowerCase()}`}
			>
				<Box className="wm-control-label">
					<svg
						className={`wm-control-motor ${
							state.motor === 'Running' ? 'wm-control-motor-active' : ''
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
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
							<Typography>Motor Control</Typography>
							{waiting && (
								<CircularProgress
									size={14}
									color="info"
									aria-label="Awaiting motor confirmation"
									sx={{
										'@media (prefers-reduced-motion: reduce)': {
											animation: 'none',
											'& circle': { animation: 'none' },
										},
									}}
								/>
							)}
						</Box>
					</Box>
				</Box>
				<Tooltip title={reason} describeChild>
					<span
						className={`wm-toggle-target${
							canControlMotor ? ' wm-toggle-enabled' : ''
						}`}
						tabIndex={canControlMotor ? undefined : 0}
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
							disabled={!canControlMotor}
							onChange={(_, checked) => onRequest(machine, checked ? 1 : 0)}
							checked={state.motor === 'Running'}
							inputProps={{ 'aria-label': `${title} motor control` }}
						/>
					</span>
				</Tooltip>
			</Box>
		</>
	);
}
