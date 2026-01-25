import { useDoctorChatStore } from "../Doctor/useDoctorChatStore.js";
import { useDoctorAuthStore } from "../Doctor/useDoctorAuthStore.js";
import { useEffect, useRef } from "react";

import ChatHeader from "../../../../../web_frontend/src/components/chat/chatHeader.jsx";
import MessageInput from "../Doctor/DoctorMessageInput.jsx";
import MessageSkeleton from "../../../../../web_frontend/src/components/chat/messageSkleton.jsx";

const DoctorChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useDoctorChatStore();

  const { authDoctor, backendUrl } = useDoctorAuthStore();

  const messageEndRef = useRef(null);

  useEffect(() => {
    if (!selectedUser || !selectedUser.user?._id) return;

    getMessages(selectedUser.user._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser?.user?._id]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!authDoctor) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Loading doctor info...
      </div>
    );
  }

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Please select a patient to chat
      </div>
    );
  }

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto bg-base-200 rounded-lg shadow-md">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-base-200 rounded-lg shadow-md">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-400">
        {messages?.map((message, index) => {
          const isSentByDoctor = message.senderId === authDoctor._id;
          return (
            <div
              key={message._id}
              className={`chat max-w-[70%] ${
                isSentByDoctor ? "chat-end" : "chat-start"
              }`}
              ref={index === messages.length - 1 ? messageEndRef : null}
            >
              <div className="chat-image avatar">
                <div className="w-10 h-10 rounded-full border border-gray-300 overflow-hidden">
                  {/* Optional: Profile image */}
                </div>
              </div>
              <div className="chat-content max-w-full">
                <div className="chat-header mb-1 flex items-center space-x-2">
                  <span className="font-semibold text-sm text-gray-700">
                    {isSentByDoctor ? "You" : selectedUser.user.name}
                  </span>
                  <time className="text-xs text-gray-400">
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                <div
                  className={`chat-bubble flex flex-col shadow-md max-w-full break-words ${
                    isSentByDoctor
                      ? "bg-primary text-primary-content"
                      : "bg-gray-200 text-gray-900"
                  }`}
                >
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Attachment"
                      className="sm:max-w-[250px] rounded-md mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                      loading="lazy"
                    />
                  )}
                  {message.text && <p>{message.text}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput />
    </div>
  );
};

export default DoctorChatContainer;
