const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const layananSchema = sequelize.define(
  "Layanan",
  {
    nama_layanan: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    image_layanan: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    deskripsi: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    standar_acuan: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    biaya_tarif: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    produk: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "layanans",
    timestamps: false,
  }
);

module.exports = layananSchema;
