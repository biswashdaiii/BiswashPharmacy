import { useChatStore } from "../../store/useChatStore.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import { useEffect, useRef } from "react";

import ChatHeader from "./chatHeader.jsx";
import MessageInput from "./messageInput.jsx";
import MessageSkeleton from "./messageSkleton.jsx";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedDoctor,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  const { authUser, backendUrl } = useAuthStore();

  const messageEndRef = useRef(null);

  useEffect(() => {
    if (!selectedDoctor) return;

    getMessages(selectedDoctor._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedDoctor?._id]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!authUser) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Loading user info...
      </div>
    );
  }

  if (!selectedDoctor) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Please select an appointment to chat
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

  const buildProfilePicUrl = (image) => {
    if (!image) return "/avatar.png";
    if (image.startsWith("http")) return image;
    return `${backendUrl}/uploads/${image}`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-base-200 rounded-lg shadow-md">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-400">
        {messages?.map((message, index) => {
          const isSentByUser = message.senderId === authUser._id;

          return (
            <div
              key={message._id}
              className={`chat max-w-[70%] ${
                isSentByUser ? "chat-end" : "chat-start"
              }`}
              ref={index === messages.length - 1 ? messageEndRef : null}
            >
              <div className="chat-image avatar">
                <div className="w-10 h-10 rounded-full border border-gray-300 overflow-hidden">
                  <img
                    src={
                      isSentByUser
                        ? buildProfilePicUrl(authUser.profilePic)
                        : buildProfilePicUrl(selectedDoctor.profilePic)
                    }
                    alt="profile pic"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/avatar.png";
                    }}
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>

              <div className="chat-content max-w-full">
                <div className="chat-header mb-1 flex items-center space-x-2">
                  <span className="font-semibold text-sm text-gray-700">
                    {isSentByUser ? "You" : selectedDoctor.name}
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
                    message.senderId === authUser._id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-300 text-black"
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

export default ChatContainer;
