import {
	Box,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
} from '@mui/material';

import { MachineRatioDonut, APP_ACCENT_COLOR } from '../../common/MachineCardBits';
import PremiumMachineCard from '../../common/PremiumMachineCard';
import ResponsiveTextWrapper from '../../common/ResponsiveTextWrapper';

const StoppageCount = ({ count, onClick }) => (
	<Box
		component="span"
		onClick={() => count > 0 && onClick()}
		sx={{
			cursor: count > 0 ? 'pointer' : 'default',
			color: count > 0 ? '#2F6FB0' : 'inherit',
			fontWeight: 600,
			'&:hover': count > 0 ? { textDecoration: 'underline' } : {},
		}}
	>
		{count}
	</Box>
);

/**
 * Dedicated premium card for the Compressor machine list: gear icon, title +
 * status pill, timestamp, a Current Status line, a stoppage-ratio analytics
 * donut (8hr share of 24hr stoppages), the Last Stoppage table, the
 * Stoppages History table (clickable counts open the downtime-history
 * modal), and the TREND action last.
 */
const PremiumCompressorMachineCard = ({
	title,
	status,
	lastUpdated,
	statusFrom,
	lastStoppageStart,
	lastStoppageEnd,
	lastStoppageDuration,
	previous8Count,
	previous24Count,
	previous8Duration,
	previous24Duration,
	onStoppageClick,
	onOpenTrend,
}) => {
	const isOnline = status?.toLowerCase() === 'online';
	const donutPercent =
		previous24Count > 0 ? (previous8Count / previous24Count) * 100 : 0;

	return (
		<PremiumMachineCard
			app="COMPRESSOR"
			title={title}
			status={status}
			lastUpdated={lastUpdated}
			onOpenTrend={onOpenTrend}
		>
			<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" mb={1.25}>
				<ResponsiveTextWrapper
					value="Current Status:"
					fontWeight="bold"
					color="text.primary"
					fontSize="13px"
				/>
				<Box
					sx={{
						bgcolor: isOnline ? 'rgba(76,175,80,0.12)' : 'rgba(244,67,54,0.12)',
						borderRadius: '999px',
						px: 1.5,
						py: 0.25,
					}}
				>
					<ResponsiveTextWrapper
						value={status?.toUpperCase()}
						color={isOnline ? 'success.main' : 'error.main'}
						fontWeight="bold"
						fontSize="11px"
					/>
				</Box>
				{statusFrom ? (
					<ResponsiveTextWrapper
						value={`from ${statusFrom}`}
						color="text.secondary"
						fontSize="11px"
						fontWeight="bold"
					/>
				) : null}
			</Stack>

			{(previous8Count > 0 || previous24Count > 0) && (
				<Box mb={1.25}>
					<MachineRatioDonut
						percent={donutPercent}
						color={APP_ACCENT_COLOR.COMPRESSOR}
						label="8hr share of 24hr stoppages"
						caption={`${previous8Count} of ${previous24Count} stops`}
					/>
				</Box>
			)}

			<Box mb={1.25}>
				<ResponsiveTextWrapper value="Last Stoppage" fontWeight="bold" fontSize="13px" />
				<Table size="small" sx={{ mt: 0.5, width: '100%', tableLayout: 'fixed' }}>
					<TableHead>
						<TableRow>
							<TableCell sx={{ fontWeight: 'bold', border: 0, p: 0.5, fontSize: '12px' }}>
								Start Time
							</TableCell>
							<TableCell align="center" sx={{ fontWeight: 'bold', border: 0, p: 0.5, fontSize: '12px' }}>
								End Time
							</TableCell>
							<TableCell align="center" sx={{ fontWeight: 'bold', border: 0, p: 0.5, fontSize: '12px' }}>
								Duration
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						<TableRow>
							<TableCell sx={{ border: 0, p: 0.5, fontSize: '11.5px' }}>
								{lastStoppageStart || '-'}
							</TableCell>
							<TableCell align="center" sx={{ border: 0, p: 0.5, fontSize: '11.5px' }}>
								{lastStoppageEnd || '-'}
							</TableCell>
							<TableCell align="center" sx={{ border: 0, p: 0.5, fontSize: '11.5px' }}>
								{lastStoppageDuration || '-'}
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</Box>

			<Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
				<TableHead>
					<TableRow>
						<TableCell sx={{ fontWeight: 'bold', border: 0, p: 0.5, fontSize: '12px' }}>
							Stoppages History
						</TableCell>
						<TableCell align="center" sx={{ fontWeight: 'bold', border: 0, p: 0.5, fontSize: '12px' }}>
							Previous 8hrs
						</TableCell>
						<TableCell align="center" sx={{ fontWeight: 'bold', border: 0, p: 0.5, fontSize: '12px' }}>
							Previous 24hrs
						</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					<TableRow>
						<TableCell sx={{ border: 0, p: 0.5, fontSize: '11.5px', fontWeight: 'bold' }}>
							No. of Stoppages
						</TableCell>
						<TableCell align="center" sx={{ border: 0, p: 0.5, fontSize: '11.5px', fontWeight: 'bold' }}>
							<StoppageCount count={previous8Count} onClick={() => onStoppageClick(8)} />
						</TableCell>
						<TableCell align="center" sx={{ border: 0, p: 0.5, fontSize: '11.5px', fontWeight: 'bold' }}>
							<StoppageCount count={previous24Count} onClick={() => onStoppageClick(24)} />
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell sx={{ border: 0, p: 0.5, fontSize: '11.5px', fontWeight: 'bold' }}>
							Stoppage Duration
						</TableCell>
						<TableCell align="center" sx={{ border: 0, p: 0.5, fontSize: '11.5px' }}>
							{previous8Duration}
						</TableCell>
						<TableCell align="center" sx={{ border: 0, p: 0.5, fontSize: '11.5px' }}>
							{previous24Duration}
						</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</PremiumMachineCard>
	);
};

export default PremiumCompressorMachineCard;
