module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nameawal: {
        type: Sequelize.STRING,
      },
      namaakhir: {
        type: Sequelize.STRING,
      },
      email: {
        type: Sequelize.STRING,
        unique: true,
      },
      alamat: {
        type: Sequelize.STRING,
      },
      pertanyaankeamanan: {
        type: Sequelize.STRING,
      },
      jawabankeamanan: {
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
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("users");
  },
};
