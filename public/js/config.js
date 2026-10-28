// Your Supabase project details (Supabase > Project Settings > API).
// These two values are designed to be public; the database security rules protect the data.
// Leave them blank to run the app in "preview mode" (saves to the device only, no login).
window.BT_CONFIG = {
  supabaseUrl: 'https://xlvvjsgmsqehvizrjsrc.supabase.co',      // e.g. 'https://abcdefghijk.supabase.co'
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsdnZqc2dtc3FlaHZpenJqc3JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwNzU2NzQsImV4cCI6MjEwODY1MTY3NH0.hfu7pfsbmAwmCPAbgUR6_czekZX_tlA0HQFPE8bG6ss',  // the long "anon public" key
  aiEnabled: true,      // AI Coach Sav buttons (needs ANTHROPIC_API_KEY set in Netlify)
  coachName: 'Sav'
};

// On the private preview link, show a small banner so it's obvious this isn't the live app.
if (/^preview--/.test(location.hostname)) document.addEventListener('DOMContentLoaded', function () {
  var b = document.createElement('div');
  b.textContent = 'PREVIEW · not the live app';
  b.setAttribute('style', 'position:fixed;top:0;left:50%;transform:translateX(-50%);z-index:99999;padding:4px 14px;border-radius:0 0 12px 12px;background:#F28C3B;color:#1F1412;font:600 12px Poppins,system-ui,sans-serif;letter-spacing:.04em;pointer-events:none');
  document.body.appendChild(b);
});
