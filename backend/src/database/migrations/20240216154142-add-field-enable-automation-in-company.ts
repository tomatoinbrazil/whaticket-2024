import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Companies", "enableAutomation", {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: true,
  });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Companies", "enableAutomation");
  }
};
