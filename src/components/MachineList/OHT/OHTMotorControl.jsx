import {
	AutorenewRounded,
	StopRounded,
	WarningRounded,
} from '@mui/icons-material';
import { Box, Tooltip, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';

import { commandErrorMessage } from '../../OHT/motorOperation';
import {
	getWaterMotorStatus,
	motorControlReason,
} from '../../OHT/useOHTMotorCommand';

import InlineControlStatus from './InlineControlStatus';

// checked is controlled exclusively by telemetry, never by user intent or ACKs.
export default function OHTMotorControl({
	machine,
	scope,
	state,
	title,
	preview,
	control,
	controlTypePending,
	inline,
	failed,
	onRequest,
}) {
	const progressLabel = 'Inprogress';
	const eligibilityReason = motorControlReason(machine, state, {
		unavailable: preview || !control || !onRequest,
		locked: control?.locked || controlTypePending,
		failed,
		blockedReason: control?.blockedReason,
	});
	const reason =
		(inline && progressLabel) ||
		eligibilityReason ||
		(state.mode === 'Manual'
			? 'This motor is in Manual mode. Remote ON/OFF control is disabled.'
			: '');
	const canControlMotor = !reason;
	const controlHint =
		reason ||
		(machine.control_type === null
			? 'The device has not reported its control type.'
			: '');
	const lastCommand = machine.last_command;
	const lastCommandId = lastCommand?.id ?? lastCommand?.command_id;
	const hasCommandId = lastCommandId !== undefined && lastCommandId !== null;
	const statusCommand = control?.command;
	const matchingStatusFailure =
		hasCommandId &&
		String(lastCommandId) === String(statusCommand?.id) &&
		statusCommand?.status === 'FAILED';
	const reportedFailure =
		String(lastCommand?.status ?? '')
			.trim()
			.toUpperCase() === 'FAILED';
	const hasFailedCommand = reportedFailure || matchingStatusFailure;
	const reportedError = reportedFailure ? commandErrorMessage(lastCommand) : '';
	const observedError = matchingStatusFailure
		? commandErrorMessage(statusCommand)
		: '';
	// Some list responses report a failed status without its error details.
	const failedStatus = useQuery({
		queryKey: [
			'water-monitor',
			scope,
			'failed-command-details',
			machine.device_uid,
			lastCommandId,
		],
		queryFn: ({ signal }) =>
			getWaterMotorStatus({
				commandId: lastCommandId,
				deviceUid: machine.device_uid,
				signal,
			}),
		enabled: Boolean(
			scope &&
				machine.device_uid &&
				hasFailedCommand &&
				!preview &&
				hasCommandId &&
				!reportedError &&
				!observedError
		),
		staleTime: Infinity,
		retry: false,
		refetchOnWindowFocus: false,
	});
	const commandError =
		reportedError ||
		observedError ||
		(failedStatus.data?.status === 'FAILED'
			? commandErrorMessage(failedStatus.data)
			: '');
	const tooltip = hasFailedCommand ? (
		<Box sx={{ overflowWrap: 'anywhere' }}>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					gap: 0.5,
					fontWeight: 700,
				}}
			>
				<WarningRounded
					sx={{ fontSize: 16, color: '#F59E0B', flexShrink: 0 }}
				/>
				Motor Command Failed
			</Box>
			<Box sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{commandError}</Box>
			{controlHint && <Box sx={{ mt: 0.75 }}>{controlHint}</Box>}
		</Box>
	) : (
		controlHint
	);
	const isRunning = state.motor === 'Running';
	const feedback = inline
		? progressLabel
		: state.motor === 'Stopped'
		  ? 'Stop'
		  : state.motor;
	const motorColor = {
		Running: '#16A34A',
		Stopped: '#DC2626',
		Unknown: '#64748B',
	}[state.motor];
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
						isRunning && !inline ? 'control-motor-active' : ''
					}`}
					viewBox="0 0 64 48"
					style={{ color: inline ? 'inherit' : motorColor }}
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
						data-water-ui={`motor-status motor-${
							inline ? 'updating' : state.motor.toLowerCase()
						}${preview ? ' motor-preview' : ''}`}
					>
						{!inline && state.motor === 'Stopped' ? (
							<StopRounded />
						) : (
							<AutorenewRounded />
						)}
						{feedback}
						{preview && isRunning && (
							<span data-water-ui="status-demo">Demo</span>
						)}
					</span>
				</Box>
			</Box>
			<Box data-water-ui="motor-command">
				<Box>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
						<Typography data-water-ui="status-label">
							<InlineControlStatus
								loading={inline}
								message={progressLabel}
								text="Inprogr..."
							>
								{!inline && 'Motor Control'}
							</InlineControlStatus>
						</Typography>
					</Box>
				</Box>
				<Tooltip
					title={tooltip}
					describeChild
					placement="top"
					slotProps={{
						tooltip: {
							sx: { borderRadius: 2, boxShadow: 3, fontSize: '0.75rem' },
						},
					}}
				>
					<span
						data-water-ui={`toggle-target motor-state-toggle${
							canControlMotor ? ' toggle-enabled' : ''
						}`}
						tabIndex={canControlMotor ? undefined : 0}
						role="group"
						aria-label={`${title}: Motor control ${label}. ${reason}${
							hasFailedCommand ? ' Motor Command Failed.' : ''
						}`}
					>
						{hasFailedCommand && (
							<WarningRounded
								aria-hidden="true"
								sx={{
									fontSize: 18,
									color: '#F59E0B',
									borderRadius: 1,
									backgroundColor: 'rgba(245, 158, 11, 0.12)',
									flexShrink: 0,
								}}
							/>
						)}
						<Box
							component="button"
							type="button"
							role="switch"
							aria-checked={isRunning}
							aria-label={`${title} motor control (reported: ${label})${
								hasFailedCommand ? '. Motor Command Failed.' : ''
							}`}
							disabled={!canControlMotor}
							onClick={() => onRequest(machine, isRunning ? 0 : 1)}
							sx={{
								display: 'inline-flex',
								flexDirection: isRunning ? 'row-reverse' : 'row',
								alignItems: 'center',
								boxSizing: 'border-box',
								position: 'relative',
								width: 68,
								height: 32,
								p: '3px',
								border: 0,
								borderRadius: 999,
								bgcolor:
									!inline && (canControlMotor || isRunning)
										? motorColor
										: '#64748B',
								color: '#fff',
								cursor: canControlMotor ? 'pointer' : 'not-allowed',
								'&::before': {
									content: '""',
									position: 'absolute',
									inset: '-6px 0',
								},
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
									width: 26,
									height: 26,
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
