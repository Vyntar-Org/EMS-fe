import { useId } from 'react';

// Compact industrial vessel. Unverified raw units never drive the water fill.
export default function WaterTankGraphic({
	percentage,
	rawValue,
	unavailable = false,
}) {
	const id = useId().replace(/:/g, '');
	const valid =
		!unavailable &&
		Number.isFinite(percentage) &&
		percentage >= 0 &&
		percentage <= 100;
	const surface = valid ? 123 - percentage * 0.93 : 123;
	const body =
		'M24 36Q24 26 59 26Q94 26 94 36V119Q94 130 59 130Q24 130 24 119Z';
	return (
		<svg
			className="wm-tank wm-home-tank wm-industrial-tank"
			viewBox="0 0 140 156"
			role="img"
			aria-label={
				valid
					? `Industrial water tank, ${percentage}% full`
					: unavailable
					  ? 'Tank level unavailable'
					  : `Tank reading ${rawValue}, percentage unit unverified`
			}
		>
			<defs>
				<linearGradient id={`${id}-shell`}>
					<stop stopColor="#547b92" />
					<stop offset=".22" stopColor="#bcd4e1" />
					<stop offset=".45" stopColor="#f3faff" />
					<stop offset=".7" stopColor="#b8d0dd" />
					<stop offset="1" stopColor="#5d859c" />
				</linearGradient>
				<linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1">
					<stop stopColor="#67e8f9" />
					<stop offset="1" stopColor="#0284c7" />
				</linearGradient>
				<clipPath id={`${id}-body`}>
					<path d={body} />
				</clipPath>
			</defs>
			<ellipse cx="59" cy="136" rx="41" ry="4" fill="#24465c" opacity=".1" />
			<path d={body} fill={`url(#${id}-shell)`} stroke="#6c9ebb" />
			<g clipPath={`url(#${id}-body)`}>
				{valid && percentage > 0 && (
					<>
						<rect
							x="24"
							y={surface}
							width="70"
							height={131 - surface}
							fill={`url(#${id}-water)`}
						/>
						{percentage < 100 && (
							<g transform={`translate(0 ${surface - 4})`}>
								<g className="wm-tank-wave">
									<path
										d="M0 5Q15-2 30 5T60 5T90 5T120 5T150 5T180 5T210 5T240 5V14H0Z"
										fill="#a5f3fc"
										opacity=".8"
									/>
								</g>
							</g>
						)}
						{[39, 58, 80].map((x, i) => (
							<circle
								key={x}
								className="wm-bubble"
								cx={x}
								cy="120"
								r={1.5 + i * 0.3}
								fill="white"
								opacity=".4"
								style={{
									animationDelay: `${i * -0.9}s`,
									'--bubble-rise': `${Math.max(3, percentage * 0.8)}px`,
								}}
							/>
						))}
					</>
				)}
				<path
					d="M24 56Q59 49 94 56M24 108Q59 101 94 108"
					fill="none"
					stroke="#0879b5"
					strokeWidth="3"
				/>
				<path
					d="M59 63c-3 5-9 12-9 17a9 9 0 0 0 18 0c0-5-6-12-9-17Z"
					fill="#0284c7"
					stroke="#d9f9ff"
				/>
				<path
					className="wm-tank-glint"
					d="M34 40V116"
					stroke="white"
					strokeWidth="4"
					strokeLinecap="round"
					opacity=".4"
				/>
			</g>
			<ellipse
				cx="59"
				cy="29"
				rx="35"
				ry="8"
				fill={`url(#${id}-shell)`}
				stroke="#6c9ebb"
			/>
			<ellipse cx="59" cy="23" rx="7" ry="2" fill="#426b84" />
			<g fill="none" stroke="#eab308" strokeWidth="1.8" strokeLinecap="round">
				<path d="M25 27V14q34-17 68 0v13M25 20q34-15 68 0M38 9v16M58 5v17M79 9v16M84 35v-9q0-4 4-4h2q5 0 5 5v102M84 129V35" />
				{[40, 54, 68, 82, 96, 110, 124].map((y) => (
					<path key={y} d={`M84 ${y}h11`} />
				))}
			</g>
			<path
				d="M24 56H13q-5 0-5 5v58h-3v14"
				fill="none"
				stroke="#0879b5"
				strokeWidth="6"
			/>
			<path
				d="M24 55H13q-5 0-5 6v55"
				fill="none"
				stroke="#7dd3fc"
				strokeWidth="1.5"
			/>
			<g fill="#aec9d9" stroke="#638ba3" strokeWidth=".6">
				<rect x="3" y="105" width="10" height="4" rx="1" />
				<path d="M30 127h9v9h-9zm40 0h9v9h-9z" />
				<rect x="17" y="135" width="86" height="4" rx="1" />
			</g>
			{[0, 25, 50, 75, 100].map((mark) => (
				<g key={mark} opacity={valid ? 1 : 0.5}>
					<path d={`M100 ${123 - mark * 0.93}h5`} stroke="#6c9ebb" />
					<text x="109" y={126 - mark * 0.93} fontSize="11" fill="#486581">
						{mark}%
					</text>
				</g>
			))}
			<text
				x="59"
				y="152"
				textAnchor="middle"
				fontSize={valid ? 17 : 11}
				fontWeight="600"
				fill="#102a43"
			>
				{valid ? percentage + '%' : unavailable ? 'N/A' : rawValue ?? 'N/A'}
			</text>
			{!valid && !unavailable && (
				<text
					x="59"
					y="82"
					textAnchor="middle"
					fontSize="9"
					fill="#486581"
					stroke="white"
					strokeWidth="2"
					paintOrder="stroke"
				>
					Raw value
				</text>
			)}
		</svg>
	);
}
