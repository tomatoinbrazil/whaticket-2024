import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Integrations", "envDiaVenc", {
      type: DataTypes.BOOLEAN,
      defaultValue: null,
      allowNull: true,
  });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Integrations", "envDiaVenc");
  }
};
