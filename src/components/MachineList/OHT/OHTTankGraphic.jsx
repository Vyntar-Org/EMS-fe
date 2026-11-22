import { useId } from 'react';

// Compact industrial vessel. Unverified raw units never drive the water fill.
export default function OHTTankGraphic({
	percentage: suppliedPercentage,
	rawValue,
	unit = '',
	unavailable = false,
}) {
	const id = useId().replace(/:/g, '');
	const percentage = Number.isFinite(suppliedPercentage)
		? Math.min(100, Math.max(0, suppliedPercentage))
		: null;
	const valid =
		!unavailable &&
		Number.isFinite(percentage) &&
		percentage >= 0 &&
		percentage <= 100;
	const surface = valid ? 123 - percentage * 0.93 : 123;
	const body =
		'M24 36Q24 26 59 26Q94 26 94 36V119Q94 130 59 130Q24 130 24 119Z';
	const levelBand = !valid
		? 'unavailable'
		: percentage <= 25
		  ? 'red'
		  : percentage <= 50
		    ? 'orange'
		    : percentage <= 75
		      ? 'yellow'
		      : 'green';
	return (
		<figure data-water-ui="tank-visual">
			<svg
				data-water-ui="tank home-tank industrial-tank"
				viewBox="0 0 140 144"
				role="img"
				aria-label={
					valid
						? `Industrial water tank, ${percentage}% full`
						: unavailable
						  ? 'Tank level unavailable'
						  : `Tank reading ${rawValue}${
									unit ? ` ${unit}` : ''
						    }, fill percentage unavailable`
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
						<stop stopColor="#50e9ff" />
						<stop offset=".36" stopColor="#00aee1" />
						<stop offset="1" stopColor="#0461a5" />
					</linearGradient>
					<linearGradient id={`${id}-glass`}>
						<stop stopColor="#2384b5" stopOpacity=".34" />
						<stop offset=".33" stopColor="#c8f2ff" stopOpacity=".24" />
						<stop offset=".72" stopColor="#e0f6ff" stopOpacity=".44" />
						<stop offset="1" stopColor="#17669a" stopOpacity=".4" />
					</linearGradient>
					<linearGradient id={`${id}-rail`} x2="0" y2="1">
						<stop stopColor="#fff697" />
						<stop offset=".48" stopColor="#ffc423" />
						<stop offset="1" stopColor="#bb6c07" />
					</linearGradient>
					<linearGradient id={`${id}-scale`} x2="0" y2="1">
						<stop stopColor="#f7fdff" />
						<stop offset="1" stopColor="#cfedfa" />
					</linearGradient>
					<clipPath id={`${id}-body`}>
						<path d={body} />
					</clipPath>
				</defs>
				<ellipse cx="59" cy="136" rx="41" ry="4" fill="#24465c" opacity=".1" />
				<path
					d={body}
					fill={`url(#${id}-glass)`}
					stroke="#557d99"
					strokeWidth="1.5"
				/>
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
									<g data-water-ui="tank-wave">
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
									data-water-ui="bubble"
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
						stroke="#b9f5ff"
						strokeWidth="1.2"
						opacity=".65"
					/>
					<circle
						cx="59"
						cy="76"
						r="15"
						fill="#0576b5"
						fillOpacity=".28"
						stroke="#b3f5ff"
						strokeWidth="1.5"
					/>
					<path
						d="M59 63c-3 5-9 12-9 17a9 9 0 0 0 18 0c0-5-6-12-9-17Z"
						fill="#67e8f9"
						stroke="#d9f9ff"
					/>
					<path
						data-water-ui="tank-glint"
						d="M34 40V116"
						stroke="white"
						strokeWidth="4"
						strokeLinecap="round"
						opacity=".4"
					/>
				</g>
				<path
					d="M24 116Q59 126 94 116v5q-35 18-70 0z"
					fill={`url(#${id}-shell)`}
					stroke="#557d99"
				/>
				<ellipse
					cx="59"
					cy="29"
					rx="35"
					ry="8"
					fill={`url(#${id}-shell)`}
					stroke="#6c9ebb"
				/>
				<ellipse cx="59" cy="23" rx="7" ry="2" fill="#426b84" />
				<g
					fill="none"
					stroke={`url(#${id}-rail)`}
					strokeWidth="2.5"
					strokeLinecap="round"
				>
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
				<ellipse
					cx="8"
					cy="86"
					rx="6"
					ry="2.8"
					fill="none"
					stroke="#ffc423"
					strokeWidth="1.8"
				/>
				<g fill="#aec9d9" stroke="#638ba3" strokeWidth=".6">
					<rect x="3" y="105" width="10" height="4" rx="1" />
					<path d="M30 127h9v9h-9zm40 0h9v9h-9z" />
					<rect x="17" y="135" width="86" height="4" rx="1" />
				</g>
				{valid && (
					<g aria-hidden="true">
						<path d="M101 30v93" stroke="#276084" strokeWidth="1.2" />
						{[100, 75, 50, 25, 0].map((mark) => {
							const y = 123 - mark * 0.93;
							return (
								<g key={mark}>
									<path d={`M101 ${y}h6`} stroke="#287da6" />
									<circle
										cx="101"
										cy={y}
										r="1.7"
										fill="#effbff"
										stroke="#276084"
									/>
									<rect
										x="107"
										y={y - 6.5}
										width="32"
										height="13"
										rx="6.5"
										fill={`url(#${id}-scale)`}
										stroke="#90d7ef"
										strokeWidth=".6"
									/>
									<text
										x="123"
										y={y + 3}
										textAnchor="middle"
										data-water-ui="tank-scale-text"
									>
										{mark}%
									</text>
								</g>
							);
						})}
						<circle
							cx="101"
							cy={surface}
							r="2.6"
							fill="#21c7f3"
							stroke="#fff"
							strokeWidth="1"
						/>
					</g>
				)}
			</svg>
			<figcaption data-water-ui={`tank-reading level-${levelBand}`}>
				{valid && (
					<svg
						data-water-ui="tank-reading-icon"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							fill="currentColor"
							d="M12 2c-2 3.5-7 8.4-7 13a7 7 0 0 0 14 0c0-4.6-5-9.5-7-13Z"
						/>
						<path
							d="M8 15a4 4 0 0 0 4 4"
							fill="none"
							stroke="white"
							strokeWidth="1.4"
							strokeLinecap="round"
						/>
					</svg>
				)}
				<span data-water-ui="tank-value">
					{valid
						? percentage + '%'
						: unavailable
						  ? 'N/A'
						  : `${rawValue ?? 'N/A'}${unit ? ` ${unit}` : ''}`}
				</span>
			</figcaption>
		</figure>
	);
}
