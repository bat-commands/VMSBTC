require('dotenv').config(); // Carga las variables de tu archivo .env
const { ethers } = require("ethers");
const express = require("express");
const app = express();

app.use(express.json());

// ⚙️ Configuración desde variables de entorno
const PROVIDER_URL = process.env.PROVIDER_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PORT = process.env.PORT || 3000;

// Conexión segura con la Blockchain mediante Ethers
const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contractABI = require("./abi.json"); // Carga el ABI de tu contrato
const contratoInteligente = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

// 📦 Base de datos temporal en la memoria de Termux
let minerosLocales = {}; 

// Funcionalidad de validación simulada para evitar fraudes de los mineros web
function verificarTrabajoLocal(minerAddress, nonce, difficulty) {
    if (!minerAddress || !nonce) return false;
    // Aquí puedes añadir lógica criptográfica real si tu minero web genera hashes válidos
    return true; 
}

// 🌐 1. ENDPOINT: Los mineros web envían sus shares GRATIS aquí sin pagar Gas
app.post("/submit-share-gasless", (req, res) => {
    const { minerAddress, nonce, difficulty } = req.body;
    
    const esValido = verificarTrabajoLocal(minerAddress, nonce, difficulty); 
    
    if (esValido) {
        if (!minerosLocales[minerAddress]) {
            minerosLocales[minerAddress] = 0;
        }
        // Acumular el hash/share en la memoria de tu Android
        minerosLocales[minerAddress] += 1; 
        
        console.log(`Share registrada para ${minerAddress}. Total acumulado: ${minerosLocales[minerAddress]}`);
        return res.json({ success: true, message: "Share guardada en Termux sin costo de gas." });
    }
    
    res.status(400).json({ success: false, error: "Trabajo o hash inválido" });
});

// ⚡ 2. AUTOMATIZACIÓN: Envío por lotes a la Blockchain (Batching)
async function liquidarEnBlockchain() {
    console.log("Iniciando liquidación automática en el contrato...");
    
    const direcciones = Object.keys(minerosLocales);
    const montosShares = Object.values(minerosLocales);
    
    if (direcciones.length === 0) {
        console.log("No hay shares acumuladas para liquidar.");
        return;
    }

    try {
        console.log(`Enviando lote a la blockchain para ${direcciones.length} mineros...`);
        // Llama a la función optimizada de tu contrato inteligente
        const tx = await contratoInteligente.distribuirMultiplesShares(direcciones, montosShares);
        console.log("Transacción enviada. Esperando confirmación...");
        await tx.wait();
        
        // Si la transacción es exitosa, limpiamos la memoria en Termux
        minerosLocales = {}; 
        console.log("Liquidación masiva completada con éxito. Tx Hash:", tx.hash);
    } catch (error) {
        console.error("Error crítico durante la liquidación automática:", error);
    }
}

// Configura el temporizador automático en Termux (Por ejemplo, cada 1 hora para pruebas)
// 1 hora = 60 * 60 * 1000 milisegundos. Modifícalo según tu preferencia.
setInterval(liquidarEnBlockchain, 60 * 60 * 1000);

// Iniciar el servidor puente
app.listen(PORT, () => {
    console.log(`🚀 Puente Termux activo de forma ininterrumpida en el puerto ${PORT}`);
});
