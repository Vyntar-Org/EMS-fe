import {
	Box,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
} from '@mui/material';

import { APP_ACCENT_COLOR } from '../../common/MachineCardBits';
import PremiumMachineCard from '../../common/PremiumMachineCard';
import ResponsiveTextWrapper from '../../common/ResponsiveTextWrapper';
import { useLocation } from 'react-router-dom';
import { getAppCodeFromPath } from '../../../helpers/pageMapping';

// Shared "bounded panel" look for the two stoppage tables below — a
// surface-muted rounded box (same treatment `MachineMetricPanel` and the
// FlowCard table use elsewhere) so each section reads as one clearly
// separated, understandable block instead of bare table rows floating on
// the card background.
const tablePanelSx = {
	bgcolor: 'surface.muted',
	border: '1px solid',
	borderColor: 'surface.mutedBorder',
	borderRadius: '14px',
	width: '100%',
	overflow: 'hidden',
};

const headerCellSx = {
	fontWeight: 'bold',
	border: 0,
	p: 0.75,
	width: '33.34%',
};

const bodyCellSx = {
	border: 0,
	p: 0.75,
	width: '33.34%',
};

const StoppageCount = ({ count, onClick }) => (
	<Box
		component="span"
		onClick={() => count > 0 && onClick()}
		sx={{
			display: 'inline-flex',
			maxWidth: '100%',
			cursor: count > 0 ? 'pointer' : 'default',
			'&:hover': count > 0 ? { textDecoration: 'underline' } : {},
		}}
	>
		<ResponsiveTextWrapper
			value={String(count ?? 0)}
			fontWeight={700}
			fontSize="13px"
			color={count > 0 ? APP_ACCENT_COLOR.COMPRESSOR : 'text.primary'}
			sx={{ textAlign: 'center' }}
		/>
	</Box>
);

