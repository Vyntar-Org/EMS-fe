import {
	CheckRounded,
	CloseRounded,
	PersonOutlineRounded,
	Refresh,
	WavesRounded,
	WarningAmberRounded,
} from '@mui/icons-material';
import {
	Alert,
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Typography,
	useMediaQuery,
} from '@mui/material';
import { keyframes } from '@mui/material/styles';
import { useId, useState } from 'react';

const turn = keyframes`
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
`;
const pulse = keyframes`
	0%, 100% { opacity: .16; }
	50% { opacity: .46; }
`;
const appear = keyframes`
	from { opacity: 0; transform: scale(.72); }
	to { opacity: 1; transform: scale(1); }
`;
const shake = keyframes`
	0%, 100% { transform: translateX(0); }
	25% { transform: translateX(-3px); }
	75% { transform: translateX(3px); }
`;

function PumpIllustration({ starting, loading }) {
	const metal = useId();
	return (
		<Box
			component="svg"
			viewBox="0 0 240 140"
			aria-hidden="true"
			sx={{
				width: 'min(100%, 220px)',
				height: 'auto',
				display: 'block',
				mx: 'auto',
				color: starting ? '#00867a' : '#477797',
				'& [data-pump-part="ring"], & [data-pump-part="rotor"]': {
					transformOrigin: '85px 75px',
					animation: `${turn} ${
						starting ? '1.4s linear' : '2.8s ease-out'
					} infinite`,
				},
				'& [data-pump-part="ring"]': {
					animation: `${turn} 1.6s linear infinite`,
				},
				'& [data-pump-part="halo"]': {
					animation: `${pulse} 2s ease-in-out infinite`,
				},
				'@media (prefers-reduced-motion: reduce)': {
					'& [data-pump-part]': { animation: 'none' },
				},
			}}
		>
			<defs>
				<linearGradient id={metal} x2="0" y2="1">
					<stop stopColor={loading && starting ? '#b3e1d9' : '#b9d5e6'} />
					<stop
						offset=".45"
						stopColor={loading && starting ? '#41988e' : '#6389a4'}
					/>
					<stop
						offset="1"
						stopColor={loading && starting ? '#245b63' : '#294a64'}
					/>
				</linearGradient>
			</defs>
			<ellipse cx="122" cy="120" rx="89" ry="7" fill="#a1bdcd" opacity=".32" />
			<path d="M62 106h116l10 10H52z" fill="#35546b" />
			<path d="M113 91h20v17h-20zm36 0h18v17h-18z" fill="#496b82" />
			<rect
				x="91"
				y="49"
				width="91"
				height="53"
				rx="12"
				fill={`url(#${metal})`}
			/>
			<path
				d="M115 57h56m-56 9h59m-59 9h59m-59 9h59m-59 9h56"
				stroke="#d5e8f2"
				strokeWidth="2.5"
				opacity=".68"
			/>
			<path d="M130 49V37h29v12m22 15h15v23h-15" fill="#426780" />
			<path
				d="M69 55V29h32v27M65 32h40v-8H65z"
				fill="#6389a4"
				stroke="#345770"
				strokeWidth="2"
			/>
			<circle
				cx="85"
				cy="75"
				r="28"
				fill={`url(#${metal})`}
				stroke="#2b536e"
				strokeWidth="2"
			/>
			<circle
				cx="85"
				cy="75"
				r="18"
				fill="#e7f2f8"
				stroke="#597e97"
				strokeWidth="2"
			/>
			<path
				data-pump-part="rotor"
				d="M85 61v28M71 75h28m-24-10 20 20m-20 0 20-20"
				stroke="#527994"
				strokeWidth="3"
				strokeLinecap="round"
			/>
			<circle cx="85" cy="75" r="4.5" fill="#294a64" />
			{loading && (
				<>
					<circle
						data-pump-part="halo"
						cx="85"
						cy="75"
						r="37"
						fill="none"
						stroke="currentColor"
						opacity=".18"
						strokeWidth="3"
					/>
					<circle
						data-pump-part="ring"
						cx="85"
						cy="75"
						r="37"
						fill="none"
						stroke="currentColor"
						strokeWidth="3"
						strokeLinecap="round"
						strokeDasharray="64 169"
					/>
				</>
			)}
		</Box>
	);
}

