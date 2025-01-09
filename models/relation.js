const Room = require("./room");
const Meeting = require("./meeting");

Meeting.belongsTo(Room, {
  foreignKey: "room_id",
  as: "room",
});

Room.hasMany(Meeting, {
  foreignKey: "room_id",
  as: "meetings",
});

module.exports = { Room, Meeting };
