import mongoose from "mongoose";

const DoctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, required: true },
    speciality: { type: String, required: true },
    degree: { type: String, required: true },
    experience: { type: String, required: true },
    available: { type: Boolean, default: true },
    fee: { type: Number, required: true },
    about: { type: String, required: true },
    date: { type: String, required: true },
    address: { type: Object, required: true },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    slots_booked: {
      type: Map,
      of: [String],
      default: {}
    },
  },
  {
    timestamps: true,
    minimize: false, // allows empty objects to be saved
  }
);

const doctorModel = mongoose.models.doctor || mongoose.model("doctor", DoctorSchema);
export default doctorModel;
