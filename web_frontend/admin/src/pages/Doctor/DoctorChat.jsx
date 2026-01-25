import { useEffect, useState, useContext } from "react";
import { useLocation } from "react-router-dom";
import { useDoctorAuthStore } from "../Doctor/useDoctorAuthStore.js";
import { useDoctorChatStore } from "../Doctor/useDoctorChatStore.js";
import DoctorChatContainer from "../Doctor/DoctorChatContainer.jsx";
import { DoctorContext } from "../../context/DcotorContext.jsx";
import axios from "axios";

const DoctorChatPage = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  const { backendUrl, dToken } = useContext(DoctorContext);

  const {
    authDoctor,
    setAuthDoctor,
    connectSocket,
    socket,
  } = useDoctorAuthStore();

  const { setSelectedUser } = useDoctorChatStore();

  useEffect(() => {
    const initDoctorChat = async () => {
      const userFromNav = location.state;
      if (userFromNav) {
        setSelectedUser(userFromNav);
      }

      // Try Zustand store first
      if (!authDoctor) {
        // Try localStorage
        const saved = JSON.parse(localStorage.getItem("doctor-auth-storage"));
        const storedDoctor = saved?.state?.authDoctor;

        if (storedDoctor) {
          setAuthDoctor(storedDoctor);
          connectSocket();
        } else if (dToken) {
          // Fetch doctor data from backend using token
          try {
            const res = await axios.get(`${backendUrl}/api/doctor/me`, {
              headers: {
                Authorization: `Bearer ${dToken}`,
              },
            });
            setAuthDoctor(res.data.doctor);
            connectSocket();
          } catch (err) {
            console.error("Error fetching doctor info:", err);
          }
        }
      }

      setLoading(false);
    };

    initDoctorChat();
  }, [location.state, dToken]);

  useEffect(() => {
    if (authDoctor && !socket) {
      connectSocket();
    }
  }, [authDoctor]);

  if (loading || !authDoctor) {
    return <div>Loading user info...</div>;
  }

  return <DoctorChatContainer />;
};

export default DoctorChatPage;
