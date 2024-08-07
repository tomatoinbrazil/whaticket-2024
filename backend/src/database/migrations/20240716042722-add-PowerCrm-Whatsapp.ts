import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
    up: (queryInterface: QueryInterface) => {
        return queryInterface.addColumn("Whatsapps", "enablePowerCrm", {
            type: DataTypes.BOOLEAN,
            allowNull: true
        });
    },

    down: (queryInterface: QueryInterface) => {
        return queryInterface.removeColumn("Whatsapps", "enablePowerCrm");
    }
};
