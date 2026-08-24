// Servidor intermedio en Termux que acumula trabajo off-chain
const express = require("express");
const app = express();
app.use(express.json());

// Base de datos temporal en memoria local de tu Android
let minerosLocales = {}; 

// 1. Los mineros web envían sus shares GRATIS aquí
app.post("/submit-share-gasless", (req, res) => {
    const { minerAddress, nonce, difficulty } = req.body;
    
    // VALIDACIÓN LOCAL (No gasta Gas)
    // Aquí tu script verifica si el nonce es válido para la dificultad actual
    const esValido = verificarTrabajoLocal(minerAddress, nonce, difficulty); 
    
    if (esValido) {
        if (!minerosLocales[minerAddress]) {
            minerosLocales[minerAddress] = 0;
        }
        // Acumular la share en la memoria de Termux
        minerosLocales[minerAddress] += 1; 
        
        return res.json({ success: true, message: "Share guardada localmente sin costo de gas." });
    }
    
    res.status(400).json({ success: false, error: "Trabajo inválido" });
});

// 2. Función automatizada (Ej. Cada 24 horas o al llegar a 1000 shares)
async function liquidarEnBlockchain() {
    console.log("Iniciando liquidación automática en el contrato...");
    
    const direcciones = Object.keys(minerosLocales);
    const montosShares = Object.values(minerosLocales);
    
    if (direcciones.length === 0) return;

    try {
        // Se envía UNA SOLA transacción para cientos de mineros
        // Tu contrato debe soportar procesamiento por lotes (Batching)
        const tx = await contratoInteligente.distribuirMultiplesShares(direcciones, montosShares);
        await tx.wait();
        
        // Limpiar la base de datos local tras el éxito en cadena
        minerosLocales = {}; 
        console.log("Liquidación completada. Transacción:", tx.hash);
    } catch (error) {
        console.error("Error en la liquidación automática:", error);
    }
}

// Configurar el temporizador automático en Termux (Cada 24 horas)
setInterval(liquidarEnBlockchain, 24 * 60 * 60 * 1000);

app.listen(3000);
