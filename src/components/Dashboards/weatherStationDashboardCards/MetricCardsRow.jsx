import {
	Air,
	AirOutlined,
	DeviceThermostat,
	Explore,
	Opacity,
	Speed,
	WaterDrop,
	WbSunny,
} from '@mui/icons-material';
import { Box, Card, CardContent, Grid } from '@mui/material';

import ResponsiveTextWrapper from '../../common/ResponsiveTextWrapper';

const CARD_COLORS = {
	rainfall: {
		bg: '#EFF8FF',
		border: '#BFDBFE',
		iconBg: '#EFF6FF',
		value: '#2563EB',
	},
	solar_indura: {
		bg: '#FFF8EB',
		border: '#FCD34D',
		iconBg: '#FFFBEB',
		value: '#D97706',
	},
	solar_energy: {
		bg: '#F0FDF4',
		border: '#c2400c9f',
		iconBg: '#FFF7ED',
		value: '#C2410C',
	},
	revenue: {
		bg: '#ECFDF5',
		border: '#6EE7B7',
		iconBg: '#ECFDF5',
		value: '#059669',
	},
	temperature: {
		bg: '#FEF2F2',
		border: '#FECACA',
		iconBg: '#FEF2F2',
		value: '#B91C1C',
	},
	humidity: {
		bg: '#ECFEFF',
		border: '#A5F3FC',
		iconBg: '#ECFEFF',
		value: '#0891B2',
	},
	wind_speed: {
		bg: '#F8FAFC',
		border: '#CBD5E1',
		iconBg: '#F0FDFA',
		value: '#475569',
	},
	wind_direction: {
		bg: '#EEF2FF',
		border: '#C7D2FE',
		iconBg: '#EEF2FF',
		value: '#4338CA',
	},
	air_quality_index: {
		bg: '#F0FDF4',
		border: '#BBF7D0',
		iconBg: '#F0FDF4',
		value: '#15803D',
	},
	pressure: {
		bg: '#FAF5FF',
		border: '#D8B4FE',
		iconBg: '#F5F3FF',
		value: '#9333EA',
	},
};

const METRIC_CONFIG = [
	{
		key: 'rainfall',
		label: 'Rainfall Today',
		unit: 'mm',
		// getLabel: (val) => {
		//   return `Prediction next 24h: ${val} mm`;
		// },
		accent: 'metric--blue',
		labelIcon: WaterDrop,
		iconColor: '#2196F3',
	},
	{
		key: 'solar_indura',
		label: 'Solar Irradiance',
		unit: 'W/m²',
		// getLabel: (val) => {
		//   return `Peak forecast: ${val} W/m²`;
		// },
		accent: 'metric--orange',
		labelIcon: WbSunny,
		iconColor: '#FF9800',
	},
	// {
	// 	key: 'solar_energy',
	// 	label: 'Solar Energy Today',
	// 	unit: 'kWh',
	// 	// getLabel: (val) => {
	// 	//   return `Expected: ${val} kWh`;
	// 	// },
	// 	accent: 'metric--green',
	// 	labelIcon: SolarPower,
	// 	iconColor: '#4CAF50',
	// },
	// {
	// 	key: 'revenue',
	// 	label: 'Revenue',
	// 	accent: 'metric--green',
	// 	labelIcon: CurrencyRupee,
	// 	iconColor: '#059669',
	// },
	{
		key: 'temperature',
		label: 'Temperature',
		unit: '°C',
		labelIcon: DeviceThermostat,
		iconColor: '#F44336',

		// getLabel: (val) => {
		//   return `Temperature: ${val} °C`;
		// },
	},
	{
		key: 'humidity',
		label: 'Humidity',
		unit: '%',
		labelIcon: Opacity,
		iconColor: '#00BCD4',

		// getLabel: (val) => {
		//   return `Temperature: ${val} °C`;
		// },
	},
	// {
	//   key: "pv_efficiency",
	//   label: "PV Efficiency",
	//   unit: "%",
	//   getLabel: (val) => {
	//     return val < 18
	//       ? "Slight drop due to clouds/dust"
	//       : "Within normal range";
	//   },
	//   accent: "metric--warn",
	// },
	{
		key: 'wind_speed',
		label: 'Wind Speed',
		unit: 'km/h',
		// getLabel: (val) => {
		//   return `Gust: ${val} km/h`;
		// },
		labelIcon: Air,
		iconColor: '#607D8B',
	},
	{
		key: 'wind_direction',
		label: 'Wind Direction',
		unit: '',
		// getLabel: (val) => {
		//   return `Stable for last ${val} min`;
		// },
		accent: 'metric--blue',
		labelIcon: Explore,
		iconColor: '#3F51B5',
	},
	{
		key: 'air_quality_index',
		label: 'Air Quality Index',
		// getLabel: () => {
		//   return "Moderate / acceptable";
		// },
		accent: 'metric--green',
		labelIcon: AirOutlined,
		iconColor: '#43A047',
	},
	// {
	//   key: "temperature",
	//   label: "Temperature",
	//   unit: "°C",
	//   // getLabel: (val) => {
	//   //   return `Temperature: ${val} °C`;
	//   // },
	// },
	{
		key: 'pressure',
		label: 'Pressure',
		unit: 'hPa',
		labelIcon: Speed,
		iconColor: '#9C27B0',

		// getLabel: (val) => {
		//   return `Pressure: ${val} hPa`;
		// },
	},
];

