import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
    up: (queryInterface: QueryInterface) => {
        return queryInterface.addColumn("Integrations", "incAposVenc", {
            type: DataTypes.INTEGER,
            defaultValue: null,
            allowNull: true,
        });
    },

    down: (queryInterface: QueryInterface) => {
        return queryInterface.removeColumn("Integrations", "incAposVenc");
    }
};
