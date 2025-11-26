import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, refPath: "senderModel" },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "receiverModel",
    },
    senderModel: String,
    receiverModel: String,
    content: String,
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
