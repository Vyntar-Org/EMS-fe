import {
	Battery90,
	ElectricalServices,
	EnergySavingsLeaf,
	NaturePeople,
	Power,
} from '@mui/icons-material';
import { alpha, Box, Divider, Grid } from '@mui/material';

import CustomCard from '../../common/CustomCard';
import NoDataFound from '../../common/errors/NoDataFound';
import {
	CustomProgressBar,
	MiniColumnChart,
} from '../../common/MachineCardBits';
import ResponsiveTextWrapper from '../../common/ResponsiveTextWrapper';

const ACCENT = '#006100';
const ENER_ACCENT = '#008300';
const CARBON_ACCENT = '#1BAF7A';

const MAIN_COLOR = '#2563EB';
const BACKUP_COLOR = '#EA580C';
const ENER_GREEN_COLOR = ENER_ACCENT;
const CARBON_GREEN_COLOR = CARBON_ACCENT;

const ENERGYEnerAndCarbon = ({ data }) => {
	const MetricBlock = ({
		label,
		enerValue,
		carbonValue,
		showDivider,
		enerUnit,
		carbonUnit,
		showCarbonLabel,
		icon: Icon,
		iconColor,
		percent,
	}) => (
		<Grid
			item
			xs={4}
			sx={{
				display: 'flex',
				position: 'relative',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<Box width="100%">
				<Box display="flex" alignItems="center" width="100%" gap={1} px={0.5}>
					{Icon && (
						<Box
							sx={{
								display: 'inline-flex',
								alignItems: 'center',
								justifyContent: 'center',
								color: iconColor,
								flexShrink: 0,
								width: 26,
								height: 26,
								borderRadius: '50%',
								backgroundColor: alpha(iconColor, 0.12),
								backdropFilter: 'blur(8px)',
								WebkitBackdropFilter: 'blur(8px)',
								boxShadow: `0 4px 12px 0 ${alpha(iconColor, 0.08)}`,
							}}
						>
							<Icon sx={{ fontSize: '16px' }} />
						</Box>
					)}

					<ResponsiveTextWrapper
						mt={0.5}
						variant="caption"
						color="text.primary"
						fontWeight={700}
						textTransform="uppercase"
						fontSize={{ xs: '9.5px', md: '11px' }}
						value={label}
					/>
				</Box>

				<Divider
					orientation="horizontal"
					sx={{
						borderStyle: 'dashed',
						my: 0.5,
						// height: '100%',
						// position: 'absolute',
						// right: 0,
					}}
				/>

				<Box
					// sx={{
					// 	bgcolor: alpha(iconColor, 0.08),
					// 	borderRadius: 1,
					// }}
					display="flex"
					flexDirection="column"
					width="100%"
					// p={0.2}
					px={1.5}
				>
					<ResponsiveTextWrapper
						fontSize={{ xs: '12px', sm: '13px', md: '15px' }}
						color={iconColor}
						fontWeight={800}
						value={enerValue?.toLocaleString() || 0}
					/>
					<CustomProgressBar
						// trackColor="#fff"
						color={iconColor}
						value={percent}
						// unit={enerUnit}
					/>
				</Box>

				<Divider
					orientation="horizontal"
					sx={{
						borderStyle: 'dashed',
						my: 0.5,
						// height: '100%',
						// position: 'absolute',
						// right: 0,
					}}
				/>
				<Box
					display="flex"
					flexDirection="column"
					width="100%"
					// p={0.2}
					px={1.5}
				>
					{/* <ResponsiveTextWrapper
						fontSize={{ xs: '12px', sm: '13px' }}
						// color={iconColor}
						fontWeight={600}
						value="Carbon Trading"
						sx={{ my: 0.5, visibility: showCarbonLabel ? 'visible' : 'hidden' }}
					/> */}

					<ResponsiveTextWrapper
						fontSize={{ xs: '12px', sm: '13px', md: '15px' }}
						color={iconColor}
						fontWeight={800}
						value={carbonValue?.toLocaleString() || 0}
					/>

					<ResponsiveTextWrapper
						fontSize={{ xs: '10px' }}
						color={iconColor}
						fontWeight={600}
						value={carbonUnit}
					/>

					{/* <CustomProgressBar
						// trackColor="#fff"
						color={iconColor}
						value={carbonValue}
						unit=""
						hideValue
					/> */}
				</Box>
			</Box>

			{/* <Box sx={{ textAlign: 'center', width: '100%', px: 0.5 }}>
				<ResponsiveTextWrapper
					mt={1.5}
					fontSize={{ xs: '12px', sm: '13px', md: '15px' }}
					color={ACCENT}
					fontWeight={800}
					value={enerValue?.toLocaleString() || 0}
				/>
				<ResponsiveTextWrapper
					mt={0.5}
					fontSize={{ xs: '12px', sm: '13px' }}
					color={ACCENT}
					fontWeight={800}
					value={unit}
					mb={1.5}
				/>
			</Box> */}

			{showDivider && (
				<Divider
					orientation="vertical"
					sx={{
						borderStyle: 'dashed',
						height: '100%',
						position: 'absolute',
						right: 0,
					}}
				/>
			)}
		</Grid>
	);

	return (
		<CustomCard
			titleIcon={<NaturePeople />}
			title="Ener & Carbon"
			accentColor={ACCENT}
			sx={{
				'& .MuiCardContent-root > .MuiBox-root:first-of-type': {
					alignItems: 'center',
				},
			}}
			subtitle="Export "
			icon={
				<ResponsiveTextWrapper
					value={[
						// 'Export:',
						data?.export?.value || 0,
						data?.export?.unit || '',
					].join(' ')}
					color="text.primary"
					letterSpacing="0.2px"
					fontWeight={700}
					ml={0.5}
				/>
			}
		>
			{data ? (
				<Box
					sx={{
						height: '100%',
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'space-between',
						gap: 0.5,
					}}
				>
					<Grid container sx={{ width: '100%' }} alignItems="center">
						<MetricBlock
							label="Main"
							showDivider
							enerValue={data?.main?.value || 0}
							percent={data?.main?.percent || 0}
							carbonValue={data?.main?.carbon || 0}
							enerUnit={data?.unit || ''}
							carbonUnit={data?.carbon_unit || ''}
							showCarbonLabel
							icon={ElectricalServices}
							iconColor="#2563EB"
						/>

						<MetricBlock
							label="Backup"
							enerValue={data?.backup?.value || 0}
							carbonValue={data?.backup?.carbon || 0}
							percent={data?.backup?.percent || 0}
							showDivider
							enerUnit={data?.unit || ''}
							carbonUnit={data?.carbon_unit || ''}
							icon={Battery90}
							iconColor="#EA580C"
						/>
						<MetricBlock
							label="Green"
							enerValue={data?.green?.value || 0}
							carbonValue={data?.green?.carbon || 0}
							percent={data?.green?.percent || 0}
							enerUnit={data?.unit || ''}
							carbonUnit={data?.carbon_unit || ''}
							icon={EnergySavingsLeaf}
							iconColor="#1BAF7A"
							export={data?.export}
						/>
					</Grid>
				</Box>
			) : (
				<NoDataFound message="Waiting for live device data — readings appear automatically" />
			)}
		</CustomCard>
	);
};

export default ENERGYEnerAndCarbon;
