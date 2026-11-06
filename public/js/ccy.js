/* country → currency (so prices show in the money they actually use) */
var BW_CCY = (function () {
  var EUR = 'austria belgium croatia cyprus estonia finland france germany greece ireland italy latvia lithuania luxembourg malta netherlands holland portugal slovakia slovenia spain';
  var M = { australia: 'AUD', 'new zealand': 'NZD', nz: 'NZD', 'united kingdom': 'GBP', uk: 'GBP', england: 'GBP', scotland: 'GBP', wales: 'GBP', 'northern ireland': 'GBP', 'great britain': 'GBP',
    'united states': 'USD', usa: 'USD', us: 'USD', america: 'USD', 'united states of america': 'USD', canada: 'CAD', 'south africa': 'ZAR', singapore: 'SGD', sweden: 'SEK', norway: 'NOK', denmark: 'DKK',
    switzerland: 'CHF', india: 'INR', japan: 'JPY', 'hong kong': 'HKD', malaysia: 'MYR', indonesia: 'IDR', philippines: 'PHP', thailand: 'THB', vietnam: 'VND', china: 'CNY', 'south korea': 'KRW', korea: 'KRW',
    'united arab emirates': 'AED', uae: 'AED', dubai: 'AED', 'saudi arabia': 'SAR', qatar: 'QAR', israel: 'ILS', turkey: 'TRY', poland: 'PLN', 'czech republic': 'CZK', czechia: 'CZK', hungary: 'HUF', romania: 'RON',
    bulgaria: 'BGN', iceland: 'ISK', mexico: 'MXN', brazil: 'BRL', argentina: 'ARS', chile: 'CLP', colombia: 'COP', peru: 'PEN', fiji: 'FJD', 'papua new guinea': 'PGK', kenya: 'KES', nigeria: 'NGN', egypt: 'EGP' };
  EUR.split(' ').forEach(function (c) { M[c] = 'EUR'; });
  function fromCountry(s) {
    s = String(s || '').toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim(); if (!s) return '';
    if (M[s]) return M[s];
    var parts = s.split(' '), best = '';   // "Brisbane, Australia" → australia
    for (var n = parts.length; n > 0 && !best; n--) for (var i = 0; i + n <= parts.length; i++) { var k = parts.slice(i, i + n).join(' '); if (M[k]) { best = M[k]; break; } }
    return best;
  }
  var FALL = { AUD: 1, NZD: 1.09, USD: 0.66, CAD: 0.91, GBP: 0.5, EUR: 0.58, SEK: 6.6, NOK: 6.9, DKK: 4.3, CHF: 0.53, SGD: 0.86, ZAR: 11.8, INR: 55, JPY: 98 };
  // today's rates, fetched once a day and kept for 24 hours
  function rates(cb) {
    var c = null; try { c = JSON.parse(localStorage.getItem('bw-rates24') || 'null'); } catch (e) {}
    if (c && Date.now() - c.at < 24 * 3600e3 && c.r) { cb(c.r, true); return; }
    cb(FALL, false);
    try { fetch('https://open.er-api.com/v6/latest/AUD').then(function (r) { return r.json(); }).then(function (j) {
      if (!j || !j.rates) return; try { localStorage.setItem('bw-rates24', JSON.stringify({ at: Date.now(), r: j.rates })); } catch (e) {} cb(j.rates, true);
    }).catch(function () {}); } catch (e) {}
  }
  return { fromCountry: fromCountry, rates: rates, FALL: FALL };
})();
