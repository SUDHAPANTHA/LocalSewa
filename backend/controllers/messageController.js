import Message from "../models/message.js";

export const sendMessage = async (req, res) => {
  try {
    const msg = await Message.create(req.body);
    res.json({ msg: "Sent", message: msg });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const getConversation = async (req, res) => {
  try {
    const conv = await Message.find({
      $or: [
        { sender: req.params.userId, receiver: req.params.otherId },
        { sender: req.params.otherId, receiver: req.params.userId },
      ],
    }).sort("createdAt");

    res.json({ conversation: conv });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
