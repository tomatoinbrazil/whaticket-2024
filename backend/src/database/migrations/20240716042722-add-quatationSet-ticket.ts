import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
    up: (queryInterface: QueryInterface) => {
        return queryInterface.addColumn("Tickets", "quotationSet", {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        });
    },

    down: (queryInterface: QueryInterface) => {
        return queryInterface.removeColumn("Tickets", "quotationSet");
    }
};
