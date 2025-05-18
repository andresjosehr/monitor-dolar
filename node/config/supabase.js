require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Crear el cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
