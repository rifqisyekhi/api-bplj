const Audience = require("../models/audien");

exports.createAudience = async (req, res) => {
  const { name } = req.body;
  try {
    const newAudience = await Audience.create({ name });

    res.status(201).json(newAudience);
  } catch (error) {
    res.status(400).json({ message: "Error creating audience", error });
  }
};

exports.getAllAudience = async (req, res) => {
  try {
    const audiences = await Audience.findAll();

    res.status(200).json(audiences);
  } catch (error) {
    res.status(500).json({ message: "Error fetching audiences", error });
  }
};
