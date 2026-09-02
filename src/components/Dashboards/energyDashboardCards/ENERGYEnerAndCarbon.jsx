import {
	Battery90Rounded,
	ElectricalServicesRounded,
	EnergySavingsLeafRounded,
	NaturePeopleRounded,
} from '@mui/icons-material';
import { alpha, Box, Divider, Stack, Typography } from '@mui/material';

import { formatNumber } from '../../../helpers/formatters';
import CustomCard from '../../common/CustomCard';
import NoDataFound from '../../common/errors/NoDataFound';

const ACCENT = '#16833B';
const METRICS = [
	{
		key: 'main',
		label: 'Main',
		color: '#2563EB',
		Icon: ElectricalServicesRounded,
	},
	{ key: 'backup', label: 'Backup', color: '#EA580C', Icon: Battery90Rounded },
	{
		key: 'green',
		label: 'Green',
		color: '#1BAF7A',
		Icon: EnergySavingsLeafRounded,
	},
];
const clampPercent = (value) => Math.min(100, Math.max(0, Number(value) || 0));

const MetricColumn = ({ metric, data, unit, carbonUnit, showDivider }) => {
	const { label, color, Icon } = metric;
	const percent = clampPercent(data?.percent);

	return (
		<Box
			sx={{
				position: 'relative',
				minWidth: 0,
				flex: 1,
				px: { xs: 0.75, sm: 1, xl: 1.4 },
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
			}}
		>
			<Stack direction="row" alignItems="center" spacing={0.75} minWidth={0}>
				<Box
					sx={{
						width: 29,
						height: 29,
						borderRadius: '9px',
						display: 'grid',
						placeItems: 'center',
						flexShrink: 0,
						color,
						background: `linear-gradient(145deg, ${alpha(color, 0.15)}, ${alpha(
							color,
							0.05
						)})`,
						border: `1px solid ${alpha(color, 0.13)}`,
						boxShadow: `0 4px 12px ${alpha(color, 0.1)}`,
					}}
				>
					<Icon sx={{ fontSize: 18 }} />
				</Box>
				<Typography
					sx={{
						fontSize: { xs: '0.65rem', sm: '0.72rem', xl: '0.78rem' },
						fontWeight: 800,
						letterSpacing: '0.035em',
						textTransform: 'uppercase',
						color: 'text.primary',
						whiteSpace: 'nowrap',
					}}
				>
					{label}
				</Typography>
			</Stack>

			<Box mt={0.5}>
				<Stack direction="row" alignItems="baseline" spacing={0.4} minWidth={0}>
					<Typography
						sx={{
							fontSize: { xs: '1.25rem', sm: '1.45rem' },
							lineHeight: 1,
							fontWeight: 700,
							letterSpacing: '-0.025em',
							color,
						}}
					>
						{formatNumber(data?.value, 2, { fallback: '0' })}
					</Typography>
					{/* <Typography
						sx={{
							fontSize: '0.6rem',
							fontWeight: 700,
							color: 'text.secondary',
							whiteSpace: 'nowrap',
						}}
					>
						{unit}
					</Typography> */}
				</Stack>
				<Box
					sx={{
						mt: 0.7,
						height: 7,
						borderRadius: 99,
						bgcolor: alpha(color, 0.1),
						overflow: 'hidden',
					}}
				>
					<Box
						sx={{
							height: '100%',
							width: `${percent}%`,
							minWidth: percent > 0 ? 5 : 0,
							borderRadius: 99,
							background: `linear-gradient(90deg, ${color}, ${alpha(
								color,
								0.72
							)})`,
							transition: 'width 350ms ease',
						}}
					/>
				</Box>
				<Typography
					sx={{ mt: 0.3, fontSize: '0.64rem', fontWeight: 700, color }}
				>
					{formatNumber(percent, 2, { fallback: '0' })}%
				</Typography>
			</Box>

			<Divider sx={{ my: 0.55, borderColor: 'divider' }} />
			<Stack direction="column" alignItems="baseline" spacing={0.35} minWidth={0}>
				<Typography
					sx={{ fontSize: '1rem', lineHeight: 1, fontWeight: 700, color }}
				>
					{formatNumber(data?.carbon, 2, { fallback: '0' })}
				</Typography>
				<Typography
					sx={{
						fontSize: '0.59rem',
						fontWeight: 600,
						color: 'text.secondary',
						whiteSpace: 'nowrap',
					}}
				>
					{carbonUnit}
				</Typography>
			</Stack>

			{showDivider && (
				<Divider
					orientation="vertical"
					sx={{ position: 'absolute', right: 0, top: 2, bottom: 2 }}
				/>
			)}
		</Box>
	);
};

