import { useState } from 'react';
import {
	TextField,
	MenuItem,
	InputAdornment,
	Button,
	Tooltip,
} from '@mui/material';
import SearchRounded from '@mui/icons-material/SearchRounded';
import EquipmentArt from './EquipmentArt';

export default function EquipmentLibrary({
	catalog,
	onAdd,
	onExample,
	preview,
	disabled,
}) {
	const [search, setSearch] = useState(''),
		[category, setCategory] = useState('all'),
		[collapsed, setCollapsed] = useState({});
	const groups = catalog.categories
		.filter((group) => category === 'all' || category === group.id)
		.map((group) => ({
			...group,
			components: group.components.filter((item) =>
				`${item.label} ${item.description || ''}`
					.toLowerCase()
					.includes(search.toLowerCase())
			),
		}))
		.filter((group) => group.components.length);
	return (
		<aside className="sc-library" aria-label="Equipment library">
			<div className="sc-panel-title">
				<div>
					<strong>Equipment library</strong>
					<small>
						{preview ? 'Simulated catalog' : 'Authorized equipment catalog'}
					</small>
				</div>
				<span className="sc-library-count">
					{catalog.categories.reduce(
						(count, group) => count + group.components.length,
						0
					)}
				</span>
			</div>
			<TextField
				size="small"
				placeholder="Search equipment"
				value={search}
				onChange={(event) => setSearch(event.target.value)}
				inputProps={{ 'aria-label': 'Search equipment library' }}
				InputProps={{
					startAdornment: (
						<InputAdornment position="start">
							<SearchRounded fontSize="small" />
						</InputAdornment>
					),
				}}
			/>
			<TextField
				select
				size="small"
				label="Category"
				value={category}
				onChange={(event) => setCategory(event.target.value)}
			>
				<MenuItem value="all">All categories</MenuItem>
				{catalog.categories.map((group) => (
					<MenuItem key={group.id} value={group.id}>
						{group.name}
					</MenuItem>
				))}
			</TextField>
			<div className="sc-library-groups">
				{!groups.length && <p className="sc-muted">No matching equipment.</p>}
				{groups.map((group) => (
					<section key={group.id}>
						<button
							className="sc-group-heading"
							aria-expanded={!collapsed[group.id] || Boolean(search)}
							onClick={() =>
								setCollapsed((current) => ({
									...current,
									[group.id]: !current[group.id],
								}))
							}
						>
							<span>{group.name}</span>
							<span>
								{group.components.length}{' '}
								{collapsed[group.id] && !search ? '+' : '−'}
							</span>
						</button>
						{(!collapsed[group.id] || search) &&
							group.components.map((item) => (
								<Tooltip
									key={item.type}
									title={item.description || item.label}
									placement="right"
								>
									<div
										className={`sc-library-item ${
											item.available === false ? 'sc-unavailable' : ''
										}`}
										draggable={!disabled && item.available !== false}
										onDragStart={(event) => {
											event.dataTransfer.setData(
												'application/water-equipment',
												item.type
											);
											event.dataTransfer.effectAllowed = 'copy';
										}}
									>
										<EquipmentArt kind={item.kind} type={item.type} />
										<div>
											<strong>{item.label}</strong>
											<small>
												{item.available === false
													? 'Unavailable'
													: preview
													  ? 'Preview component'
													  : 'Available'}
											</small>
										</div>
										<button
											type="button"
											disabled={disabled || item.available === false}
											onClick={() => onAdd(item.type)}
											aria-label={`Add ${item.label}`}
											title="Add equipment"
										>
											+
										</button>
									</div>
								</Tooltip>
							))}
					</section>
				))}
			</div>
			{preview && (
				<div className="sc-library-footer">
					<Button
						size="small"
						variant="outlined"
						onClick={onExample}
						disabled={disabled}
					>
						Reference example
					</Button>
					<small>Optional demo topology. Never loaded automatically.</small>
				</div>
			)}
		</aside>
	);
}
