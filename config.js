const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("fahrazi12_barangrongsok", "fahrazi12_lingga", "_B27i2ks5", {
  host: "tommy2.heliohost.org",
  dialect: "mysql",
});

module.exports = sequelize;