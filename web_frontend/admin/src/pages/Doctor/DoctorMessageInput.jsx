import { useRef, useState } from "react";
import { useDoctorChatStore } from "../Doctor/useDoctorChatStore.js";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage } = useDoctorChatStore();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="p-4 bg-white border-t border-gray-200 rounded-b-lg shadow-md">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-3">
          <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-300 shadow-sm">
            <img
              src={imagePreview}
              alt="Preview"
              className="object-cover w-full h-full"
            />
            <button
              onClick={removeImage}
              className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md hover:bg-red-100 transition"
              aria-label="Remove image"
            >
              <X size={16} className="text-red-600" />
            </button>
          </div>
          <p className="text-gray-600 italic">Image selected</p>
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-3"
        aria-label="Send message form"
      >
        <input
          type="text"
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition text-gray-700 placeholder-gray-400"
          placeholder="Type your message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Message input"
        />

        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageChange}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-full hover:bg-gray-100 transition"
          aria-label="Attach image"
          title="Attach image"
        >
          <Image size={24} className="text-gray-600" />
        </button>

        <button
          type="submit"
          disabled={!text.trim() && !imagePreview}
          className={`p-2 rounded-full bg-primary text-white hover:bg-primary-dark disabled:bg-primary/50 disabled:cursor-not-allowed transition-shadow shadow-md flex items-center justify-center`}
          aria-label="Send message"
          title="Send message"
        >
          <Send size={24} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
