import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer } from "react-toastify";
import { useAuthStore } from "../store/useAuthStore";

export const AppContext = createContext(null);

const AppContextProvider = (props) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [userData, setUserData] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Sync user & token with Zustand store 
  useEffect(() => {
    if (token && userData) {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));

      const { setAuthUser, connectSocket, socket } = useAuthStore.getState();

      setAuthUser(userData);

      // Connect socket only if authUser._id exists and socket is not already connected
      if (userData._id && (!socket || !socket.connected)) {
        connectSocket();
      }
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }, [token, userData]);

  const value = {
    token,
    setToken,
    backendUrl,
    userData,
    setUserData,
  };

  return (
    <AppContext.Provider value={value}>
      {props.children}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        pauseOnHover
        theme="colored"
      />
    </AppContext.Provider>
  );
};

export default AppContextProvider;
