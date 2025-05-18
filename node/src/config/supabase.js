require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Faltan las variables de entorno de Supabase');
}

// Crear el cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
