import { useId } from 'react';

export default function EquipmentArt({
	kind,
	type,
	percentage,
	running = false,
	orientation,
}) {
	const id = useId().replace(/:/g, '');
	const tank = kind === 'tank',
		under = type === 'underground_tank',
		elevated = type === 'overhead_tank',
		household = type === 'household_tank';
	const waterY = percentage == null ? 100 : 96 - percentage * 0.62;
	return (
		<svg
			className={`sc-art sc-art-${kind} ${running ? 'sc-art-running' : ''}`}
			viewBox="0 0 160 110"
			aria-hidden="true"
		>
			<defs>
				<linearGradient id={`${id}-steel`}>
					<stop stopColor="#5c819c" />
					<stop offset=".23" stopColor="#d2e8f3" />
					<stop offset=".5" stopColor="#f5fbff" />
					<stop offset=".8" stopColor="#a9c6d8" />
					<stop offset="1" stopColor="#52768f" />
				</linearGradient>
				<linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1">
					<stop stopColor="#7de5f6" />
					<stop offset="1" stopColor="#0284c7" />
				</linearGradient>
				<clipPath id={`${id}-tank`}>
					<path d="M42 34Q80 23 118 34V91Q80 103 42 91Z" />
				</clipPath>
			</defs>
			{tank ? (
				<>
					{under && (
						<>
							<path d="M23 25h116v78H23Z" fill="#ede9de" />
							<path d="M20 25h122" stroke="#9aa987" strokeWidth="3" />
							<path d="M26 43h9m91 8h10M25 78h9m92 10h10" stroke="#cdbd9d" />
						</>
					)}
					{elevated && (
						<path
							d="M49 91 43 108m68-17 6 17M48 100h65"
							stroke="#63879f"
							strokeWidth="3"
						/>
					)}
					<path
						d="M42 34Q80 23 118 34V91Q80 103 42 91Z"
						fill={`url(#${id}-steel)`}
						stroke="#59849f"
					/>
					<g clipPath={`url(#${id}-tank)`}>
						{percentage != null && percentage > 0 && (
							<>
								<rect
									x="42"
									y={waterY}
									width="76"
									height={103 - waterY}
									fill={`url(#${id}-water)`}
									opacity=".85"
								/>
								<path
									className="sc-water-wave"
									d={`M0 ${
										waterY + 1
									}q10-5 20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0`}
									fill="none"
									stroke="#d4fbff"
									strokeWidth="3"
								/>
								{[56, 79, 102].map((x, i) => (
									<circle
										key={x}
										className="sc-water-bubble"
										cx={x}
										cy="91"
										r="1.6"
										fill="white"
										style={{
											animationDelay: `${i * -0.7}s`,
											'--rise': `${Math.max(2, percentage * 0.45)}px`,
										}}
									/>
								))}
							</>
						)}
						<path d="M52 40v47" stroke="white" strokeWidth="4" opacity=".4" />
						{household &&
							[46, 61, 77, 89].map((y) => (
								<path
									key={y}
									d={`M42 ${y}q38 12 76 0`}
									stroke="#639fbd"
									fill="none"
									opacity=".6"
								/>
							))}
						{!household && (
							<path
								d="M42 48q38-10 76 0m-76 36q38-10 76 0"
								stroke="#117bb5"
								fill="none"
								strokeWidth="3"
							/>
						)}
					</g>
					<ellipse
						cx="80"
						cy="34"
						rx="38"
						ry="8"
						fill={`url(#${id}-steel)`}
						stroke="#59849f"
					/>
					<rect x="70" y="22" width="20" height="6" rx="3" fill="#517e9a" />
					{!under && !household && (
						<g fill="none" stroke="#dca51b" strokeWidth="1.8">
							<path d="M43 29V17q37-17 74 0v12M43 23q37-15 74 0m-61-12v15m25-19v17m24-13v15M110 40V29h11v67m-11 0V40" />
							{[44, 58, 72, 86].map((y) => (
								<path key={y} d={`M110 ${y}h11`} />
							))}
						</g>
					)}
					{percentage == null && (
						<text
							x="80"
							y="72"
							textAnchor="middle"
							fontSize="11"
							fill="#496880"
						>
							No level
						</text>
					)}
				</>
			) : kind === 'pump' ? (
				<>
					<ellipse cx="80" cy="100" rx="57" ry="4" fill="#dfeaf2" />
					<path d="M15 65h19m93 0h21" stroke="#167fb3" strokeWidth="11" />
					<path d="M38 89v9h81v-9" fill="#8daec2" />
					<rect
						x="44"
						y="38"
						width="81"
						height="53"
						rx="9"
						fill={`url(#${id}-steel)`}
						stroke={running ? '#16996b' : '#5d839c'}
						strokeWidth="2"
					/>
					{[65, 76, 87, 98, 109].map((x) => (
						<path key={x} d={`M${x} 44v41`} stroke="#2a7098" strokeWidth="3" />
					))}
					<rect
						x="74"
						y="28"
						width="23"
						height="12"
						rx="2"
						fill="#78a9c7"
						stroke="#497d9d"
					/>
					<circle
						cx="44"
						cy="65"
						r="25"
						fill={running ? '#daf6ea' : '#cde7f5'}
						stroke={running ? '#16996b' : '#36799e'}
						strokeWidth="3"
					/>
					<g className="sc-impeller">
						<path
							d="M44 46v38m-19-19h38M31 52l26 26m-26 0 26-26"
							stroke={running ? '#16996b' : '#5d8aa5'}
							strokeWidth="4"
						/>
					</g>
					<circle
						cx="44"
						cy="65"
						r="6"
						fill={running ? '#16996b' : '#5d8aa5'}
					/>
				</>
			) : kind === 'meter' ? (
				<>
					<path d="M9 61h40m64 0h38" stroke="#127eb4" strokeWidth="10" />
					<path d="M45 47v28m71-28v28" stroke="#6c91a9" strokeWidth="5" />
					<circle
						cx="80"
						cy="59"
						r="32"
						fill="#eaf7ff"
						stroke="#22678f"
						strokeWidth="4"
					/>
					<circle cx="80" cy="59" r="26" fill="#fff" stroke="#a2d6ed" />
					<text
						x="80"
						y="66"
						textAnchor="middle"
						fontSize="21"
						fill="#21658f"
						fontWeight="700"
					>
						FM
					</text>
					<path d="M80 25v-9m-8 0h16" stroke="#22678f" strokeWidth="3" />
				</>
			) : kind === 'sensor' ? (
				<>
					<path d="M80 77v25m-13 0h26" stroke="#147db2" strokeWidth="4" />
					<circle
						cx="80"
						cy="52"
						r="24"
						fill="#effaff"
						stroke="#147db2"
						strokeWidth="3"
					/>
					<text x="80" y="58" textAnchor="middle" fill="#147db2" fontSize="16">
						{type === 'level_sensor'
							? 'LS'
							: type === 'motor_feedback'
							  ? 'MS'
							  : 'IoT'}
					</text>
					<path
						d="M54 24q26-17 52 0m-43 1q17-10 34 0"
						fill="none"
						stroke="#60b7dd"
						strokeWidth="2"
					/>
				</>
			) : kind === 'tanker' ? (
				<>
					<rect
						x="26"
						y="36"
						width="78"
						height="43"
						rx="18"
						fill={`url(#${id}-steel)`}
						stroke="#5d839c"
					/>
					<path d="M100 46h26l14 20v21h-40Z" fill="#2c98cc" />
					<path d="M108 51h15l9 14h-24Z" fill="#dff5ff" />
					<path d="M19 85h123" stroke="#5d839c" strokeWidth="4" />
					{[45, 119].map((x) => (
						<g key={x}>
							<circle cx={x} cy="90" r="10" fill="#3f5b70" />
							<circle cx={x} cy="90" r="4" fill="#e4f1f8" />
						</g>
					))}
					<path
						d="M64 42c-3 6-9 11-9 16a9 9 0 0 0 18 0c0-5-6-10-9-16Z"
						fill="#0284c7"
					/>
				</>
			) : kind === 'valve' ? (
				<>
					<path d="M8 73h144" stroke="#157fb4" strokeWidth="12" />
					<path
						d="M51 53 109 90V53L51 90Z"
						fill={`url(#${id}-steel)`}
						stroke="#36799e"
						strokeWidth="2"
					/>
					<path d="M80 58V28" stroke="#36799e" strokeWidth="5" />
					<ellipse
						cx="80"
						cy="26"
						rx="27"
						ry="8"
						fill="none"
						stroke="#287baa"
						strokeWidth="3"
					/>
				</>
			) : kind === 'junction' ? (
				<>
					<path
						d="M11 67h138M80 67V16"
						stroke="#116e9d"
						strokeWidth="15"
						strokeLinejoin="round"
					/>
					<path d="M11 64h138M77 67V16" stroke="#6ac7e8" strokeWidth="3" />
					<circle
						cx="80"
						cy="67"
						r="12"
						fill="#4fa9cc"
						stroke="#116e9d"
						strokeWidth="3"
					/>
				</>
			) : kind === 'consumption' ? (
				<>
					<path
						d="M34 63 80 28l46 35v35H34Z"
						fill="#e4f3fb"
						stroke="#4387ae"
						strokeWidth="2"
					/>
					<path
						d="M24 65 80 20l56 45"
						fill="none"
						stroke="#147db2"
						strokeWidth="5"
					/>
					<path
						d="M80 51c-4 7-13 16-13 23a13 13 0 0 0 26 0c0-7-9-16-13-23Z"
						fill="#24a0d8"
					/>
				</>
			) : type === 'borewell' ? (
				<>
					<path d="M45 30h49v70H45Z" fill="#e6e0d2" />
					<path
						d="M61 19h17v80H61Z"
						fill="#d3ebf9"
						stroke="#227cab"
						strokeWidth="2"
					/>
					<path d="M62 75h15v24H62Z" fill="#20a5df" />
					<path
						d="M69 20V10h29v39h35"
						stroke="#147db2"
						strokeWidth="5"
						fill="none"
					/>
					<path d="M49 42h7m26 15h8M48 82h7" stroke="#c2b499" />
				</>
			) : type === 'municipal' || type === 'inlet' ? (
				<>
					<path
						d="M22 75h36V48h45v22h26"
						stroke="#1784bc"
						strokeWidth="15"
						fill="none"
					/>
					<path d="M78 45V25m-18 0h37" stroke="#517e9a" strokeWidth="5" />
					<path
						d="M130 81c-2 4-6 8-6 11a6 6 0 0 0 12 0c0-3-4-7-6-11Z"
						fill="#20a5df"
					/>
				</>
			) : (
				<>
					{['harvesting'].includes(type) && (
						<path
							d="M39 38a15 15 0 0 1 24-13 22 22 0 0 1 40 4 14 14 0 0 1 17 22H41a8 8 0 0 1-2-13Z"
							fill="#d6ebf7"
							stroke="#659bb8"
						/>
					)}
					{['recycled', 'closed_loop'].includes(type) && (
						<g fill="none" stroke="#25a29c" strokeWidth="4">
							<path d="M40 42q40-39 80 0l-3-16m3 16-17-4M120 76q-40 39-80 0l3 16m-3-16 17 4" />
						</g>
					)}
					{type === 'groundwater' && (
						<>
							<path d="M22 31h116v57H22Z" fill="#ede7db" />
							<path
								d="M25 40h110m-110 13h110"
								stroke="#d2c4ad"
								strokeWidth="2"
							/>
						</>
					)}
					{[64, 78, 92].map((y, i) => (
						<path
							key={y}
							d={`M25 ${y}q14-10 28 0t28 0t28 0t28 0`}
							fill="none"
							stroke={i === 0 ? '#147db2' : '#56b9df'}
							strokeWidth="4"
						/>
					))}
				</>
			)}
		</svg>
	);
}