/**
 * Dedicated premium card for the Compressor machine list: gear icon, title +
 * status pill, timestamp, a Current Status line, a stoppage-ratio analytics
 * donut (8hr share of 24hr stoppages), the Last Stoppage table, the
 * Stoppages History table (clickable counts open the downtime-history
 * modal), and the TREND action last. Every piece of text — headers,
 * values, the status line — goes through `ResponsiveTextWrapper` so long
 * device names, timestamps, or durations truncate cleanly (with a tooltip
 * for the full value) instead of overflowing or wrapping the card apart at
 * narrow widths, and every wrapper sits in a `width: 100%` / `minWidth: 0`
 * container so that truncation is computed off the card's real rendered
 * width rather than guessed pixel values.
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
	idle: isIdle,
	alert: isAlert,
}) => {
	const location = useLocation();
	const appCode = getAppCodeFromPath(location.pathname);
	const isOnline = status?.toLowerCase() === 'online';

	return (
		<PremiumMachineCard
			app="COMPRESSOR"
			title={title}
			status={status}
			lastUpdated={lastUpdated}
			onOpenTrend={onOpenTrend}
		>
			<Stack
				direction="row"
				spacing={1}
				alignItems="center"
				flexWrap="nowrap"
				mb={1.25}
				width="100%"
				minWidth={0}
				sx={{ overflow: 'hidden' }}
			>
				<Box flexShrink={0} minWidth={0}>
					<ResponsiveTextWrapper
						value="Current Status:"
						fontWeight="bold"
						color="text.primary"
						fontSize="13px"
					/>
				</Box>
				<Box
					flexShrink={0}
					sx={{
						bgcolor: isOnline ? 'rgba(76,175,80,0.12)' : 'rgba(244,67,54,0.12)',
						borderRadius: '999px',
						px: 1.5,
						py: 0.25,
						maxWidth: '100%',
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
					<Box minWidth={0} flex={1}>
						<ResponsiveTextWrapper
							value={`from ${statusFrom}`}
							color="text.secondary"
							fontSize="11px"
							fontWeight="bold"
						/>
					</Box>
				) : null}
			</Stack>
			{appCode === 'COMPRESSOR' && (
				<Stack
					direction="row"
					spacing={2}
					alignItems="center"
					flexWrap="nowrap"
					mb={1.25}
					width="100%"
					minWidth={0}
					sx={{ overflow: 'hidden' }}
					justifyContent="space-between"
				>
					{/* Idle Indicator */}
					<Stack
						direction="row"
						spacing={0.75}
						alignItems="center"
						flexShrink={0}
					>
						<ResponsiveTextWrapper
							value="Idle:"
							fontWeight="bold"
							color="text.primary"
							fontSize="13px"
						/>
						<Box
							sx={{
								bgcolor: isIdle
									? 'rgba(237,108,2,0.12)'
									: 'rgba(145,158,171,0.12)', // Orange tint if idle, soft gray if active
								borderRadius: '999px',
								px: 1.25,
								py: 0.25,
							}}
						>
							<ResponsiveTextWrapper
								value={isIdle ? 'YES' : 'NO'}
								color={isIdle ? 'warning.main' : 'text.secondary'}
								fontWeight="bold"
								fontSize="11px"
							/>
						</Box>
					</Stack>

					{/* Alert Indicator */}
					<Stack
						direction="row"
						spacing={0.75}
						alignItems="center"
						flexShrink={0}
					>
						<ResponsiveTextWrapper
							value="Alert:"
							fontWeight="bold"
							color="text.primary"
							fontSize="13px"
						/>
						<Box
							sx={{
								bgcolor: isAlert
									? 'rgba(244,67,54,0.12)'
									: 'rgba(76,175,80,0.12)', // Red tint if triggered, green if clear
								borderRadius: '999px',
								px: 1.25,
								py: 0.25,
							}}
						>
							<ResponsiveTextWrapper
								value={isAlert ? 'TRIGGERED' : 'CLEAR'}
								color={isAlert ? 'error.main' : 'success.main'}
								fontWeight="bold"
								fontSize="11px"
							/>
						</Box>
					</Stack>
				</Stack>
			)}

			<Box mb={1.25} width="100%">
				<Box mb={0.5}>
					<ResponsiveTextWrapper
						value="Last Stoppage"
						fontWeight="bold"
						fontSize="13px"
					/>
				</Box>
				<Box sx={tablePanelSx}>
					<Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
						<TableHead>
							<TableRow>
								<TableCell sx={headerCellSx}>
									<ResponsiveTextWrapper value="Start Time" fontSize="12px" />
								</TableCell>
								<TableCell sx={{ ...headerCellSx, textAlign: 'center' }}>
									<ResponsiveTextWrapper
										value="End Time"
										fontSize="12px"
										sx={{ textAlign: 'center' }}
									/>
								</TableCell>
								<TableCell sx={{ ...headerCellSx, textAlign: 'center' }}>
									<ResponsiveTextWrapper
										value="Duration"
										fontSize="12px"
										sx={{ textAlign: 'center' }}
									/>
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							<TableRow>
								<TableCell sx={bodyCellSx}>
									<ResponsiveTextWrapper
										value={lastStoppageStart || '-'}
										fontSize="11.5px"
										color="text.primary"
									/>
								</TableCell>
								<TableCell sx={{ ...bodyCellSx, textAlign: 'center' }}>
									<ResponsiveTextWrapper
										value={lastStoppageEnd || '-'}
										fontSize="11.5px"
										color="text.primary"
										sx={{ textAlign: 'center' }}
									/>
								</TableCell>
								<TableCell sx={{ ...bodyCellSx, textAlign: 'center' }}>
									<ResponsiveTextWrapper
										value={lastStoppageDuration || '-'}
										fontSize="11.5px"
										color="text.primary"
										fontWeight={600}
										sx={{ textAlign: 'center' }}
									/>
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</Box>
			</Box>

			<Box width="100%">
				<Box sx={tablePanelSx}>
					<Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
						<TableHead>
							<TableRow>
								<TableCell sx={headerCellSx}>
									<ResponsiveTextWrapper
										value="Stoppages History"
										fontSize="12px"
									/>
								</TableCell>
								<TableCell sx={{ ...headerCellSx, textAlign: 'center' }}>
									<ResponsiveTextWrapper
										value="Previous 8hrs"
										fontSize="12px"
										sx={{ textAlign: 'center' }}
									/>
								</TableCell>
								<TableCell sx={{ ...headerCellSx, textAlign: 'center' }}>
									<ResponsiveTextWrapper
										value="Previous 24hrs"
										fontSize="12px"
										sx={{ textAlign: 'center' }}
									/>
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							<TableRow>
								<TableCell sx={bodyCellSx}>
									<ResponsiveTextWrapper
										value="No. of Stoppages"
										fontSize="11.5px"
										fontWeight={600}
									/>
								</TableCell>
								<TableCell sx={{ ...bodyCellSx, textAlign: 'center' }}>
									<Stack alignItems="center">
										<StoppageCount
											count={previous8Count}
											onClick={() => onStoppageClick(8)}
										/>
									</Stack>
								</TableCell>
								<TableCell sx={{ ...bodyCellSx, textAlign: 'center' }}>
									<Stack alignItems="center">
										<StoppageCount
											count={previous24Count}
											onClick={() => onStoppageClick(24)}
										/>
									</Stack>
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell sx={bodyCellSx}>
									<ResponsiveTextWrapper
										value="Stoppage Duration"
										fontSize="11.5px"
										fontWeight={600}
									/>
								</TableCell>
								<TableCell sx={{ ...bodyCellSx, textAlign: 'center' }}>
									<ResponsiveTextWrapper
										value={previous8Duration || '-'}
										fontSize="11.5px"
										color="text.primary"
										sx={{ textAlign: 'center' }}
									/>
								</TableCell>
								<TableCell sx={{ ...bodyCellSx, textAlign: 'center' }}>
									<ResponsiveTextWrapper
										value={previous24Duration || '-'}
										fontSize="11.5px"
										color="text.primary"
										sx={{ textAlign: 'center' }}
									/>
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</Box>
			</Box>
		</PremiumMachineCard>
	);
};

export default PremiumCompressorMachineCard;
