import { PowerSettingsNewRounded } from '@mui/icons-material';
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Switch,
	Tooltip,
	Typography,
} from '@mui/material';
import { useState } from 'react';

import { motorControlReason } from './motorCommandState';

// checked is controlled exclusively by telemetry, never by user intent or ACKs.
export default function WaterMotorControl({
	machine,
	state,
	title,
	preview,
	control,
	failed,
}) {
	const [confirm, setConfirm] = useState(null);
	const reason =
		preview || !control
			? 'Motor control is unavailable.'
			: motorControlReason(machine, state, {
					locked: control.locked,
					failed,
					blockedReason: control.blockedReason,
			  });
	const label =
		state.motor === 'Running'
			? 'ON'
			: state.motor === 'Stopped'
			  ? 'OFF'
			  : 'Unknown';
	return (
		<>
			<Box
				className={`wm-motor-control wm-motor-user-control wm-control-${state.motor.toLowerCase()} wm-control-mode-${state.mode.toLowerCase()}`}
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
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
							<Typography>Motor Control</Typography>
							{control?.busy && (
								<CircularProgress
									size={14}
									color="inherit"
									aria-label="Updating motor status"
								/>
							)}
						</Box>
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
							disabled={Boolean(reason)}
							onChange={(_, checked) => setConfirm(checked ? 1 : 0)}
							checked={state.motor === 'Running'}
							inputProps={{ 'aria-label': `${title} motor control` }}
						/>
					</span>
				</Tooltip>
			</Box>
			<Dialog
				open={confirm !== null}
				onClose={() => setConfirm(null)}
				maxWidth="xs"
				fullWidth
				aria-labelledby="motor-confirm-title"
				PaperProps={{ sx: { borderRadius: 3 } }}
			>
				<DialogTitle
					id="motor-confirm-title"
					sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
				>
					<PowerSettingsNewRounded
						sx={{
							color: confirm === 1 ? 'success.main' : 'warning.main',
							bgcolor: 'action.hover',
							borderRadius: 2,
							p: 0.75,
							width: 40,
							height: 40,
						}}
					/>
					{confirm === 1 ? 'Turn ON Motor?' : 'Turn OFF Motor?'}
				</DialogTitle>
				<DialogContent>
					<Typography sx={{ mb: 1 }}>
						{confirm === 1
							? 'Are you sure you want to start this motor?'
							: 'Are you sure you want to stop this motor?'}
					</Typography>
					<Typography fontWeight={700} sx={{ overflowWrap: 'anywhere' }}>
						{title}
					</Typography>
					{(reason ||
						(confirm !== null &&
							confirm !== (state.motor === 'Running' ? 0 : 1))) && (
						<Alert severity="warning" sx={{ mt: 2 }}>
							{reason ||
								'Motor status changed. Review its current status before trying again.'}
						</Alert>
					)}
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
					<Button onClick={() => setConfirm(null)} color="inherit">
						Cancel
					</Button>
					<Button
						variant="contained"
						color={confirm === 1 ? 'success' : 'warning'}
						disabled={
							Boolean(reason) || confirm !== (state.motor === 'Running' ? 0 : 1)
						}
						onClick={() => {
							const action = confirm;
							setConfirm(null);
							if (
								!reason &&
								action !== null &&
								action === (state.motor === 'Running' ? 0 : 1)
							) {
								control.submit(machine, action);
							}
						}}
					>
						{confirm === 1 ? 'Yes, Turn ON' : 'Yes, Turn OFF'}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
