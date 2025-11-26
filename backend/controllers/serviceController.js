import Service from "../models/service.js";
import { ServiceProvider } from "../models/serviceprovider.js";

export const addService = async (req, res) => {
  try {
    const providerId = req.params.id;
    const { name, description, price } = req.body;

    if (!req.file) return res.status(400).json({ msg: "Image required" });

    const service = await Service.create({
      name,
      description,
      price,
      image: `/uploads/${req.file.filename}`,
      provider: providerId,
    });

    const provider = await ServiceProvider.findById(providerId);
    provider.services.push(service._id);
    await provider.save();

    res.json({ msg: "Service added", service });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const getAllServices = async (req, res) => {
  try {
    const services = await Service.find().populate("provider", "name email");
    res.json({ services });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate("provider");
    res.json({ service });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const searchServices = async (req, res) => {
  try {
    const q = req.query.q || "";
    const services = await Service.find({
      name: { $regex: q, $options: "i" },
    });
    res.json({ services });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
