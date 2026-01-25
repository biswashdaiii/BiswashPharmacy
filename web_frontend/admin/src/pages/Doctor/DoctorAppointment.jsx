import React, { useContext, useEffect, useState } from "react";
import { DoctorContext } from "../../context/DcotorContext.jsx";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const DoctorAppointments = () => {
  const { appointments, getAppointments, backendUrl, dToken } = useContext(DoctorContext);
  const [localAppointments, setLocalAppointments] = useState([]);
  const navigate = useNavigate();

  // Sync local appointments with context appointments
  useEffect(() => {
    setLocalAppointments(appointments);
  }, [appointments]);

  useEffect(() => {
    if (dToken) {
      getAppointments();
    } else {
      toast.error("Doctor not logged in");
    }
  }, [dToken]);

  const cancelAppointment = async (appointmentId) => {
    try {
      const url = `${backendUrl}/api/doctor/cancel-appointment`;
      const { data } = await axios.post(
        url,
        { appointmentId },
        { headers: { Authorization: `Bearer ${dToken}` } }
      );
      if (data.success) {
        toast.success(data.message);
        setLocalAppointments((prev) => prev.filter((item) => item._id !== appointmentId));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to cancel appointment");
    }
  };

  const handleChat = (appointment) => {
    navigate("/doctor-chat", { state: { user: appointment.userData } }); // ✅ Fix: pass patient (user)

  };

  return (
    <div className="min-h-screen px-4 py-6">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">
        Appointments for Doctor
      </h2>

      <div className="flex flex-col gap-4">
        {localAppointments.length === 0 ? (
          <p className="text-gray-600">No appointments found.</p>
        ) : (
          localAppointments.map((item, index) => (
            <div
              key={item._id || index}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border p-4 rounded-lg shadow-sm bg-white"
            >
              {/* Patient Info */}
              <div className="flex items-start gap-4">
                <img
                  src="/default-user.png"
                  alt={item.userData?.name || "Patient"}
                  className="w-16 h-16 object-cover rounded-full border"
                />
                <div className="text-gray-700 text-sm">
                  <p className="font-semibold text-base text-black">
                    {item.userData?.name}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Email:</span>{" "}
                    {item.userData?.email}
                  </p>
                  <p className="text-gray-600 mt-1">
                    <span className="font-medium">Date & Time:</span>{" "}
                    {item.slotDate} | {item.slotTime}
                  </p>
                  {/* Fee info removed here */}
                  <p className="text-gray-600 mt-1">
                    <span className="font-medium">Status:</span>{" "}
                    {item.paymentStatus || "Pending"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 ml-auto mt-4 sm:mt-0">
                <button
                  onClick={() => cancelAppointment(item._id)}
                  className="px-4 py-2 border border-gray-400 rounded hover:bg-red-100 hover:text-red-600 transition"
                >
                  Cancel Appointment
                </button>

                <button
                  onClick={() => handleChat(item)}
                  className="px-4 py-2 border border-blue-400 rounded hover:bg-blue-100 hover:text-blue-600 transition"
                >
                  Chat
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DoctorAppointments;
