import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0xceCBFF203C8B6044F52CE23D914A1bfD997541A4";
const ABI = [
  "function updatePlayerData(address player, uint256 scoreAmount, uint256 transactionAmount) external"
];

export async function submitScore(wallet, score) {
  if (!window.ethereum) {
    console.error("No wallet provider found");
    return;
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

  try {
    const tx = await contract.updatePlayerData(wallet, score, 0);
    await tx.wait();
    console.log("✅ Score submitted:", score);
  } catch (err) {
    console.error("❌ Failed to submit score:", err);
  }
}
