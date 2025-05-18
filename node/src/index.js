require('dotenv').config();
const exchangeService = require('./services/exchange');
const supabaseService = require('./services/database/supabase.service');

async function main() {
    try {
        // Obtener todas las tasas y el promedio
        const { average, rates, errors } = await exchangeService.getAverageRate();

        // Guardar el promedio en la base de datos
        await supabaseService.saveRate(average, 'average');

        // Guardar cada tasa individual
        for (const [source, rate] of Object.entries(rates)) {
            if (rate !== null && !isNaN(rate)) {
                await supabaseService.saveRate(rate, source);
            }
        }

        console.log('Tasas obtenidas:', rates);
        console.log('Promedio:', average);
        if (Object.keys(errors).length > 0) {
            console.log('Errores:', errors);
        }

    } catch (error) {
        console.error('Error en el proceso principal:', error.message);
    }
}

// Ejecutar el proceso principal
main();

// Programar la ejecución cada hora
setInterval(main, 60 * 60 * 1000);
