// Thin client for the Cosmic Park booking API.
//
// In dev, VITE_API_BASE_URL is blank and vite proxies /api → :4000, so we
// use same-origin relative URLs. In prod, set VITE_API_BASE_URL to the API
// origin (e.g. https://api.cosmicpark.in).
const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(
      0,
      'Could not reach the booking service. Is the API running on port 4000?'
    );
  }

  if (res.status === 204) return null;

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!res.ok) {
    const message =
      data?.error?.message || data?.message || `Request failed (${res.status})`;
    throw new ApiError(res.status, message, data?.error?.details);
  }
  return data;
}

const qs = (params) => {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') s.append(k, v);
  });
  const str = s.toString();
  return str ? `?${str}` : '';
};

export const api = {
  // Public
  checkAvailability: ({ checkIn, checkOut, guests }, signal) =>
    request(`/api/availability${qs({ checkIn, checkOut, guests })}`, { signal }),

  listRoomTypes: (signal) => request('/api/room-types', { signal }),

  getRoomType: (id, signal) => request(`/api/room-types/${id}`, { signal }),

  listAddOns: (signal) => request('/api/add-ons', { signal }),

  getMedia: (section, roomTypeId, signal) =>
    request(`/api/media${qs({ section, roomTypeId })}`, { signal }),

  // Booking lifecycle
  createHold: (payload) =>
    request('/api/bookings/hold', { method: 'POST', body: payload }),

  confirmBooking: (id, payload = {}) =>
    request(`/api/bookings/${id}/confirm`, { method: 'POST', body: payload }),

  cancelBooking: (id, payload = {}) =>
    request(`/api/bookings/${id}/cancel`, { method: 'POST', body: payload }),

  getBooking: (id, signal) => request(`/api/bookings/${id}`, { signal }),

  health: (signal) => request('/api/health', { signal }),
};
