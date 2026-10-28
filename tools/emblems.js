// Prints the app's EMBLEM logos (from public/js/course.js) as JSON, for the playground launcher.
const fs = require('fs');
const s = fs.readFileSync(__dirname + '/../public/js/course.js', 'utf8');
const i = s.indexOf('var EMBLEM = {'); let j = i + 'var EMBLEM = '.length, depth = 0, k = j;
for (; k < s.length; k++) { const c = s[k]; if (c === "'") { k++; while (s[k] !== "'") { if (s[k] === '\\') k++; k++; } continue; } if (c === '{') depth++; if (c === '}') { depth--; if (!depth) break; } }
const obj = (new Function('return ' + s.slice(j, k + 1)))();
process.stdout.write(JSON.stringify(obj));
