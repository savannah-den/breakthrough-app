// Runs every hour (see netlify.toml): tells self-paced clients when their next week opens. Rules in netlify/lib/week-unlocks.js.
const { run } = require('../lib/week-unlocks');
exports.handler = async () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { statusCode: 200, body: 'not set up' };
  const r = await run(); return { statusCode: 200, body: JSON.stringify(r) };
};
