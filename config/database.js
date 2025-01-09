const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("mysql://root:@localhost:3306/bplj", {
  dialect: "mysql",
  logging: console.log,
});

async function syncDatabase() {
  try {
    await sequelize.sync({ force: false });
    console.log("Database connected");
  } catch (error) {
    console.error("Error syncing database:", error);
  }
}

module.exports = { sequelize, syncDatabase };
