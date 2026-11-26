// Old static location details — replaced by the
// `/applications/weather/dashboard/site-location/` API response.
// // export const WEATHER_SITE_LATITUDE = 9.882433172319399;
// // export const WEATHER_SITE_LONGITUDE = 78.08168571904616;
//
// export const WEATHER_SITE_LATITUDE = 12.646579681923532;
// export const WEATHER_SITE_LONGITUDE = 80.1805368633938;
//
// export const WEATHER_SITE_SUMMARY_ROWS = [
// 	{
// 		item: 'Site Type',
// 		value: 'Independent weather station + solar',
// 	},
// 	{ item: 'Map Layer', value: 'Satellite imagery' },
// 	{
// 		item: 'Default Coordinates',
// 		value: 'Paiyanur, Mahabalipuram, Tamil Nadu 603104',
// 	},
// 	{
// 		item: 'Use Case',
// 		value: 'Field monitoring, weather correlation',
// 	},
// ];

// Rows shown in the Site Location Summary card. Values come from the
// `/applications/weather/dashboard/site-location/` response (`locations[0]`).
export const WEATHER_SITE_SUMMARY_FIELDS = [
	{ item: 'Site Name', key: 'name' },
	{ item: 'Site Type', key: 'site_type' },
	{ item: 'Address', key: 'address' },
	{ item: 'Coordinates', key: 'coordinates' },
	{ item: 'Use Case', key: 'use_case' },
];

// Static site location per login (keyed by `user.username`, uppercased),
// used when the site-location API returns no coordinates for the device.
export const WEATHER_SITE_LOCATIONS_BY_USERNAME = {
	TEL: {
		name: 'Weather Station + Solar PV Site',
		latitude: 12.646579681923532,
		longitude: 80.1805368633938,
		address: 'Paiyanur, Mahabalipuram, Tamil Nadu 603104',
		site_type: 'Independent weather station + solar',
		use_case: 'Field monitoring, weather correlation',
	},
	// TODO: confirm the Vadodara login username.
	VADODARA: {
		name: 'Turbo Energy Private Limited',
		latitude: 22.125720544739497,
		longitude: 73.18225534417837,
		address: '45GJ+6V4, Raman Gamdi, Gujarat 391243',
	},
};
