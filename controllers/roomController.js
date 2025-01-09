const Room = require("../models/room");

exports.getAllRoom = async (req, res) => {
  try {
    const rooms = await Room.findAll();
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Error fetching rooms", error });
  }
};

exports.createRoom = async (req, res) => {
  const { name, capacity, location_type } = req.body;
  try {
    const roomRequest = {
      name,
      capacity,
      location_type,
    };

    const newRoom = await Room.create(roomRequest);

    res.status(201).json(newRoom);
  } catch (error) {
    res.status(400).json({ message: "Error creating audience", error });
  }
};
