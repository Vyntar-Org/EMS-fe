import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

function MapResizeHandler({ mapHeight, breakpoint }) {
	const map = useMap();

	useEffect(() => {
		const timer = setTimeout(() => map.invalidateSize(), 150);
		return () => clearTimeout(timer);
	}, [map, mapHeight, breakpoint]);

	useEffect(() => {
		const container = map.getContainer()?.parentElement;
		if (!container) {
			return undefined;
		}

		const observer = new ResizeObserver(() => {
			map.invalidateSize();
		});
		observer.observe(container);
		return () => observer.disconnect();
	}, [map]);

	return null;
}

export default MapResizeHandler;
