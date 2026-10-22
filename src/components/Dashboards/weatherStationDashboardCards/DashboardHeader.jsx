import { alpha, Box, Chip } from '@mui/material';
import dayjs from 'dayjs';

function DashboardHeader({ lastUpdated }) {
	const now = dayjs();
	const lastUpdateTime = lastUpdated ? dayjs(lastUpdated) : null;
	const isOnline = lastUpdateTime && now.diff(lastUpdateTime, 'minute') <= 15;
	const status = isOnline ? 'Online' : 'Offline';
	const statusColor = isOnline ? 'success' : 'error';

	const statusText = lastUpdated
		? `Last update: ${lastUpdateTime.format('D MMMM YYYY, hh:mm:ss a')}`
		: 'Last update: No data';

	return (
		<Chip
			size="small"
			label={`Station ${status} — ${statusText}`}
			sx={(theme) => ({
				backdropFilter: 'blur(6px)',
				WebkitBackdropFilter: 'blur(6px)',
				bgcolor:
					theme.palette.mode === 'dark'
						? alpha(theme.palette[statusColor].main, 0.08)
						: alpha(theme.palette[statusColor].main, 0.05),

				border: `1px solid ${alpha(
					theme.palette[statusColor].main,
					theme.palette.mode === 'dark' ? 0.3 : 0.2
				)}`,

				boxShadow: `0 4px 12px ${alpha(
					theme.palette[statusColor].main,
					0.06
				)}, inset 0 1px 1px ${alpha('#fff', 0.1)}`,

				color:
					theme.palette.mode === 'dark'
						? theme.palette[statusColor].light
						: theme.palette[statusColor].dark,

				'&:hover': {
					bgcolor: alpha(theme.palette[statusColor].main, 0.12),
					boxShadow: `0 4px 16px ${alpha(
						theme.palette[statusColor].main,
						0.15
					)}`,
				},
				borderRadius: '8px',
				maxWidth: '100%',
				// Fixed 30px clips the wrapped label on small screens — let the chip
				// grow with its content there, keep the compact bar on sm+
				height: { xs: 'auto', sm: '30px' },
				minHeight: '30px',
				float: { xs: 'none', sm: 'right' },
				display: { xs: 'flex', sm: 'inline-flex' },
				width: { xs: 'fit-content', sm: 'auto' },
				ml: { xs: 'auto', sm: 0 },
				mb: { xs: 1, sm: 0 },
				transition: 'all 0.3s ease',

				'& .MuiChip-label': {
					pl: 0.5,
					pr: 1.5,
					py: { xs: 0.6, sm: 0 },
					fontSize: { xs: '0.68rem', sm: '0.72rem' },
					fontWeight: 600,
					letterSpacing: '0.02em',
					textTransform: 'uppercase',
					whiteSpace: { xs: 'normal', sm: 'nowrap' },
					lineHeight: { xs: 1.5, sm: 'inherit' },
				},
			})}
			icon={
				<Box
					sx={(theme) => ({
						position: 'relative',
						width: 7,
						height: 7,
						borderRadius: '50%',
						bgcolor: `${statusColor}.main`,
						ml: '10px !important',
						mr: '2px !important',

						boxShadow: `0 0 0 2px ${alpha(
							theme.palette[statusColor].main,
							0.2
						)},
            0 0 8px 3px ${alpha(theme.palette[statusColor].main, 0.4)}`,

						'&::after': {
							content: '""',
							position: 'absolute',
							top: 0,
							left: 0,
							width: '100%',
							height: '100%',
							borderRadius: '50%',
							animation: 'weatherPulse 2.5s infinite ease-in-out',
							boxShadow: `0 0 0 0 ${alpha(
								theme.palette[statusColor].main,
								0.6
							)}`,
						},
						'@keyframes weatherPulse': {
							'0%': {
								transform: 'scale(0.95)',
								boxShadow: `0 0 0 0 ${alpha(
									theme.palette[statusColor].main,
									0.5
								)}`,
							},
							'70%': {
								transform: 'scale(1.8)',
								boxShadow: `0 0 0 6px ${alpha(
									theme.palette[statusColor].main,
									0
								)}`,
							},
							'100%': {
								transform: 'scale(0.95)',
								boxShadow: `0 0 0 0 ${alpha(
									theme.palette[statusColor].main,
									0
								)}`,
							},
						},
					})}
				/>
			}
		/>
		// <Box component="header" sx={{ m: 1 }}>
		//   <Grid
		//     container
		//     spacing={1}
		//     sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
		//   >
		//     <Grid xs={12} sm={12} md={12} lg={9}>
		//       <Typography
		//         variant="h5"
		//         component="h1"
		//         sx={{
		//           fontWeight: "bold",
		//           lineHeight: 1.3,
		//           fontSize: { xs: "1.1rem", sm: "1.25rem", lg: "1.2rem" },
		//           color: "text.primary",
		//         }}
		//       >
		//         Weather Station + Solar Energy Monitoring Dashboard
		//       </Typography>
		//       <Typography
		//         variant="caption"
		//         sx={{
		//           color: "text.secondary",
		//           display: "block",
		//           mt: 0.5,
		//           lineHeight: 1.5,
		//           opacity: 1,
		//         }}
		//       >
		//         Rainfall · Irradiance · Wind · AQI · Temperature · Pressure · Solar
		//         PV Generation
		//       </Typography>
		//     </Grid>
		//     <Grid
		//       xs={12}
		//       sm={12}
		//       md={12}
		//       lg={3}
		//       sx={{
		//         display: "flex",
		//         flexDirection: "column",
		//         alignItems: { xs: "flex-start", lg: "flex-end" },
		//         gap: 1,
		//       }}
		//     >
		//       <Chip
		//         size="small"
		//         label={`Station Online — ${statusText}`}
		//         sx={{
		//           border: "1px solid",
		//           borderColor: "success.main",
		//           color: "success.main",
		//           bgcolor:
		//             theme.palette.mode === "dark"
		//               ? "rgba(74, 222, 128, 0.1)"
		//               : "rgba(22, 163, 74, 0.08)",
		//           borderRadius: "999px",
		//           maxWidth: "100%",
		//           "& .MuiChip-label": {
		//             px: 1,
		//             fontSize: { xs: "0.68rem", sm: "0.75rem" },
		//             whiteSpace: { xs: "normal", sm: "nowrap" },
		//           },
		//         }}
		//         icon={
		//           <Box
		//             sx={{
		//               width: 8,
		//               height: 8,
		//               borderRadius: "50%",
		//               bgcolor: "success.main",
		//               boxShadow: (theme) => `0 0 6px ${theme.palette.success.main}`,
		//               ml: 1,
		//             }}
		//           />
		//         }
		//       />
		//     </Grid>
		//   </Grid>
		// </Box>
	);
}

export default DashboardHeader;
