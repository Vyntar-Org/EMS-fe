import { Box, Typography, useTheme } from '@mui/material';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';

import 'leaflet/dist/leaflet.css';
import { SITE_LAT, SITE_LON } from '../../../constants/weatherStationDashboard';
import { useMapHeight } from '../../../hooks/useWeatherStationChartHeight';
import DashboardCard from './DashboardCard';

import MapResizeHandler from './MapResizeHandler';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
	iconRetinaUrl: markerIcon2x,
	iconUrl: markerIcon,
	shadowUrl: markerShadow,
});

function SiteLocationMap({ lat = SITE_LAT, lon = SITE_LON }) {
	const { height: mapHeight, breakpoint } = useMapHeight();
	const theme = useTheme();

	return (
		<DashboardCard title="Satellite Site Location Map">
			<Box
				sx={{
					height: mapHeight,
					width: '100%',
					borderRadius: 1,
					overflow: 'hidden',
					'& .leaflet-container': {
						height: '100%',
						width: '100%',
						background: theme.palette.background.default,
						filter:
							theme.palette.mode === 'dark'
								? 'brightness(0.7) contrast(1.2)'
								: 'none',
					},
				}}
			>
				<MapContainer
					key={`map-${breakpoint}-${mapHeight}`}
					center={[lat, lon]}
					zoom={16}
					scrollWheelZoom={false}
					style={{ height: '100%', width: '100%' }}
				>
					<MapResizeHandler mapHeight={mapHeight} breakpoint={breakpoint} />

					<TileLayer
						attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
						url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
					/>

					<Circle
						center={[lat, lon]}
						radius={60}
						pathOptions={{
							color: '#38bdf8',
							fillColor: '#38bdf8',
							fillOpacity: 0.15,
						}}
					/>

					<Marker position={[lat, lon]}>
						<Popup>
							<strong>Weather Station + Solar PV Site</strong>
							<br />
							Lat: {lat}
							<br />
							Lon: {lon}
						</Popup>
					</Marker>
				</MapContainer>
			</Box>
			<Typography
				variant="caption"
				sx={{
					display: 'block',
					mt: 0.5,
					fontSize: '0.68rem',
					color: 'text.secondary',
					opacity: 0.8,
				}}
			>
				{/* Marker shows weather station / solar PV site. Edit SITE_LAT and SITE_LON in
        constants for exact coordinates. */}
			</Typography>
		</DashboardCard>
	);
}

export default SiteLocationMap;
