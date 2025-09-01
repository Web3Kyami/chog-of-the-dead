// /src/auth/privy.js
let privy = null;

export function initPrivy() {
  if (!window.Privy) {
    console.error("❌ Privy SDK not loaded. Check index.html script tag.");
    return;
  }

  // ✅ Initialize once
  privy = new window.Privy({
    appId: "cmez5rcvf016sl50b40q9eb5g", // your Privy appId from dashboard
    loginMethods: ["email", "wallet"], // email instead of sms
    embeddedWallets: { createOnLogin: "users-without-wallets" }
  });

  console.log("✅ Privy SDK initialized");
}

// Login with Monad Games ID
export async function loginWithMonadID() {
  if (!privy) throw new Error("Privy SDK not initialized");

  try {
    const user = await privy.login(); // opens Privy modal
    if (!user) return null;

    // 🔹 Extract wallet from Monad Games ID cross-app account
    let wallet = null;
    if (user.linkedAccounts && user.linkedAccounts.length > 0) {
      const crossApp = user.linkedAccounts.find(
        acc =>
          acc.type === "cross_app" &&
          acc.providerApp.id === "cmd8euall0037le0my79qpz42" // Monad Games ID Cross App ID
      );

      if (crossApp && crossApp.embeddedWallets.length > 0) {
        wallet = crossApp.embeddedWallets[0].address;
      }
    }

    // 🔹 Get username from Monad ID API
    let username = null;
    if (wallet) {
      try {
        const res = await fetch(
          `https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${wallet}`
        );
        const data = await res.json();
        username = data.hasUsername ? data.user.username : null;
      } catch (err) {
        console.error("❌ Username fetch failed:", err);
      }
    }

    return { wallet, username };
  } catch (err) {
    console.error("❌ Privy login failed:", err);
    return null;
  }
}