function MetricCardsRow({ kpiCardsData }) {
	return (
		<Grid container justifyContent="space-between" rowGap={1.5}>
			{METRIC_CONFIG.map(({ key, label, unit, labelIcon }) => {
				const rawValue =
					key === 'pressure'
						? kpiCardsData?.temperature?.pressure
						: kpiCardsData?.[key]?.today;
				const hasValue =
					rawValue !== null && rawValue !== undefined && rawValue !== '';
				const value = hasValue ? `${rawValue}${unit ? ` ${unit}` : ''}` : '—';
				const IconComponent = labelIcon;
				const colors = CARD_COLORS?.[key] || CARD_COLORS?.rainfall;

				return (
					<Grid
						key={key}
						// xs={isHalfWidth ? 5.88 : 12}
						// sm={isHalfWidth ? 2.88 : 5.93}
						// xs={5.88}
						// md={2.3}
						// lg={isHalfWidth ? 1.92 : 2.93}
						xs={5.88}
						md={2.92}
					>
						<Card
							elevation={0}
							sx={{
								height: '100%',
								bgcolor: 'background.paper',
								// marginBottom: 1,
								// boxShadow: (theme) =>
								//   theme.palette.mode === "dark"
								//     ? "0px 0px 4px 0px rgba(0, 0, 0, 0.40), 0px 0px 24px 0px rgba(0, 0, 0, 0.25)"
								//     : "0px 0px 4px 0px rgba(15, 23, 42, 0.03), 0px 0px 24px 0px rgba(15, 23, 42, 0.06)",

								// Clean subtle border to make the edges razor-sharp
								// border: "1px solid",
								// borderColor: (theme) =>
								//   theme.palette.mode === "dark"
								//     ? "rgba(255, 255, 255, 0.05)"
								//     : "rgba(15, 23, 42, 0.04)",

								// background: colors.bg,
								// border: `1px solid ${colors.border}`,
								borderRadius: 2,
								transition: 'all .25s ease',

								boxShadow: (theme) =>
									theme.palette.mode === 'dark'
										? `
            0 2px 6px rgba(0,0,0,0.35),
            0 10px 20px rgba(0,0,0,0.28),
            0 18px 40px rgba(0,0,0,0.18)
          `
										: `
            0 2px 6px rgba(15,23,42,0.05),
            0 10px 20px rgba(15,23,42,0.08),
            0 18px 40px rgba(15,23,42,0.10)
          `,

								'&:hover': {
									// transform: "translateY(-8px) scale(1.035)",

									borderColor: `${colors.value}AA`,

									boxShadow: `
        0 0 0 1px ${colors.value}40,
        0 0 12px ${colors.value}50,
        0 8px 18px ${colors.value}30,
        0 18px 40px ${colors.value}25,
        0 32px 70px rgba(15,23,42,0.18)
      `,

									backgroundColor: colors.iconBg,
								},
							}}
						>
							<CardContent
								sx={{
									p: 1.8,
									'&:last-child': { pb: 1.8 },
									height: '100%',
								}}
							>
								<Box
									sx={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										height: '100%',
										gap: 1,
									}}
								>
									{labelIcon && (
										<Box
											className="metric-icon"
											sx={{
												transition: 'transform 0.35s ease',
												width: 56,
												height: 56,
												borderRadius: '18px',
												background: colors.iconBg,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												color: colors.value,
											}}
										>
											<IconComponent sx={{ fontSize: 30 }} />
										</Box>
									)}
									<Box
										display="flex"
										flexDirection="column"
										flex={1}
										gap={0.5}
										width="calc(100% - 56px)"
									>
										<ResponsiveTextWrapper
											value={label}
											fontWeight={600}
											variant="caption"
											component="span"
											color="text.secondary"
										/>

										{/* <Typography
                        variant="h6"
                        component="p"
                        sx={{
                          fontWeight: 600,
                          lineHeight: 1.2,
                          m: 0,
                          fontSize: { xs: "1.1rem", lg: "1.25rem" },
                          color:
                            key === "pv_efficiency" &&
                            kpiCardsData?.[key]?.today >= 18
                              ? ""
                              : (metricColors[accent] ?? "#595959"),
                        }}
                      >
                        {value}
                      </Typography> */}

										<ResponsiveTextWrapper
											value={value}
											variant="h6"
											fontWeight={700}
											lineHeight={1.2}
											color={colors.value}
										/>
									</Box>
								</Box>

								{/* <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      display: "block",
                      mt: 0.5,
                      opacity: 0.85,
                      fontSize: "0.68rem",
                    }}
                  >
                    {subLabel}
                  </Typography> */}
							</CardContent>
						</Card>
					</Grid>
				);
			})}
		</Grid>
	);
}

export default MetricCardsRow;