const ENERGYEnerAndCarbon = ({ data }) => (
	<CustomCard accentColor={ACCENT} disableContentPadding>
		{data ? (
			<Box
				sx={{
					height: '100%',
					p: { xs: 1, sm: 1.15 },
					display: 'flex',
					flexDirection: 'column',
					background: (theme) =>
						`linear-gradient(145deg, ${alpha(
							ACCENT,
							theme.palette.mode === 'dark' ? 0.08 : 0.025
						)}, transparent 48%)`,
				}}
			>
				<Stack
					direction="row"
					alignItems="center"
					justifyContent="space-between"
					spacing={1}
					mb={0.9}
				>
					<Stack direction="row" alignItems="center" spacing={1} minWidth={0}>
						<Box
							sx={{
								width: 50,
								height: 50,
								borderRadius: '11px',
								display: 'grid',
								placeItems: 'center',
								color: ACCENT,
								bgcolor: alpha(ACCENT, 0.08),
								border: `1px solid ${alpha(ACCENT, 0.12)}`,
								boxShadow: `0 5px 16px ${alpha(ACCENT, 0.1)}`,
							}}
						>
							<NaturePeopleRounded sx={{ fontSize: 24 }} />
						</Box>
						<Typography
							sx={{
								fontSize: { xs: '1rem', xl: '1.15rem' },
								fontWeight: 800,
								letterSpacing: '-0.02em',
								whiteSpace: 'nowrap',
							}}
						>
							Ener & Carbon
						</Typography>
					</Stack>

					<Stack
						direction="row"
						alignItems="baseline"
						spacing={0.6}
						sx={{
							px: 1,
							py: 0.6,
							borderRadius: '10px',
							bgcolor: alpha(ACCENT, 0.035),
							border: `1px solid ${alpha(ACCENT, 0.1)}`,
							whiteSpace: 'nowrap',
						}}
					>
						<Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>
							Export
						</Typography>
						<Typography sx={{ fontSize: '1rem', fontWeight: 800 }}>
							{formatNumber(data?.export?.value, 2, { fallback: '0' })}
						</Typography>
						<Typography sx={{ fontSize: '0.68rem', fontWeight: 700 }}>
							{data?.export?.unit || ''}
						</Typography>
					</Stack>
				</Stack>

				<Box
					sx={{
						flex: 1,
						minHeight: 0,
						display: 'flex',
						alignItems: 'stretch',
						py: 0.8,
						px: 0.4,
						borderRadius: '13px',
						bgcolor: (theme) =>
							alpha(
								theme.palette.background.paper,
								theme.palette.mode === 'dark' ? 0.5 : 0.7
							),
						border: '1px solid',
						borderColor: 'divider',
					}}
				>
					{METRICS.map((metric, index) => (
						<MetricColumn
							key={metric.key}
							metric={metric}
							data={data?.[metric.key]}
							unit={data?.unit || ''}
							carbonUnit={data?.carbon_unit || 'kg of CO₂'}
							showDivider={index < METRICS.length - 1}
						/>
					))}
				</Box>
			</Box>
		) : (
			<NoDataFound message="Waiting for live device data — readings appear automatically" />
		)}
	</CustomCard>
);

export default ENERGYEnerAndCarbon;
