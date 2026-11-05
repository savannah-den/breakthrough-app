// Hourly (see netlify.toml, live site only): the journey emails Sav approved. All the rules live in netlify/lib/lifecycle.js.
const lifecycle = require('../lib/lifecycle');
exports.handler = async () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { statusCode: 200, body: 'not set up' };
  const r = await lifecycle.run();
  return { statusCode: 200, body: JSON.stringify(r) };
};
