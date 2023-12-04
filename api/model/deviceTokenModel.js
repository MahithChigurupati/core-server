module.exports = (sequelize, DataTypes) => {
    const Device = sequelize.define(
        "device",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            token: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            wallet_address: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            token_created: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            token_updated: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            timestamps: false,
        }
    )
    return Device
}
