import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatContainer from "../components/chat/chatContainer.jsx";

const ChatPage = () => {
  const location = useLocation();
  const doctor = location.state?.doctor; // ✅ Get doctor from navigation

  const {
    setSelectedDoctor,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  useEffect(() => {
    if (!doctor) return;

    setSelectedDoctor(doctor);
    getMessages(doctor._id);
    subscribeToMessages();

    return () => {
      unsubscribeFromMessages();
    };
  }, [doctor?._id]);

  if (!doctor) return <div>Please select an appointment to chat.</div>;

  return <ChatContainer />;
};

export default ChatPage;
