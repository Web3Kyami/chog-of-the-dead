import React from "react";
import { PrivyProvider } from "@privy-io/react-auth";

export default function PrivyWrapper({ children }) {
  return (
    <PrivyProvider
      appId={import.meta.env.VITE_PUBLIC_PRIVY_APP_ID}
      config={{
        loginMethodsAndOrder: {
          primary: ["privy:cmd8euall0037le0my79qpz42"], // Monad Games ID
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
