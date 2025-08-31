import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monadTestnet } from "./monad.js";

const CONTRACT_ADDRESS = "0xceCBFF203C8B6044F52CE23D914A1bfD997541A4";

const ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "player", "type": "address" },
      { "internalType": "uint256", "name": "scoreAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "transactionAmount", "type": "uint256" }
    ],
    "name": "updatePlayerData",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const client = createPublicClient({
  chain: monadTestnet,
  transport: http()
});

// ⚠️ For demo only, NEVER hardcode private keys in frontend!
const account = privateKeyToAccount("0xa1a34f08298fca27f948f20336572a84d33d50d487452b4bc3be6b0cd06dd61d");

const walletClient = createWalletClient({
  account,
  chain: monadTestnet,
  transport: http()
});

export async function submitScore(player, score) {
  return await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "updatePlayerData",
    args: [player, BigInt(score), 0n],
  });
}
