import SvgIcon from '@mui/material/SvgIcon';

// Industrial tank with a safety railing, access ladder, pipe and water emblem.
export default function WaterTankIcon(props) {
	return (
		<SvgIcon {...props} viewBox="0 0 24 24">
			<g
				fill="none"
				stroke="currentColor"
				strokeWidth="1.35"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<path d="M5 7c0-2.7 14-2.7 14 0v12c0 2.7-14 2.7-14 0ZM5 8c3 1.3 11 1.3 14 0M5 17c3 1.3 11 1.3 14 0M5 11H2v9M5 5V2.8c4-1.6 10-1.6 14 0V5M9 2v2m5-2v2M17 8v13m3-15v15m-3-10h3m-3 4h3m-3 4h3M4 22h17" />
			</g>
			<path
				d="M11.5 9.5c-.7 1-2.3 2.7-2.3 4a2.3 2.3 0 0 0 4.6 0c0-1.3-1.6-3-2.3-4Z"
				fill="currentColor"
			/>
		</SvgIcon>
	);
}
