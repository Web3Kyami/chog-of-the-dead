// /src/auth/privy.js
let privy = null;

export function initPrivy() {
  if (!window.Privy) {
    console.error("❌ Privy SDK not loaded. Check index.html script tag.");
    return;
  }

  privy = new window.Privy({
    appId: "cmez5rcvf016sl50b40q9eb5g",   // your appId from dashboard
    loginMethods: ["email", "wallet"],   // disable sms
    embeddedWallets: { createOnLogin: "users-without-wallets" },
  });

  console.log("✅ Privy SDK initialized");
}

// Login with Monad Games ID
export async function loginWithMonadID() {
  if (!privy) throw new Error("Privy SDK not initialized");

  const user = await privy.login(); // opens modal

  if (!user) return null;

  // extract wallet + username
  let wallet = null;
  if (user.linkedAccounts && user.linkedAccounts.length > 0) {
    const crossApp = user.linkedAccounts.find(
      acc => acc.type === "cross_app" && acc.providerApp.id === "cmd8euall0037le0my79qpz42"
    );
    if (crossApp && crossApp.embeddedWallets.length > 0) {
      wallet = crossApp.embeddedWallets[0].address;
    }
  }

  // fetch username from Monad ID API
  let username = null;
  if (wallet) {
    try {
      const res = await fetch(`https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${wallet}`);
      const data = await res.json();
      username = data.hasUsername ? data.user.username : null;
    } catch (err) {
      console.error("❌ Username fetch failed:", err);
    }
  }

  return { wallet, username };
}
