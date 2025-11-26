import { ServiceProvider } from "../models/serviceprovider.js";

export const getProviderServices = async (req, res) => {
  try {
    const provider = await ServiceProvider.findById(
      req.params.providerId
    ).populate("services");

    res.json({ services: provider.services });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
