const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const audienceSchema = sequelize.define(
  "Audiens",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: "audiens",
    timestamps: false,
  }
);

module.exports = audienceSchema;
