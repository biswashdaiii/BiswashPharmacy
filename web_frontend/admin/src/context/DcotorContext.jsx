import { useState, createContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const DoctorContext = createContext();

const DoctorContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [dToken, setDToken] = useState(localStorage.getItem("dToken") || "");
  const [appointments, setAppointments] = useState([]);

 const getAppointments = async () => {
  try {
    console.log("Fetching appointments with dToken:", dToken);
    const { data } = await axios.get(`${backendUrl}/api/doctor/appointments`, {
      headers: { Authorization: `Bearer ${dToken}` }, // <- use Authorization header here
    });

    if (data.success) {
      setAppointments(data.appointments.reverse());
    } else {
      toast.error(data.message || "Failed to load appointments");
    }
  } catch (error) {
    console.error("Appointment fetch error:", error);
    toast.error(error.response?.data?.message || "Failed to fetch doctor appointments");
  }
};


  const value = {
    dToken,
    setDToken,
    backendUrl,
    appointments,
    getAppointments,
  };

  return (
    <DoctorContext.Provider value={value}>
      {props.children}
    </DoctorContext.Provider>
  );
};

export default DoctorContextProvider;
