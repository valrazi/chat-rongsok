const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config.js");

const ProductLiked = sequelize.define('ProductLiked', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users', // Name of the target table
      key: 'user_id',      // Key in the target table
    },
    onDelete: 'CASCADE', // Optional: handle delete behavior
  },
  produk_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products', // Name of the target table
      key: 'produk_id',         // Key in the target table
    },
    onDelete: 'CASCADE', // Optional: handle delete behavior
  },
}, {
  tableName: 'product_liked', // Specify table name if different from model name
  timestamps: false, // If you don't want Sequelize to handle createdAt/updatedAt
});

module.exports = ProductLiked;
