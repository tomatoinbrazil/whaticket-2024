import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
    up: (queryInterface: QueryInterface) => {
        return queryInterface.addColumn("Users", "userIdPowerCrm", {
            type: DataTypes.STRING,
            allowNull: true,
        });
    },

    down: (queryInterface: QueryInterface) => {
        return queryInterface.removeColumn("Users", "userIdPowerCrm");
    }
};
