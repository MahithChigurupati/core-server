module.exports = (sequelize, DataTypes) => {
    const Requests = sequelize.define(
        "requests",
        {
            from: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            txId: {
                primaryKey: true,
                type: DataTypes.STRING,
                allowNull: false,
            },
            address: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            notification: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            tx_type: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            timestamps: false,
        }
    )
    return Requests
}
