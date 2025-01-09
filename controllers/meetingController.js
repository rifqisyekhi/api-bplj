const { Sequelize } = require("sequelize");
const { Meeting, Room } = require("../models/relation");

const isTimeAvailable = async (tanggal, start_time, end_time) => {
  try {
    // Ambil semua data meeting
    const meetings = await Meeting.findAll();

    if (meetings.length > 0) {
      // Filter meeting berdasarkan tanggal
      const meetingsOnDate = meetings.filter(
        (meeting) => meeting.tanggal === tanggal
      );

      // Cek waktu yang dimasukin bentrok ga
      for (const meeting of meetingsOnDate) {
        const existingStart = new Date(
          `${meeting.tanggal}T${meeting.start_time}`
        );
        const existingEnd = new Date(`${meeting.tanggal}T${meeting.end_time}`);
        const newStart = new Date(`${tanggal}T${start_time}`);
        const newEnd = new Date(`${tanggal}T${end_time}`);

        if (
          (newStart >= existingStart && newStart < existingEnd) || // Mulai di tengah waktu meeting lain
          (newEnd > existingStart && newEnd <= existingEnd) || // Berakhir di tengah waktu meeting lain
          (newStart <= existingStart && newEnd >= existingEnd) // Menutupi waktu meeting lain
        ) {
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    console.error(error.message);
    return false;
  }
};

exports.createMeeting = async (req, res) => {
  const {
    judul,
    tanggal,
    tempat,
    audiens,
    start_time,
    end_time,
    keterangan,
    room_id,
  } = req.body;
  if (!room_id) {
    return res.status(400).json({ message: "room_id is required" });
  }
  try {
    if (await isTimeAvailable(tanggal, start_time, end_time)) {
      const newMeeting = await Meeting.create({
        judul,
        tanggal,
        tempat,
        audiens,
        start_time,
        end_time,
        keterangan,
        room_id,
      });

      res.status(201).json(newMeeting);
    } else {
      res.status(400).json({ message: "Time already on used" });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Error creating meeting", error });
  }
};

exports.getAllMeeting = async (req, res) => {
  try {
    const meetings = await Meeting.findAll({
      include: [
        {
          model: Room,
          as: "room", // Sesuai alias di definisi relasi
          attributes: ["id", "name", "capacity"], // Sesuaikan atribut Room yang ingin ditampilkan
        },
      ],
    });
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching meetings", error });
  }
};

exports.getAllTodayMeeting = async (req, res) => {
  try {
    const today = new Date();
    const offset = 7 * 60 * 60 * 1000;
    const gmt7Today = new Date(today.getTime() + offset);
    gmt7Today.setUTCHours(0, 0, 0, 0);

    const meetings = await Meeting.findAll({
      where: {
        tanggal: {
          [Sequelize.Op.gte]: gmt7Today,
        },
      },
      order: [
        ["tanggal", "ASC"],
        ["start_time", "ASC"],
      ],
      include: [
        {
          model: Room,
          as: "room",
          attributes: ["id", "name", "capacity"],
        },
      ],
    });

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching meetings", error });
  }
};

exports.getAllLobbyMeeting = async (req, res) => {
  try {
    const today = new Date();
    const offset = 7 * 60 * 60 * 1000; // GMT+7 offset
    const gmt7Today = new Date(today.getTime() + offset);
    gmt7Today.setUTCHours(0, 0, 0, 0);

    const hours = gmt7Today.getHours().toString().padStart(2, "0");
    const minutes = gmt7Today.getMinutes().toString().padStart(2, "0");
    const currentTime = `${hours}:${minutes}`;

    const meetings = await Meeting.findAll({
      where: {
        tanggal: {
          [Sequelize.Op.gte]: gmt7Today,
        },
        end_time: {
          [Sequelize.Op.gt]: currentTime,
        },
      },
      order: [
        ["tanggal", "ASC"],
        ["start_time", "ASC"],
      ],
      limit: 4,
      include: [
        {
          model: Room,
          as: "room",
          attributes: ["id", "name", "capacity"],
        },
      ],
    });

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching meetings", error });
  }
};

exports.getRunningText = async (req, res) => {
  try {
    const today = new Date();
    const offset = 7 * 60 * 60 * 1000; // GMT+7 offset
    const gmt7Today = new Date(today.getTime() + offset);
    gmt7Today.setUTCHours(0, 0, 0, 0);

    const hours = gmt7Today.getHours().toString().padStart(2, "0");
    const minutes = gmt7Today.getMinutes().toString().padStart(2, "0");
    const currentTime = `${hours}:${minutes}`;

    let meetings = await Meeting.findAll({
      where: {
        tanggal: {
          [Sequelize.Op.gte]: gmt7Today,
        },
        end_time: {
          [Sequelize.Op.gt]: currentTime,
        },
      },
      order: [
        ["tanggal", "ASC"],
        ["start_time", "ASC"],
      ],
      limit: 4,
    });

    if (meetings.length === 0) {
      meetings = await Meeting.findAll({
        where: {
          tanggal: {
            [Sequelize.Op.gte]: gmt7Today,
          },
        },
        order: [
          ["tanggal", "ASC"],
          ["start_time", "ASC"],
        ],
        limit: 1,
      });
    }

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching meetings", error });
  }
};

exports.getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findByPk(req.params.id, {
      include: [
        {
          model: Room,
          as: "room",
          attributes: ["id", "name", "capacity"],
        },
      ],
    });
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });
    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: "Error fetching meeting", error });
  }
};

exports.updateMeeting = async (req, res) => {
  try {
    if (await isTimeAvailable(tanggal, start_time, end_time)) {
      const updatedMeeting = await Meeting.update(req.body, {
        where: { id: req.params.id },
        returning: true,
        plain: true,
      });
      if (!updatedMeeting[0])
        return res.status(404).json({ message: "Meeting not found" });

      res.status(201).json(updatedMeeting[1]);
    } else {
      res.status(400).json({ message: "Time already on used" });
    }
  } catch (error) {
    res.status(400).json({ message: "Error updating meeting", error });
  }
};

exports.deleteMeeting = async (req, res) => {
  try {
    const deletedMeeting = await Meeting.destroy({
      where: { id: req.params.id },
    });
    if (!deletedMeeting)
      return res.status(404).json({ message: "Meeting not found" });
    res.json({ message: "Meeting deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting meeting", error });
  }
};
