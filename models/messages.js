const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config.js");
const User = require('./users.js')
const Message = sequelize.define(
  "Message",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users", // Name of the table in the database
        key: "user_id",
      },
    },
    recipient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "user_id",
      },
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  },
  {
    tableName: "messages", // Explicitly defining the table name
    timestamps: false, // Disabling automatic creation of `createdAt` and `updatedAt` fields
  }
);
// Message.belongsTo(User, { foreignKey: "sender_id", as: "sender" });
// Message.belongsTo(User, { foreignKey: "recipient_id", as: "recipient" });


module.exports = Message;
