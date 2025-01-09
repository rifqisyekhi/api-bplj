const Layanan = require("../models/layanan");
const fs = require("fs");

exports.createLayanan = async (req, res) => {
  try {
    const { nama_layanan, deskripsi, standar_acuan, biaya_tarif, produk } =
      req.body;

    const newLayanan = await Layanan.create({
      nama_layanan,
      image_layanan: req.file.path,
      deskripsi,
      standar_acuan,
      biaya_tarif,
      produk,
    });

    res.status(201).json(newLayanan);
  } catch (error) {
    console.log("Error creating layanan:", error);
    res.status(500).json({ message: "Error creating layanan", error });
  }
};

exports.getAllLayanan = async (req, res) => {
  try {
    const layanan = await Layanan.findAll();
    res.status(200).json(layanan);
  } catch (error) {
    console.error("Error fetching layanan:", error);
    res.status(500).json({ message: "Error fetching layanan", error });
  }
};

exports.getLayananById = async (req, res) => {
  try {
    const { id } = req.params;
    const layananDetail = await Layanan.findByPk(id);

    if (!layananDetail) {
      return res.status(404).json({ message: "Layanan not found" });
    }

    res.status(200).json(layananDetail);
  } catch (error) {
    console.error("Error fetching layanan detail:", error);
    res.status(500).json({ message: "Error fetching layanan detail", error });
  }
};

exports.updateLayanan = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_layanan, deskripsi, standar_acuan, biaya_tarif, produk } =
      req.body;

    const updatedData = {
      nama_layanan,
      image_layanan: req.file ? req.file.path : undefined,
      deskripsi,
      standar_acuan,
      biaya_tarif,
      produk,
    };

    const [updatedLayananCount, updatedLayanan] = await Layanan.update(
      updatedData,
      {
        where: { id },
        returning: true,
      }
    );

    if (updatedLayananCount === 0) {
      return res.status(404).json({ message: "Layanan not found" });
    }

    res.status(200).json(updatedLayanan[0]);
  } catch (error) {
    console.error("Error updating layanan:", error);
    res.status(500).json({ message: "Error updating layanan", error });
  }
};

exports.deleteLayanan = async (req, res) => {
  try {
    const { id } = req.params;
    const layanan = await Layanan.findOne({ where: { id } });

    if (!layanan) {
      return res.status(404).json({ message: "Layanan not found" });
    }

    if (layanan.imageLayanan) {
      fs.unlink(layanan.imageLayanan, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
        }
      });
    }

    await Layanan.destroy({ where: { id } });

    res.status(200).json({ message: "Layanan deleted successfully" });
  } catch (error) {
    console.error("Error deleting layanan:", error);
    res.status(500).json({ message: "Error deleting layanan", error });
  }
};
