import { createClient } from '@supabase/supabase-js';

// Valores por defecto del proyecto Supabase de Columpio Kids.
// Son públicos por diseño (viajan en el bundle del navegador); la seguridad
// real la dan Supabase Auth + RLS. Sin este fallback, el build de Vercel
// falla al prerenderizar si las env vars no están configuradas.
const DEFAULT_URL = 'https://cdjlszvrrfhapzwbquxx.supabase.co';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkamxzenZycmZoYXB6d2JxdXh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4ODg4ODYsImV4cCI6MjA5NTQ2NDg4Nn0.pUa7kwb1jUFyxR2sIAQqK2wZk2I8-MmxUiJbQLAileM';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
