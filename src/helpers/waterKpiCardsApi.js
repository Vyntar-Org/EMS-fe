import { api } from './api';
import { API_URLS } from './apiUrls';

// Every response uses the { success, message, data, errors } envelope:
// GET returns the card list in `data`, POST/PATCH return the saved card.
const unwrapData = (response) =>
	response && typeof response === 'object' && 'data' in response
		? response.data
		: response;

// ADMIN-only endpoints, scoped server-side to the calling admin's own cards
// (a USER or SUPERADMIN token gets 403).
export const waterKpiCardsApi = {
	list: async (options) => {
		const cards = unwrapData(await api.get(API_URLS.WATER_KPI_CARDS, options));
		return Array.isArray(cards) ? cards : [];
	},
	create: async (body) =>
		unwrapData(await api.post(API_URLS.WATER_KPI_CARDS, body)),
	// PATCH only what changed. `slave_roles`, when sent, replaces the whole
	// mapping.
	update: async (cardId, changes) =>
		unwrapData(
			await api.patch(API_URLS.WATER_KPI_CARD_DETAIL(cardId), changes)
		),
	remove: (cardId) => api.delete(API_URLS.WATER_KPI_CARD_DETAIL(cardId)),
};
