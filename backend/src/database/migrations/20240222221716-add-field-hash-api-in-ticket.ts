import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Tickets", "user_api_hash", {
      type: DataTypes.STRING,
      defaultValue: null,
      allowNull: true,
  });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Tickets", "user_api_hash");
  }
};
