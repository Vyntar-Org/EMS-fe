import SvgIcon from '@mui/material/SvgIcon';

export function TotalizerIcon(props) {
	return (
		<SvgIcon {...props}>
			<g
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<path d="M4 13H1.5v5H4m16-5h2.5v5H20" />
				<path d="M4 19v-6a8 8 0 0 1 16 0v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
				<rect x="6.5" y="13.5" width="11" height="5" rx="1" />
				<path d="M9 15.5v1m3-1v1m3-1v1" />
			</g>
			<path
				d="M12 6c-1 1.4-2 2.5-2 3.6a2 2 0 1 0 4 0c0-1.1-1-2.2-2-3.6Z"
				fill="currentColor"
			/>
		</SvgIcon>
	);
}

export function LevelControlIcon(props) {
	return (
		<SvgIcon {...props}>
			<g
				fill="none"
				stroke="currentColor"
				strokeWidth="1.55"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<path d="M6 5a8.5 8.5 0 0 1 12 0M8.5 7a5 5 0 0 1 7 0" />
				<path d="M2 17c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M2 21c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5" />
			</g>
			<path d="M9 8.5h6V12l-3 2.5L9 12Z" fill="currentColor" />
		</SvgIcon>
	);
}
