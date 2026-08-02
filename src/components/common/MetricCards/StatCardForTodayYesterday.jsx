import { alpha, Box, Divider } from '@mui/material';

import { formatChartValue } from '../../../helpers/chartConfig';
import CardFooterAnalytics from '../CardFooterAnalytics';
import ResponsiveTextWrapper from '../ResponsiveTextWrapper';

const StatCardForTodayYesterday = ({
	value,
	previousValue,
	accent,
	caption,
}) => {
	return (
		<Box
			sx={{
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				// justifyContent: 'center',
				width: '100%',
				minWidth: 0,
			}}
		>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: { xs: 2.5, md: 3.5 },
					width: '100%',
					minWidth: 0,
					px: 4,
				}}
			>
				{[
					{ label: 'Today', value },
					{ label: 'Yesterday', value: previousValue },
				].map((item) => (
					<Box
						key={item.label}
						sx={{
							display: 'flex',
							alignItems: 'center',
							gap: { xs: 2.5, md: 3.5 },
							width: '100%',
						}}
					>
						{/* {idx === 1 && (
                        <Divider
                            orientation="vertical"
                            flexItem
                            sx={{ borderStyle: 'dashed', borderColor: alpha(accent, 0.28) }}
                        />
                    )} */}
						<Box width="100%" textAlign={'center'}>
							<ResponsiveTextWrapper
								color="text.primary"
								fontWeight={700}
								fontSize={{ xs: '10.5px', md: '14px' }}
								value={item.label}
								// align={idx === 0 ? 'left' : 'right'}
								sx={{ textTransform: 'uppercase', letterSpacing: '0.3px' }}
							/>

							<Box width={100} textAlign="center" mx="auto">
								<ResponsiveTextWrapper
									fontSize="16px"
									fontWeight={800}
									value={`${formatChartValue(item.value) || 0} KL`}
									// align={idx === 0 ? 'left' : 'right'}
									color={accent}
									sx={{ lineHeight: 1.1 }}
									my={0.5}
								/>
							</Box>

							{caption ? (
								<ResponsiveTextWrapper
									color="text.secondary"
									fontWeight={500}
									fontSize={{ xs: '9px', md: '10px' }}
									value={`(${caption})`}
									// align={idx === 0 ? 'left' : 'right'}
									sx={{ lineHeight: 1.2 }}
								/>
							) : null}
						</Box>
					</Box>
				))}
			</Box>
			<Box
				sx={{
					position: 'relative',
					width: '100%',
					mt: 1,
					px: 4,
				}}
			>
				<Divider
					sx={{
						borderColor: alpha(accent, 0.22),
						borderBottomWidth: 1.5,
					}}
				/>
				<Box
					sx={{
						position: 'absolute',
						left: '50%',
						top: -80, // Adjust height above divider
						transform: 'translateX(-50%)',
						width: 2,
						height: 80,
						borderRadius: 999,
						bgcolor: alpha(accent, 0.5),
					}}
				/>
				<Box
					sx={{
						position: 'absolute',
						left: '50%',
						top: '50%',
						transform: 'translate(-50%, -50%)',
						width: 12,
						height: 12,
						borderRadius: '50%',
						bgcolor: accent,
						border: '3px solid white',
						boxShadow: `0 2px 10px ${alpha(accent, 0.35)}`,
					}}
				/>
			</Box>

			<CardFooterAnalytics
				value={value}
				previousValue={previousValue}
				accent={accent}
			/>
		</Box>
	);
};

export default StatCardForTodayYesterday;
