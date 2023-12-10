module.exports = (sequelize, DataTypes) => {
    const Organization = sequelize.define(
        "organization",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            code: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            stateId: {
                type: DataTypes.INTEGER,
                references: {
                    model: "states",
                    key: "id",
                },
                allowNull: false,
            },
        },
        {
            timestamps: false,
        }
    )
    return Organization
}
