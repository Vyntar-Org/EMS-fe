import { Box, useTheme } from '@mui/material';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Circle, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

// Old static coordinates — now passed in from the site-location API.
// import {
// 	WEATHER_SITE_LATITUDE,
// 	WEATHER_SITE_LONGITUDE,
// } from '../../../constants/weatherStationDashboard';
import { useMapHeight } from '../../../hooks/useWeatherStationChartHeight';
import NoDataFound from '../../common/errors/NoDataFound';

import DashboardCard from './DashboardCard';
import MapResizeHandler from './MapResizeHandler';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
	iconRetinaUrl: markerIcon2x,
	iconUrl: markerIcon,
	shadowUrl: markerShadow,
});

// Old signature with static default coordinates:
// const SiteLocationMap = ({
// 	lat = WEATHER_SITE_LATITUDE,
// 	lon = WEATHER_SITE_LONGITUDE,
// }) => {
const SiteLocationMap = ({ lat, lon, name, loading = false }) => {
	const { height: mapHeight, breakpoint } = useMapHeight();
	const theme = useTheme();
	const hasPosition = Number.isFinite(lat) && Number.isFinite(lon);
	const position = [lat, lon];

	if (!hasPosition) {
		return (
			<DashboardCard title="Satellite Site Location Map">
				<Box sx={{ height: mapHeight, width: '100%' }}>
					<NoDataFound
						message={
							loading ? 'Loading site location…' : 'Site location not available'
						}
					/>
				</Box>
			</DashboardCard>
		);
	}

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
						backgroundColor: 'background.default',
						filter:
							theme.palette.mode === 'dark'
								? 'brightness(0.7) contrast(1.2)'
								: 'none',
					},
				}}
			>
				<MapContainer
					// key={`weather-map-${breakpoint}-${mapHeight}`}
					key={`weather-map-${breakpoint}-${mapHeight}-${lat}-${lon}`}
					center={position}
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
						center={position}
						radius={60}
						pathOptions={{
							color: '#38bdf8',
							fillColor: '#38bdf8',
							fillOpacity: 0.15,
						}}
					/>
					<Marker position={position}>
						<Popup>
							{/* <strong>Weather Station + Solar PV Site</strong> */}
							<strong>{name || 'Weather Station Site'}</strong>
							<br />
							Lat: {lat}
							<br />
							Lon: {lon}
						</Popup>
					</Marker>
				</MapContainer>
			</Box>
		</DashboardCard>
	);
};

export default SiteLocationMap;
