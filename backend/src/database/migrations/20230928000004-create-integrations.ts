import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
    up: (queryInterface: QueryInterface) => {
        return queryInterface.createTable("Integrations", {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },
            hora: {
                type: DataTypes.STRING,
            },
            name: {
                type: DataTypes.STRING,
            },			
            token: {
                type: DataTypes.STRING(1000),
            },
            envioAnt: {
                type: DataTypes.INTEGER,
            },
            envioAposVenc: {
                type: DataTypes.INTEGER
            },
            msgAntVenc: {
                type: DataTypes.STRING(5000),
            },
            msgVenc: {
                type: DataTypes.STRING(5000),
            },
            msgAposVenc: {
                type: DataTypes.STRING(5000),
            },
            whatsappId: {
                type: DataTypes.INTEGER,
            },
            companyId: {
                type: DataTypes.INTEGER,
                references: { model: "Companies", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "CASCADE"
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false
              },
              updatedAt: {
                type: DataTypes.DATE,
                allowNull: false
              }
        });
    },

    down: (queryInterface: QueryInterface) => {
        return queryInterface.dropTable("Integrations");
    }
};
