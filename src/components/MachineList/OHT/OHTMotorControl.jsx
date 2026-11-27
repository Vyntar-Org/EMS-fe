import { AutorenewRounded, StopRounded } from '@mui/icons-material';
import { Box, CircularProgress, Tooltip, Typography } from '@mui/material';

import { motorControlReason } from '../../OHT/useOHTMotorCommand';

// checked is controlled exclusively by telemetry, never by user intent or ACKs.
export default function OHTMotorControl({
	machine,
	state,
	title,
	preview,
	control,
	controlTypePending,
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
		locked: control?.locked || controlTypePending,
		failed,
		blockedReason: control?.blockedReason,
	});
	const canControlMotor = !reason;
	const tooltip =
		reason ||
		(machine.control_type === null
			? 'The device has not reported its control type.'
			: '');
	const isRunning = state.motor === 'Running';
	const label = isRunning
		? 'ON'
		: state.motor === 'Stopped'
		  ? 'OFF'
		  : 'Unknown';
	return (
		<Box
			data-water-ui={`motor-control motor-user-control control-${state.motor.toLowerCase()}`}
			data-control-enabled={canControlMotor || undefined}
		>
			<Box data-water-ui="motor-feedback">
				<svg
					data-water-ui={`control-motor ${
						state.motor === 'Running' ? 'control-motor-active' : ''
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
					<g data-water-ui="control-rotor">
						<path
							d="M14 16v16M6 24h16m-14-6 12 12m-12 0 12-12"
							stroke="currentColor"
							strokeWidth="2"
						/>
					</g>
					<circle cx="14" cy="24" r="3" fill="currentColor" />
				</svg>
				<Box>
					<Typography data-water-ui="status-label">Motor Run Status</Typography>
					<span
						data-water-ui={`motor-status motor-${state.motor.toLowerCase()}${
							preview ? ' motor-preview' : ''
						}`}
					>
						{state.motor === 'Stopped' ? <StopRounded /> : <AutorenewRounded />}
						{state.motor}
						{preview && state.motor === 'Running' && (
							<span data-water-ui="status-demo">Demo</span>
						)}
					</span>
				</Box>
			</Box>
			<Box data-water-ui="motor-command">
				<Box>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
						<Typography data-water-ui="status-label">Motor Control</Typography>
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
				<Tooltip title={tooltip} describeChild>
					<span
						data-water-ui={`toggle-target motor-state-toggle${
							canControlMotor ? ' toggle-enabled' : ''
						}`}
						tabIndex={canControlMotor ? undefined : 0}
						role="group"
						aria-label={`${title}: Motor control ${label}. ${reason}`}
					>
						<Box
							component="button"
							type="button"
							role="switch"
							aria-checked={isRunning}
							aria-label={`${title} motor control (reported: ${label})`}
							disabled={!canControlMotor}
							onClick={() => onRequest(machine, isRunning ? 0 : 1)}
							sx={{
								display: 'inline-flex',
								flexDirection: isRunning ? 'row-reverse' : 'row',
								alignItems: 'center',
								boxSizing: 'border-box',
								width: 64,
								height: 28,
								p: '3px',
								border: 0,
								borderRadius: 999,
								bgcolor: isRunning && canControlMotor ? '#16A34A' : '#69737c',
								color: '#fff',
								cursor: canControlMotor ? 'pointer' : 'not-allowed',
								'&:disabled': { pointerEvents: 'none' },
								'&:focus-visible': {
									outline: '2px solid',
									outlineColor: 'info.main',
									outlineOffset: 2,
								},
							}}
						>
							<Box
								component="span"
								aria-hidden="true"
								sx={{
									width: 22,
									height: 22,
									flexShrink: 0,
									borderRadius: '50%',
									background: 'linear-gradient(145deg, #fff, #e9edf2)',
									boxShadow: '0 1px 4px rgba(15, 23, 42, 0.36)',
								}}
							/>
							<Box
								component="span"
								aria-hidden="true"
								sx={{
									flex: 1,
									fontSize: '0.65rem',
									fontWeight: 800,
									lineHeight: 1,
									textAlign: 'center',
								}}
							>
								{label === 'Unknown' ? '?' : label}
							</Box>
						</Box>
					</span>
				</Tooltip>
			</Box>
		</Box>
	);
}
