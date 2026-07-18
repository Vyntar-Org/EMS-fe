import { API_URLS } from './apiUrls';
import { storage } from './storage';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Access tokens live 30 minutes — refresh proactively 5 minutes before
// expiry (i.e. at the 25-minute mark). Refresh tokens live 7 days.
const ACCESS_TOKEN_LIFETIME_SECONDS = 30 * 60;
const REFRESH_AHEAD_MS = 5 * 60 * 1000;
const REFRESH_TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

const isTokenExpiringSoon = (expiryTime) => {
	if (!expiryTime) {
		return true;
	}
	const now = new Date().getTime();
	const timeToExpire = expiryTime - now;
	return timeToExpire < REFRESH_AHEAD_MS;
};

const isRefreshTokenExpired = () => {
	const refreshExpiry = storage.getLocal('refresh_expiry');
	// Older sessions may not have the expiry stored — let the backend decide
	if (!refreshExpiry) {
		return false;
	}
	return new Date().getTime() >= Number(refreshExpiry);
};

const logoutToLogin = () => {
	storage.clearAll();
	window.location.href = '/login';
};

const performTokenRefresh = async () => {
	const refreshToken = storage.getLocal('refresh_token');
	if (!refreshToken) {
		return null;
	}

	// The 7-day refresh window is over — no point calling the backend
	if (isRefreshTokenExpired()) {
		return null;
	}

	try {
		const response = await fetch(`${BASE_URL}${API_URLS.REFRESH}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			// Backend contract (FastAPI): field is `refresh_token` — sending
			// `refresh` gets a 422 and used to log the user out on every expiry
			body: JSON.stringify({ refresh_token: refreshToken }),
		});

		if (!response.ok) {
			return null;
		}

		const data = await response.json();
		const tokenPayload = data.data || data || {};
		const accessToken = tokenPayload.access || tokenPayload.access_token;
		// Some backends rotate the refresh token, some don't — keep the old one
		// when the response doesn't include a new one
		const rotatedRefreshToken =
			tokenPayload.refresh || tokenPayload.refresh_token;
		const accessExpiresIn =
			tokenPayload.access_expires_in ||
			tokenPayload.expires_in ||
			tokenPayload.expiresIn ||
			ACCESS_TOKEN_LIFETIME_SECONDS;

		if (!accessToken) {
			return null;
		}

		storage.setLocal('access_token', accessToken);
		storage.setLocal(
			'token_expiry',
			new Date().getTime() + Number(accessExpiresIn) * 1000
		);
		if (rotatedRefreshToken) {
			// New refresh token issued — its 7-day window restarts now
			storage.setLocal('refresh_token', rotatedRefreshToken);
			storage.setLocal(
				'refresh_expiry',
				new Date().getTime() + REFRESH_TOKEN_LIFETIME_MS
			);
		}
		return accessToken;
	} catch (error) {
		return null;
	}
};

// Parallel requests that 401 together must share one refresh call —
// otherwise the second refresh fires with an already-rotated (dead) token
// and logs the user out for no reason.
let refreshPromise = null;
const refreshAccessToken = () => {
	if (!refreshPromise) {
		refreshPromise = performTokenRefresh().finally(() => {
			refreshPromise = null;
		});
	}
	return refreshPromise;
};

const refreshTokenIfNeeded = async () => {
	const expiry = storage.getLocal('token_expiry');
	const refreshToken = storage.getLocal('refresh_token');

	if (refreshToken && isTokenExpiringSoon(expiry)) {
		// Proactive refresh — if it fails, don't kick the user out here; the
		// stored access token may still be valid, and the reactive 401 path
		// below is the one that decides whether the session is really over.
		const refreshed = await refreshAccessToken();
		if (refreshed) {
			return refreshed;
		}
	}
	return storage.getLocal('access_token');
};

const buildBody = (body, options) => {
	if (options?.urlencoded) {
		return new URLSearchParams(body).toString();
	}
	return JSON.stringify(body);
};

// Auth endpoints must not trigger the refresh/retry/kick-out cycle — a 401
// from login is just "wrong credentials" and must surface on the form.
const AUTH_ENDPOINTS = [API_URLS.LOGIN, API_URLS.REFRESH];

const executeFetch = (endpoint, options, token) => {
	const headers = {
		...(options.responseType !== 'blob' &&
			(options.urlencoded
				? { 'Content-Type': 'application/x-www-form-urlencoded' }
				: { 'Content-Type': 'application/json' })),
		...(token ? { Authorization: `Bearer ${token}` } : {}),
		...options.headers,
	};

	return fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
};

const fetchApi = async (endpoint, options = {}) => {
	const isAuthEndpoint = AUTH_ENDPOINTS.includes(endpoint);
	const token = isAuthEndpoint ? null : await refreshTokenIfNeeded();

	let response = await executeFetch(endpoint, options, token);

	// 401: the access token was rejected — try to refresh the session and
	// retry the request once. Only when the refresh itself fails (or the
	// retry still 401s) does the user actually get logged out.
	if (response.status === 401 && !isAuthEndpoint) {
		const newToken = await refreshAccessToken();

		if (!newToken) {
			logoutToLogin();
			throw new Error('Unauthorized');
		}

		response = await executeFetch(endpoint, options, newToken);

		if (response.status === 401) {
			logoutToLogin();
			throw new Error('Unauthorized');
		}
	}

	let data;

	if (options.responseType === 'blob') {
		data = await response.blob();
	} else if (options.responseType === 'text') {
		data = await response.text();
	} else {
		data = await response.json().catch(() => ({}));
	}

	if (!response.ok) {
		throw {
			status: response.status,
			data,
		};
	}

	// Return full response for blob so headers are accessible
	if (options.responseType === 'blob') {
		return {
			data,
			headers: response.headers,
			status: response.status,
		};
	}

	return data;
};

export const api = {
	get: (endpoint, options) => fetchApi(endpoint, { ...options, method: 'GET' }),
	post: (endpoint, body, options) =>
		fetchApi(endpoint, {
			...options,
			method: 'POST',
			body: buildBody(body, options),
		}),
	put: (endpoint, body, options) =>
		fetchApi(endpoint, {
			...options,
			method: 'PUT',
			body: buildBody(body, options),
		}),
	delete: (endpoint, options) =>
		fetchApi(endpoint, { ...options, method: 'DELETE' }),
};
