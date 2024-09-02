"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "img_url", {
      type: Sequelize.STRING,
      allowNull: true, // Set to false if you want to enforce that every product must have a user
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("users", "img_url");
  },
};
