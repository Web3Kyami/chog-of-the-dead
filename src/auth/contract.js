// src/auth/onchain.js
import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0xceCBFF203C8B6044F52CE23D914A1bfD997541A4";
const ABI = [
  "function updatePlayerData(address player, uint256 scoreAmount, uint256 transactionAmount) external"
];

// track last submitted score locally
let lastSubmittedScore = 0;

export async function submitScore(wallet, score) {
  if (!wallet || !window.ethereum) {
    console.error("No wallet or provider found");
    return;
  }

  const increment = score - lastSubmittedScore;
  if (increment <= 0) {
    console.log("⚠️ No new score to submit");
    return;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    const tx = await contract.updatePlayerData(wallet, increment, 0);
    await tx.wait();

    console.log("✅ Onchain score submitted:", increment, "total:", score);
    lastSubmittedScore = score; // update tracker
  } catch (err) {
    console.error("❌ Failed to submit score:", err);
  }
}
