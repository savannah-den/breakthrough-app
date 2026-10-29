/* "View as client" (coach only): ?viewas=<their id>. Runs before anything else.
   Swaps this page's storage for a throwaway in-memory copy, so loading her data never touches
   your own app data on this device, and nothing you tap here is saved to her account. */
(function () {
  var q = new URLSearchParams(location.search), id = (window.BT_DEMO && window.BT_DEMO.viewAs) || q.get('viewas');
  // ?trial=1: the coach walks through the brand-new 1:1 client journey in a throwaway copy (nothing is saved)
  var trial = !window.BT_DEMO && q.get('trial') === '1';
  if (!id && !trial) return;
  var real = window.localStorage, mem = {}, keys = [];
  // keep the login session so the coach stays signed in
  try { for (var i = 0; i < real.length; i++) { var k = real.key(i); if (/^(__bt_auth|sb-|__bt_demo_db)/.test(k)) { mem[k] = real.getItem(k); keys.push(k); } } } catch (e) {}
  // the login itself always lives in the real storage: when the sign-in quietly refreshes in here, the new one is
  // kept for next time (otherwise the old one gets cancelled and you'd have to sign in again)
  var AUTH = /^(__bt_auth|sb-)/;
  var store = {
    getItem: function (k) { k = String(k); if (AUTH.test(k)) { try { return real.getItem(k); } catch (e) {} } return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
    setItem: function (k, v) { k = String(k); if (/^__bt_demo_db/.test(k) || AUTH.test(k)) { try { Storage.prototype.setItem.call(real, k, v); } catch (e) {} } if (!(k in mem)) keys.push(k); mem[k] = String(v); },
    removeItem: function (k) { k = String(k); if (AUTH.test(k)) { try { Storage.prototype.removeItem.call(real, k); } catch (e) {} } delete mem[k]; keys = keys.filter(function (x) { return x !== k; }); },
    key: function (i) { return keys[i] == null ? null : keys[i]; },
    clear: function () { mem = {}; keys = []; },
    get length() { return keys.length; }
  };
  try { Object.defineProperty(window, 'localStorage', { configurable: true, get: function () { return store; } }); } catch (e) {}
  if (trial) window.BT_TRIAL = true; else window.BT_VIEWAS = id;
})();
