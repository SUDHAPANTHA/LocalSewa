import { ServiceProvider } from "../models/serviceprovider.js";

export const getProviders = async (req, res) => {
  const providers = await ServiceProvider.find().select("-password");
  res.json({ providers });
};

export const approveProvider = async (req, res) => {
  try {
    const doc = await ServiceProvider.findByIdAndUpdate(
      req.params.id,
      { isApproved: req.body.isApproved },
      { new: true }
    );
    res.json({ msg: "Status updated", provider: doc });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
