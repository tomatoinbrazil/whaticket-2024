import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
    up: (queryInterface: QueryInterface) => {
        return queryInterface.addColumn("Tickets", "quotationCode", {
            type: DataTypes.STRING,
            allowNull: true,
        });
    },

    down: (queryInterface: QueryInterface) => {
        return queryInterface.removeColumn("Tickets", "quotationCode");
    }
};
