import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

const MapResizeHandler = ({ mapHeight, breakpoint }) => {
	const map = useMap();

	useEffect(() => {
		const timer = window.setTimeout(() => map.invalidateSize(), 150);
		return () => window.clearTimeout(timer);
	}, [breakpoint, map, mapHeight]);

	useEffect(() => {
		const container = map.getContainer()?.parentElement;
		if (!container) {
			return undefined;
		}

		const observer = new ResizeObserver(() => map.invalidateSize());
		observer.observe(container);

		return () => observer.disconnect();
	}, [map]);

	return null;
};

export default MapResizeHandler;
