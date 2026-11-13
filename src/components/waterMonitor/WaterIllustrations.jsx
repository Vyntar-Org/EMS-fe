import { useId } from 'react';

export function WaterPlantIllustration() {
	const id = useId().replace(/:/g, '');
	return (
		<svg viewBox="0 0 190 66" aria-hidden="true" className="wm-plant">
			<defs>
				<linearGradient id={id}>
					<stop stopColor="#8bd5f7" />
					<stop offset=".45" stopColor="#effcff" />
					<stop offset="1" stopColor="#159bdd" />
				</linearGradient>
			</defs>
			<path d="M4 62H187" stroke="#288c69" strokeWidth="2" />
			{[
				{ x: 24, y: 24, w: 35, h: 35 },
				{ x: 76, y: 14, w: 40, h: 45 },
				{ x: 132, y: 29, w: 35, h: 30 },
			].map(({ x, y, w, h }) => (
				<g key={x}>
					<path
						d={`M${x} ${y}V${y + h}Q${x + w / 2} ${y + h + 8} ${x + w} ${
							y + h
						}V${y}`}
						fill={`url(#${id})`}
						stroke="#188ac2"
					/>
					<ellipse
						cx={x + w / 2}
						cy={y}
						rx={w / 2}
						ry="5"
						fill="#c6efff"
						stroke="#188ac2"
					/>
					<path
						d={`M${x + 5} ${y + 3}V${y + h - 2}M${x + w - 5} ${y + 3}V${
							y + h - 2
						}`}
						stroke="#62bee8"
					/>
					<path d={`M${x + w / 2 - 3} ${y - 5}h6v-2h-6z`} fill="#39728c" />
					<path
						d={`M${x + 4} ${y + h + 2}v5m${w - 8} -5v5`}
						stroke="#3e6c7c"
						strokeWidth="2"
					/>
				</g>
			))}
			{[12, 64, 122, 178].map((x) => (
				<g key={x}>
					<path d={`M${x} 60v-14`} stroke="#417c58" />
					<ellipse cx={x} cy="48" rx="4" ry="10" fill="#57b94f" />
					<ellipse cx={x + 2} cy="50" rx="2" ry="7" fill="#8ddb60" />
				</g>
			))}
		</svg>
	);
}
export function MotorIllustration({ running }) {
	const id = useId().replace(/:/g, '');
	return (
		<svg
			viewBox="0 0 116 66"
			className={`wm-motor-drawing ${running ? 'wm-pump-active' : ''}`}
			aria-hidden="true"
		>
			<defs>
				<linearGradient id={id} x2="0" y2="1">
					<stop stopColor={running ? '#63dd66' : '#becdd6'} />
					<stop offset=".4" stopColor={running ? '#158d22' : '#849cab'} />
					<stop offset=".7" stopColor={running ? '#087212' : '#465d6b'} />
					<stop offset="1" stopColor={running ? '#3eb346' : '#a4b8c4'} />
				</linearGradient>
			</defs>
			<g
				className="wm-motor-ripples"
				fill="none"
				stroke={running ? '#56d870' : '#9dafbd'}
				strokeWidth="4"
			>
				<path d="M22 13Q3 33 22 53M94 13Q113 33 94 53" opacity=".2" />
				<path d="M15 7Q-8 33 15 59M101 7Q124 33 101 59" opacity=".12" />
			</g>
			<path d="M35 52v6h43v-6" fill="#4e6978" />
			<path
				d="M38 14h43v35H38z"
				rx="7"
				fill={`url(#${id})`}
				stroke={running ? '#186d28' : '#4d6879'}
			/>
			<ellipse
				cx="81"
				cy="32"
				rx="9"
				ry="18"
				fill={`url(#${id})`}
				stroke="#547280"
			/>
			{[44, 50, 56, 62, 68, 74].map((x) => (
				<path
					key={x}
					d={`M${x} 17v29`}
					stroke={running ? '#0e6b24' : '#4e6978'}
					opacity=".65"
				/>
			))}
			<rect
				x="48"
				y="6"
				width="19"
				height="9"
				rx="3"
				fill={`url(#${id})`}
				stroke="#4e6978"
			/>
			<ellipse
				cx="36"
				cy="32"
				rx="12"
				ry="19"
				fill="#a1bdca"
				stroke="#4e6978"
			/>
			<ellipse
				cx="36"
				cy="32"
				rx="7"
				ry="14"
				fill={`url(#${id})`}
				stroke="#4e6978"
			/>
			<path d="M27 29h-8v6h8" fill="#7c98a7" />
			<path
				d="M35 19v26"
				stroke="#e1f0f4"
				strokeWidth="2"
				className={running ? 'wm-shaft-spin' : ''}
			/>
		</svg>
	);
}
export function WaterRibbon({ className = '' }) {
	const ribbonId = useId().replace(/:/g, '');
	return (
		<svg
			viewBox="0 0 700 94"
			preserveAspectRatio="none"
			className={className}
			aria-hidden="true"
		>
			<defs>
				<linearGradient id={ribbonId} x1="0" x2="0" y2="1">
					<stop stopColor="#00a5e8" stopOpacity=".65" />
					<stop offset="1" stopColor="#98e9ff" stopOpacity=".05" />
				</linearGradient>
			</defs>
			<path
				d="M0 75Q90 -12 180 49T350 39T520 40T700 20V94H0Z"
				fill={`url(#${ribbonId})`}
			/>
			<path
				d="M0 73Q90 -12 180 49T350 39T520 40T700 20"
				fill="none"
				stroke="#36c5fb"
				strokeWidth="3"
			/>
			<path
				d="M0 84Q90 4 180 60T350 50T520 51T700 31"
				fill="none"
				stroke="white"
				strokeWidth="2"
				opacity=".85"
			/>
			{[110, 193, 306, 490, 610].map((x, i) => (
				<circle
					key={x}
					cx={x}
					cy={20 + (i % 3) * 20}
					r={3 + (i % 3) * 3}
					fill="#e5faff"
					stroke="#55c7f2"
					opacity=".7"
				/>
			))}
		</svg>
	);
}
