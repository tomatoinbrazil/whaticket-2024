import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Integrations", "nameToken", {
      type: DataTypes.TEXT,
      defaultValue: null,
      allowNull: true,
  });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Integrations", "nameToken");
  }
};
