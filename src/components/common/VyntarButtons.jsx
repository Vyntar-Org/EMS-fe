import { FileDownload } from '@mui/icons-material';
import { Button, CircularProgress } from '@mui/material';
import dayjs from 'dayjs';
import { useState } from 'react';

import { api } from '../../helpers/api';
import { triggerFileDownload } from '../../helpers/common';

const VyntarButtons = ({ children, variant = 'text', ...props }) => {
	return (
		<Button variant={variant} {...props}>
			{children}
		</Button>
	);
};
VyntarButtons.displayName = 'VyntarButtons';

const DownloadButton = ({
	label = 'Download',
	loadingStatus = 'Preparing Excel...',
	apiUrl,
	fileNamePrefix = 'extract',
	fileExtension = 'xlsx',
	isDownloadLoading: controlledLoading,
	onClick,
	disabled,
	sx = {},
	...props
}) => {
	const [localLoading, setLocalLoading] = useState(false);
	const isLoading = controlledLoading ?? localLoading;

	const handleDefaultDownload = async (event) => {
		if (onClick) {
			return onClick(event);
		}

		if (!apiUrl) {
			return;
		}

		try {
			setLocalLoading(true);

			const response = await api.get(apiUrl, {
				responseType: 'blob',
			});

			if (!response || !response.data) {
				return;
			}

			const blobData =
				response.data instanceof Blob
					? response.data
					: new Blob([response.data], {
							type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
					  });

			const url = URL.createObjectURL(blobData);
			const generatedFileName = `${fileNamePrefix}_${dayjs().format(
				'YYYY-MM-DD'
			)}.${fileExtension}`;

			triggerFileDownload(url, generatedFileName);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('File Download Handler Error:', error);
		} finally {
			setLocalLoading(false);
		}
	};

	return (
		<Button
			variant="contained"
			disabled={disabled || isLoading}
			onClick={handleDefaultDownload}
			startIcon={
				isLoading ? (
					<CircularProgress size={18} thickness={5} color="inherit" />
				) : (
					<FileDownload sx={{ fontSize: 20 }} />
				)
			}
			sx={{
				height: 42,
				px: 2.5,
				borderRadius: '12px',
				textTransform: 'none',
				fontWeight: 600,
				fontSize: '0.9rem',
				letterSpacing: '0.2px',
				color: '#fff',
				bgcolor: 'primary.main',
				minWidth: 180,

				'&:hover': {
					bgcolor: 'primary.dark',
				},

				'&.Mui-disabled': {
					bgcolor: 'brand.navySoft',
					color: '#fff',
				},
				...sx,
			}}
			{...props}
		>
			{isLoading ? loadingStatus : label}
		</Button>
	);
};
DownloadButton.displayName = 'VyntarButtons.Download';
VyntarButtons.Download = DownloadButton;

export default VyntarButtons;
