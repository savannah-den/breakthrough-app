// Rates a lead from cold to on fire, from what they told us. Shared by the lead function (server) and the coach dashboard.
// Score is 0-100. Reasons explain the score so Sav can see why someone is hot.
(function () {
var HEAT = [[75, 'fire', '🔥 On fire'], [50, 'hot', 'Hot'], [25, 'warm', 'Warm'], [0, 'cold', 'Cold']];
var WORTH = { '$1,000 - $2,000 AUD': 6, '$2,000 - $3,000 AUD': 14, '$3,000 - $4,000 AUD': 20, 'Priceless: I\'m ready to invest whatever it takes to become them': 25, '$1,000 - $2,000 USD': 6, '$2,000 - $3,000 USD': 14, '$3,000 - $4,000 USD': 20, 'Priceless - I\'m ready to invest in becoming HER': 25 };
function len(s) { return String(s || '').trim().length; }
function score(lead) {
  lead = lead || {}; var a = lead.application || {}, ints = lead.interests || [], s = 0, why = [];
  if (ints.indexOf('1:1') >= 0) { s += 20; why.push('+20 interested in 1:1'); }
  else if (ints.indexOf('group') >= 0) { s += 15; why.push('+15 interested in group'); }
  else if (ints.indexOf('community') >= 0) { s += 5; why.push('+5 interested in the community program'); }
  if (lead.applied_at || Object.keys(a).length) { s += 10; why.push('+10 filled out the application'); }
  var w = WORTH[a.worth]; if (w) { s += w; why.push('+' + w + ' worth it to them: ' + a.worth); }
  var c = String(a.commitment || '');
  if (len(c) > 150) { s += 10; why.push('+10 wrote a lot about commitment'); } else if (len(c) > 40) { s += 5; why.push('+5 answered commitment'); }
  if (/\b(ready|commit|committed|100 ?%|all in|whatever it takes|need this|now|asap|desperate|so done)\b/i.test(c)) { s += 10; why.push('+10 ready-now language'); }
  if (len(a.challenges) > 120) { s += 8; why.push('+8 clear about their struggles'); }
  if (len(a.wand) > 20) { s += 5; why.push('+5 knows what they want to master'); }
  if (len(a.future) > 60) { s += 5; why.push('+5 can picture their future self'); }
  if (len(a.tried) > 20) { s += 5; why.push('+5 has tried other things'); }
  if (lead.phone) { s += 2; why.push('+2 left a phone number'); }
  s = Math.min(100, s);
  var h = HEAT.filter(function (x) { return s >= x[0]; })[0];
  return { score: s, heat: h[1], label: h[2], why: why };
}
var API = { score: score, HEAT: HEAT, WORTH: WORTH, label: function (k) { var h = HEAT.filter(function (x) { return x[1] === k; })[0]; return h ? h[2] : k; } };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else window.BT_LEADSCORE = API;
})();
