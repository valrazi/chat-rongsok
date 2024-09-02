const { Sequelize } = require("sequelize");
const sequelize = require("../config.js");
const Transaksi = sequelize.define("transaksi", {
  id_transaksi: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  id_products: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    references: {
      model: "products", // Name of the table in the database
      key: "produk_id",
    },
  },
  id_user: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    references: {
      model: "users", // Name of the table in the database
      key: "user_id",
    },
  },
  createdAt: {
    type: Sequelize.DATE,
  },
  status: {
    type: Sequelize.STRING,
  },
});
// User.hasMany(Product, { as: "Products", foreignKey: "user_id" });

module.exports = Product;
