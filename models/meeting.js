const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const meetingSchema = sequelize.define(
  "Meeting",
  {
    judul: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tanggal: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    tempat: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    audiens: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    keterangan: {
      type: DataTypes.STRING,
    },
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "rooms",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
  },
  { tableName: "meetings", timestamps: false }
);

module.exports = meetingSchema;
