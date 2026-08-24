const { ethers } = require("ethers");
const express = require("express");
const app = express();
app.use(express.json());

// Configuración de la Blockchain
const PROVIDER_URL = "TU_RPC_URL_DE_ALCHEMY_O_INFURA";
const CONTRACT_ADDRESS = "DIRECCION_DE_TU_CONTRATO_INTELIGENTE";
const PRIVATE_KEY = "TU_CLAVE_PRIVADA_SOLO_PARA_TESTNET";

const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contractABI = [ /* ABI de tu contrato VMS */ ];
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

// Endpoint para que los mineros web reporten su trabajo
app.post("/report-work", async (req, res) => {
    const { minerAddress, shares } = req.body;
    try {
        // Llama a una función del contrato para registrar o pagar al minero
        const tx = await contract.submitShares(minerAddress, shares);
        await tx.wait();
        res.json({ success: true, txHash: tx.hash });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(3000, () => console.log("Puente Termux corriendo en el puerto 3000"));
