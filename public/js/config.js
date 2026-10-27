// Your Supabase project details (Supabase > Project Settings > API).
// These two values are designed to be public; the database security rules protect the data.
// Leave them blank to run the app in "preview mode" (saves to the device only, no login).
window.BT_CONFIG = {
  supabaseUrl: 'https://xlvvjsgmsqehvizrjsrc.supabase.co',      // e.g. 'https://abcdefghijk.supabase.co'
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsdnZqc2dtc3FlaHZpenJqc3JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwNzU2NzQsImV4cCI6MjEwODY1MTY3NH0.hfu7pfsbmAwmCPAbgUR6_czekZX_tlA0HQFPE8bG6ss',  // the long "anon public" key
  aiEnabled: true,      // AI Coach Sav buttons (needs ANTHROPIC_API_KEY set in Netlify)
  coachName: 'Sav'
};
