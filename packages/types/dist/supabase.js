"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
// These can be replaced with environment variables in a real implementation
const SUPABASE_URL = 'https://gselexnbubrinvzhcwrk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZWxleG5idWJyaW52emhjd3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMTI4NjcsImV4cCI6MjA1NjY4ODg2N30.kss9h2HyI8eiaIfYeTkD-I0t1S3GBBNzS2PXlRQ6eeg';
exports.supabase = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_ANON_KEY);
