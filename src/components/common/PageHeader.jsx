import { Box, Stack, Typography, alpha } from '@mui/material';

import ResponsiveTextWrapper from './ResponsiveTextWrapper';

/**
 * Standard top-of-page header: icon chip + title + subtitle, with an
 * actions slot on the right (filters, export buttons, tabs, ...). Purely
 * presentational — pages keep owning their own data/handlers and just pass
 * them in as `actions`.
 */
const PageHeader = ({ icon, title, subtitle, actions, sx = {} }) => {
	return (
		<Stack
			direction={{ xs: 'column', sm: 'row' }}
			alignItems={{ xs: 'flex-start', sm: 'center' }}
			justifyContent="space-between"
			gap={1.5}
			sx={{ width: '100%', minWidth: 0, ...sx }}
		>
			<Stack
				direction="row"
				alignItems="center"
				gap={1.5}
				minWidth={0}
				flex={1}
			>
				{icon && (
					<Box
						sx={{
							width: 44,
							height: 44,
							flexShrink: 0,
							borderRadius: '14px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							background: (t) =>
								`linear-gradient(135deg, ${alpha(
									t.palette.primary.main,
									t.palette.mode === 'dark' ? 0.28 : 0.14
								)} 0%, ${alpha(
									t.palette.primary.main,
									t.palette.mode === 'dark' ? 0.1 : 0.05
								)} 100%)`,
							boxShadow: (t) =>
								`0 0 0 1px ${alpha(
									t.palette.primary.main,
									t.palette.mode === 'dark' ? 0.35 : 0.2
								)}`,
							color: 'primary.main',
							'& svg': { fontSize: 24 },
						}}
					>
						{icon}
					</Box>
				)}
				<Box minWidth={0} flex={1}>
					<ResponsiveTextWrapper
						value={title}
						variant="h6"
						color="text.primary"
						fontWeight={700}
					/>
					{subtitle && (
						<Typography
							variant="body2"
							sx={{ color: 'text.secondary', fontWeight: 500, mt: 0.25 }}
						>
							{subtitle}
						</Typography>
					)}
				</Box>
			</Stack>
			{actions && (
				<Stack
					direction="row"
					alignItems="center"
					gap={1}
					flexShrink={0}
					sx={{ width: { xs: '100%', sm: 'auto' } }}
				>
					{actions}
				</Stack>
			)}
		</Stack>
	);
};

export default PageHeader;
