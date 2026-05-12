import Cookies from 'js-cookie';
import { encryptData, decryptData } from './encryption';

export const storage = {
  // Local Storage
  setLocal: (key, value) => {
    const encrypted = encryptData(value);
    if (encrypted) localStorage.setItem(key, encrypted);
  },
  getLocal: (key) => {
    const data = localStorage.getItem(key);
    return data ? decryptData(data) : null;
  },
  removeLocal: (key) => localStorage.removeItem(key),

  // Session Storage
  setSession: (key, value) => {
    const encrypted = encryptData(value);
    if (encrypted) sessionStorage.setItem(key, encrypted);
  },
  getSession: (key) => {
    const data = sessionStorage.getItem(key);
    return data ? decryptData(data) : null;
  },
  removeSession: (key) => sessionStorage.removeItem(key),

  // Cookies
  setCookie: (key, value, options = { expires: 1 }) => {
    const encrypted = encryptData(value);
    if (encrypted) Cookies.set(key, encrypted, options);
  },
  getCookie: (key) => {
    const data = Cookies.get(key);
    return data ? decryptData(data) : null;
  },
  removeCookie: (key) => Cookies.remove(key),

  // Clear All
  clearAll: () => {
    localStorage.clear();
    sessionStorage.clear();
    // Getting all cookies to remove them
    const cookies = Cookies.get();
    for (const cookie in cookies) {
      Cookies.remove(cookie);
    }
  }
};
