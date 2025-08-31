import { usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";

export default function usePrivyBridge() {
  const { login, user, authenticated } = usePrivy();

  useEffect(() => {
    window.privyLogin = login;
    window.privyUser = () => user;
    window.privyAuthenticated = () => authenticated;
  }, [login, user, authenticated]);
}
