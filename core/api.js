// core/api.js — Centralized backend client.
// All backend calls go through apiCall(). Swap the implementation later (Node API,
// Firebase, etc.) without touching business code.
//
// Convention: action = "resource.method" (REST-style). The Apps Script router
// dispatches on this string. Response shape: { ok: boolean, data?: any, error?: string }

(function () {
  const STORAGE_KEY = 'ipropre_api_url';
  const DEFAULT_URL = 'https://script.google.com/macros/s/AKfycbwERdZmU_Er4fE28_P5W156AQmbmQbzMSZmMbRZWlK0WcZ_BkblxhHNn4sV01mjBy2Weg/exec';

  function getApiUrl() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored.trim()) return stored.trim();
    } catch (e) {}
    return DEFAULT_URL;
  }

  function setApiUrl(url) {
    try {
      if (url && url.trim()) localStorage.setItem(STORAGE_KEY, url.trim());
      else localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }

  // Single entry point for backend calls.
  // Usage: await apiCall('soumissions.list')
  //        await apiCall('soumissions.save', { id, nom, ... })
  async function apiCall(action, payload) {
    const url = getApiUrl();
    if (!url) throw new Error('API URL not configured');

    // Apps Script Web Apps ignore custom Content-Type headers when CORS preflight kicks in.
    // We use text/plain so the request stays a "simple" CORS request (no preflight).
    const body = JSON.stringify(payload || {});
    const fullUrl = url + (url.includes('?') ? '&' : '?') + 'action=' + encodeURIComponent(action);

    let res;
    try {
      res = await fetch(fullUrl, {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body,
      });
    } catch (err) {
      throw new Error('Réseau : ' + err.message);
    }

    if (!res.ok) throw new Error('HTTP ' + res.status);
    let json;
    try {
      json = await res.json();
    } catch (e) {
      throw new Error('Réponse non-JSON du serveur');
    }
    if (!json.ok) throw new Error(json.error || 'Erreur serveur');
    return json.data;
  }

  // Fire-and-forget version (no error if offline)
  function apiCallSilent(action, payload) {
    return apiCall(action, payload).catch(() => null);
  }

  async function ping() {
    try {
      await apiCall('soumissions.list');
      return true;
    } catch (e) {
      return false;
    }
  }

  window.api = {
    call: apiCall,
    silent: apiCallSilent,
    ping,
    getUrl: getApiUrl,
    setUrl: setApiUrl,
  };
})();
