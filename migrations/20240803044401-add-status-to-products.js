"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("products", "is_available", {
      type: Sequelize.BOOLEAN,
      defaultValue: true, // Set to false if you want to enforce that every product must have a user
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("products", "is_available");
  },
};
