
import doctorModel from "../models/doctor_model.js"; // ✅ CORRECT
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { appointmentModel } from "../models/appointmentModel.js";
import { fetchchatMessages, chatRoom, createMessage } from "../Service/chatService.js";
import { getRoomId } from "../config/chatHelper.js";


export const changeAvailability = async (req, res) => {
  try {
    const { docId } = req.body
    const docData = await doctorModel.findById(docId)
    await doctorModel.findByIdAndUpdate(docId, { available: !docData.available })
    res.json({ success: true, message: "avaiablity changed" })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })

  }
}

export const doctorList = async (req, res) => {
  try {

    const doctors = await doctorModel.find({}).select(["-password,-email"])
    res.json({ success: true, doctors })


  } catch (error) {

    console.log(error)
    res.json({ success: false, message: error.message })

  }

}


export const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;

    // console.log("Login request:", req.body);

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const doctor = await doctorModel.findOne({ email: email.toLowerCase() });

    if (!doctor) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const secret = process.env.SECRET;
    const token = jwt.sign({ id: doctor._id }, secret, { expiresIn: "1d" });

    res.json({ success: true, token });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const appointmentsDoctor = async (req, res) => {
  try {
    const docId = req.userId;
    console.log("Doctor ID:", docId); // 👈

    const appointments = await appointmentModel.find({ docId, cancelled: false });
    console.log("Appointments found:", appointments.length); // 👈

    res.json({ success: true, appointments });
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}


// Doctor Chat Methods

export const doctorGetChatPartners = async (req, res) => {
  try {
    const rooms = await chatRoom(req.userId);
    res.json(rooms);
  } catch (error) {
    console.error("Error fetching doctor chat partners:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const doctorGetMessages = async (req, res) => {
  try {
    const { userId } = req.params; // The user the doctor is chatting with
    const doctorId = req.userId;

    // Frontend expects just the list of messages
    const messages = await fetchchatMessages({
      currentUserId: doctorId,
      senderId: userId, // Logic in service handles who is sender/receiver based on message flow, this effectively gets history between them
      receiverId: doctorId,
      // Note: fetchchatMessages logic uses senderId/receiverId to find relation. 
      // If I am doctor (currentUserId), and I want chat with user (userId).
      // The service expects sender/receiver arguments to identify the pair.
    });

    res.json(messages);
  } catch (error) {
    console.error("Error fetching doctor messages:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const doctorSendMessage = async (req, res) => {
  try {
    const { userId } = req.params; // Receiver (User)
    const doctorId = req.userId;   // Sender (Doctor)
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: "Message content required" });
    }

    const roomId = getRoomId(doctorId, userId);

    const messageData = {
      roomId,
      messageId: Date.now().toString(), // Simple ID generation
      sender: doctorId,
      receiver: userId,
      message,
      status: 'sent'
    };

    const newMessage = await createMessage(messageData);
    res.json(newMessage);

  } catch (error) {
    console.error("Error sending doctor message:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

