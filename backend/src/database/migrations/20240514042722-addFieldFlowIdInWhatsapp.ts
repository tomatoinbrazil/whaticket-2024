import { QueryInterface, DataTypes } from "sequelize";
interface ExistingColumns {
  };

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const table = "Whatsapps";
    const column = "flowId";

    const tableInfo: ExistingColumns = await queryInterface.describeTable(table);
    if (tableInfo[column]) {
      return Promise.resolve();
    }

    return queryInterface.addColumn(table, column, {
      type: DataTypes.INTEGER,
      references: { model: "FlowBuilders", key: "id" },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT"
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Whatsapps", "flowId");
  }
};
