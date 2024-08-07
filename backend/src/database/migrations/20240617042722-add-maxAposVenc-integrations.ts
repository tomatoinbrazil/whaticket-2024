import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Integrations", "maxAposVenc", {
      type: DataTypes.INTEGER,
      defaultValue: null,
      allowNull: true,
  });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Integrations", "maxAposVenc");
  }
};
