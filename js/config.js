/**
 * config.js — Credenciales de Supabase
 *
 * Completá con los valores de tu proyecto:
 * Dashboard → Settings → API
 *   · Project URL  → SUPABASE_URL
 *   · anon / public key → SUPABASE_KEY
 *
 * La anon key es segura para exponer en el cliente (está diseñada para eso).
 * La seguridad de escritura la maneja Row Level Security en Supabase.
 */

'use strict';

window.App        = window.App || {};
App.Config = {
  SUPABASE_URL: 'https://TU_PROYECTO.supabase.co',
  SUPABASE_KEY: 'TU_ANON_KEY'
};
