const { Sequelize } = require("sequelize");
const sequelize = require("../config.js");
const User = require("./users.js");
const ProductLiked = require("./product_liked.js");
const Product = sequelize.define("products", {
  produk_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nama_produk: {
    type: Sequelize.STRING,
  },
  harga_produk: {
    type: Sequelize.FLOAT,
  },
  deskripsi_produk: {
    type: Sequelize.STRING,
  },
  kategori_produk: {
    type: Sequelize.STRING,
  },
  url_foto: {
    type: Sequelize.STRING,
  },
  createdAt: {
    type: Sequelize.DATE,
  },
  updatedAt: {
    type: Sequelize.DATE,
  },
  is_available: {
    type: Sequelize.BOOLEAN,
  },
  user_id: {
    type:Sequelize.INTEGER
  }
});
// User.hasMany(Product, { as: "Products", foreignKey: "user_id" });
Product.hasMany(ProductLiked, { foreignKey: 'produk_id' });
ProductLiked.belongsTo(Product, { foreignKey: 'produk_id' });
module.exports = Product;
