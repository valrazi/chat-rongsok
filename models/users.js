const { Sequelize } = require("sequelize");
const sequelize = require("../config.js");
const ProductLiked = require("./product_liked.js");
const Message = require("./messages.js"); // Import Message model

const User = sequelize.define("users", {
  user_id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name_awal: {
    type: Sequelize.STRING,
  },
  nama_akhir: {
    type: Sequelize.STRING,
  },
  email: {
    type: Sequelize.STRING,
    unique: true,
  },
  alamat: {
    type: Sequelize.STRING,
  },
  pertanyaan_keamanan: {
    type: Sequelize.STRING,
  },
  jawaban_keamanan: {
    type: Sequelize.STRING,
  },
  katasandi: {
    type: Sequelize.STRING,
  },
  createdAt: {
    type: Sequelize.DATE,
  },
  updatedAt: {
    type: Sequelize.DATE,
  },
  socket_id: {
    type: Sequelize.STRING,
  },
  is_online: {
    type: Sequelize.BOOLEAN
  }
});
User.hasMany(ProductLiked, { foreignKey: 'user_id' });
ProductLiked.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Message, { foreignKey: "sender_id", as: "sentMessages" });
User.hasMany(Message, { foreignKey: "recipient_id", as: "receivedMessages" });

module.exports = User;
