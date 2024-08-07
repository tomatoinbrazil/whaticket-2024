import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("FlowBuilders", "title", {
      type: DataTypes.STRING,
      allowNull: false,
  });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("FlowBuilders", "title");
  }
};
