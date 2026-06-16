const CHIP_VALUE_COLORS = {
	// level values
	Full: { bg: '#C6F6D5', color: '#276749' },
	Low: { bg: '#FEEBC8', color: '#7B341E' },
	Empty: { bg: '#FED7D7', color: '#742A2A' },
	Medium: { bg: '#BEE3F8', color: '#2A4365' },

	// motor / status values
	ON: { bg: '#C6F6D5', color: '#276749' },
	OFF: { bg: '#FED7D7', color: '#742A2A' },
	RUNNING: { bg: '#C6F6D5', color: '#276749' },
	STOPPED: { bg: '#FED7D7', color: '#742A2A' },
	IDLE: { bg: '#EDF2F7', color: '#4A5568' },
	FAULT: { bg: '#FED7D7', color: '#742A2A' },
	ACTIVE: { bg: '#C6F6D5', color: '#276749' },
	INACTIVE: { bg: '#EDF2F7', color: '#4A5568' },
};

const StatusChips = ({ value }) => {
	const style =
		CHIP_VALUE_COLORS[String(value).toUpperCase()] ??
		CHIP_VALUE_COLORS[String(value)];

	if (!style) {
		return <span style={{ fontSize: '13px' }}>{value ?? '-'}</span>;
	}

	return (
		<span
			style={{
				display: 'inline-block',
				padding: '2px 10px',
				borderRadius: '20px',
				fontSize: '11px',
				fontWeight: 600,
				backgroundColor: style.bg,
				color: style.color,
				letterSpacing: '0.02em',
			}}
		>
			{value}
		</span>
	);
};

export default StatusChips;
