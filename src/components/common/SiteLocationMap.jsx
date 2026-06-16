import { Box, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import React from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';

const SiteLocationMap = ({
	center,
	zoom = 14,
	radius = 400,
	title = 'Site Location',
	scrollWheelZoom = false,
	height = '100%',
	width = '100%',
	circleColor = '#38bdf8',
	extraInfo = [],
}) => {
	const lat = parseFloat(center?.[0]);
	const lon = parseFloat(center?.[1]);
	const isValid = !isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0;

	if (!isValid) {
		return (
			<Box
				sx={{
					height,
					width,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<Typography variant="body2" color="text.secondary">
					Location not available
				</Typography>
			</Box>
		);
	}

	const safeCenter = [lat, lon];

	return (
		<MapContainer
			center={safeCenter}
			zoom={zoom}
			scrollWheelZoom={scrollWheelZoom}
			style={{ height, width }}
		>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
				url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>

			<Circle
				center={safeCenter}
				radius={radius}
				pathOptions={{
					color: circleColor,
					fillColor: circleColor,
					fillOpacity: 0.15,
				}}
			/>

			<Marker position={safeCenter}>
				<Popup>
					<strong>{title}</strong>
					<br />
					Lat: {lat}
					<br />
					Lon: {lon}
					{extraInfo.map(({ label, value }) => (
						<React.Fragment key={label}>
							<br />
							{label}: {value}
						</React.Fragment>
					))}
				</Popup>
			</Marker>
		</MapContainer>
	);
};

SiteLocationMap.propTypes = {
	center: PropTypes.arrayOf(
		PropTypes.oneOfType([PropTypes.number, PropTypes.string])
	),
	zoom: PropTypes.number,
	radius: PropTypes.number,
	title: PropTypes.string,
	scrollWheelZoom: PropTypes.bool,
	height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	circleColor: PropTypes.string,
	extraInfo: PropTypes.arrayOf(
		PropTypes.shape({
			label: PropTypes.string,
			value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		})
	),
};

export default SiteLocationMap;
