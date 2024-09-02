"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("products", "user_id", {
      type: Sequelize.INTEGER,
      allowNull: true, // Set to false if you want to enforce that every product must have a user
    });
    await queryInterface.addConstraint("products", {
      fields: ["user_id"],
      type: "foreign key",
      name: "fk_products_user_id", // Name your constraint
      references: {
        table: "users",
        field: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL", // You can set this to 'CASCADE' or 'RESTRICT' depending on your needs
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint("products", "fk_products_user_id");
    await queryInterface.removeColumn("products", "user_id");
  },
};
