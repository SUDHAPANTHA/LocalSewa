import bcrypt from "bcryptjs";
import User from "../models/user.js";
import Admin from "../models/admin.js";
import { ServiceProvider } from "../models/serviceprovider.js";
import { findAreaByIdentifier } from "../constants/kathmanduAreas.js";

export const register = async (model, roleName, req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    const exists = await model.findOne({ email });
    if (exists) return res.status(400).json({ msg: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const payload = {
      name,
      email,
      password: hashed,
      phone,
      address,
      role: roleName,
      isApproved: roleName === "admin" ? true : false,
    };

    if (roleName === "service_provider") {
      payload.isApproved = false;
      const areaInput =
        req.body.localAreaSlug ||
        req.body.localArea ||
        req.body.areaSlug ||
        req.body.locality;
      const areaMeta = findAreaByIdentifier(areaInput);
      if (!areaMeta) {
        return res
          .status(400)
          .json({ msg: "Select a valid Kathmandu local area" });
      }
      payload.primaryAreaSlug = areaMeta.slug;
      payload.primaryAreaName = areaMeta.name;
      payload.areaFocus = [areaMeta.slug];
      payload.address = address || areaMeta.name;
      payload.location = {
        type: "Point",
        coordinates: [areaMeta.coordinates.lng, areaMeta.coordinates.lat],
        formattedAddress: areaMeta.name,
        city: areaMeta.district,
        locality: areaMeta.name,
        country: "Nepal",
      };
    }

    const doc = new model(payload);

    await doc.save();
    res.json({ msg: "Registered", user: doc });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const login = async (model, req, res) => {
  try {
    const { email, password } = req.body;

    const user = await model.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ msg: "Invalid credentials" });

    res.json({ msg: "Login success", user });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