export default function MotorOperationDialog({
	operation,
	confirmation,
	confirmationReason,
	controlType = false,
	requestError,
	onConfirm,
	onClose,
	onRefresh,
}) {
	const id = useId();
	const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
	const [refreshing, setRefreshing] = useState(false);
	const [refreshMessage, setRefreshMessage] = useState('');
	const confirming = !operation;
	const loading = Boolean(operation && !operation.message);
	const success = operation?.severity === 'success';
	const warning = operation?.severity === 'warning';
	const starting = (operation ?? confirmation).action === 1;
	const controlTypeName = starting ? 'Level Control' : 'User Control';
	const ControlTypeIcon = starting ? WavesRounded : PersonOutlineRounded;
	const verb = starting ? 'Start' : 'Stop';
	const ResultIcon = success
		? CheckRounded
		: warning
		  ? WarningAmberRounded
		  : CloseRounded;
	const tone = success ? 'success' : 'error';
	const motorTitle = confirming
		? `${verb} Motor?`
		: loading
		  ? starting
				? 'Starting Motor'
				: 'Stopping Motor'
		  : success
		    ? operation.message
		    : warning
		      ? 'Motor Status Unconfirmed'
		      : `Unable to ${verb} Motor`;
	const title = controlType
		? loading
			? `Switching to ${controlTypeName}`
			: `Switch to ${controlTypeName}?`
		: motorTitle;

	async function refresh() {
		setRefreshing(true);
		setRefreshMessage('');
		try {
			await onRefresh();
			setRefreshMessage('Motor status refreshed.');
		} catch {
			setRefreshMessage('Unable to refresh motor status. Please try again.');
		} finally {
			setRefreshing(false);
		}
	}

	return (
		<Dialog
			open
			onClose={loading || success ? undefined : onClose}
			disableEscapeKeyDown={loading || success}
			transitionDuration={reduceMotion ? 0 : undefined}
			aria-labelledby={id + '-title'}
			aria-describedby={id + '-status'}
			scroll="body"
			maxWidth="sm"
			fullWidth
			PaperProps={{
				sx: {
					display: 'inline-flex',
					flexDirection: 'column',
					justifyContent: confirming ? 'flex-start' : 'center',
					m: { xs: 2, sm: 4 },
					width: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
					maxWidth: 600,
					minHeight: { sm: confirming ? 240 : 300 },
					overflow: 'visible',
					borderRadius: '18px',
					backgroundColor: 'background.paper',
					boxShadow: '0 16px 56px rgba(25, 73, 114, .24)',
				},
			}}
		>
			{controlType ? (
				<Box
					aria-hidden="true"
					sx={{
						display: 'grid',
						placeItems: 'center',
						width: 80,
						height: 80,
						mx: 'auto',
						mt: 3,
						borderRadius: '50%',
						bgcolor: 'action.hover',
						color: 'primary.main',
						animation: reduceMotion ? 'none' : `${appear} 220ms ease-out`,
					}}
				>
					<ControlTypeIcon
						sx={{
							fontSize: 42,
							animation:
								loading && !reduceMotion
									? `${pulse} 1.4s ease-in-out infinite`
									: 'none',
						}}
					/>
				</Box>
			) : (
				loading && <PumpIllustration starting={starting} loading />
			)}
			{operation && !loading && (
				<Box
					aria-hidden="true"
					sx={{
						display: 'grid',
						placeItems: 'center',
						width: 64,
						height: 64,
						mx: 'auto',
						mt: 3,
						mb: 1.5,
						borderRadius: '50%',
						border: '2px solid',
						color: tone + '.main',
						animation: reduceMotion ? 'none' : `${appear} 220ms ease-out`,
						'& svg': {
							fontSize: 36,
							animation:
								!reduceMotion && tone === 'error'
									? `${shake} 260ms ease-out 120ms`
									: 'none',
						},
					}}
				>
					<ResultIcon />
				</Box>
			)}
			<DialogTitle
				id={id + '-title'}
				sx={{ textAlign: 'center', pt: confirming ? 2.5 : 0, pb: 0.5 }}
			>
				{title}
			</DialogTitle>
			<DialogContent
				sx={{
					textAlign: 'center',
					flex: confirming ? undefined : '0 0 auto',
					overflow: 'visible',
					px: { xs: 2.5, sm: 4 },
					pb: confirming ? 2 : 3,
				}}
			>
				<Typography fontWeight={700} sx={{ mb: 2, overflowWrap: 'anywhere' }}>
					{(operation ?? confirmation).name}
				</Typography>
				<Box id={id + '-status'}>
					{confirming && (
						<>
							<Typography>
								{controlType
									? starting
										? 'The tank’s water level will control when the motor starts and stops.'
										: 'User Control lets you send On/Off commands when remote control is available.'
									: `Are you sure you want to ${verb.toLowerCase()} this motor?`}
							</Typography>
							{confirmationReason && (
								<Alert severity="warning" sx={{ mt: 2 }}>
									{confirmationReason}
								</Alert>
							)}
							{requestError && (
								<Alert severity="error" sx={{ mt: 2 }}>
									{requestError}
								</Alert>
							)}
						</>
					)}
					{loading && (
						<Typography role="status" color="text.secondary">
							Sending your request. Please wait...
						</Typography>
					)}
					{success && (
						<Box
							role="status"
							sx={{
								position: 'absolute',
								width: 1,
								height: 1,
								overflow: 'hidden',
								clipPath: 'inset(50%)',
							}}
						>
							{title}
						</Box>
					)}
					{operation && !loading && !success && (
						<Alert
							severity={operation.severity}
							sx={{ justifyContent: 'center', textAlign: 'center' }}
						>
							{operation.message}
						</Alert>
					)}
				</Box>
				{refreshMessage && (
					<Typography role="status" variant="body2" sx={{ mt: 1 }}>
						{refreshMessage}
					</Typography>
				)}
			</DialogContent>
			{confirming && (
				<DialogActions sx={{ px: 3, pb: 2.5, gap: 1, flexWrap: 'wrap' }}>
					<Button onClick={onClose} color="inherit">
						Cancel
					</Button>
					<Button
						onClick={onConfirm}
						disabled={Boolean(confirmationReason)}
						variant="contained"
						color={controlType ? 'primary' : starting ? 'success' : 'warning'}
					>
						{controlType ? 'Switch Control Type' : `Yes, ${verb} Motor`}
					</Button>
				</DialogActions>
			)}
			{operation && !loading && !success && (
				<DialogActions sx={{ px: 3, pb: 2.5, flexWrap: 'wrap' }}>
					<Button onClick={onClose} color="inherit">
						Close
					</Button>
					<Button
						onClick={refresh}
						disabled={refreshing}
						startIcon={<Refresh />}
					>
						{refreshing ? 'Refreshing…' : 'Refresh Motor Status'}
					</Button>
				</DialogActions>
			)}
		</Dialog>
	);
}
