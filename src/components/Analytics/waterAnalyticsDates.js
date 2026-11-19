import dayjs from 'dayjs';

export const getDefaultDateRange = () => [
	dayjs().subtract(24, 'hour'),
	dayjs(),
];
