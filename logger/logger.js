const { createLogger, format, transports } = require("winston")
const { combine, timestamp, printf } = format

const myFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`
})

const productionLogger = () => {
    return createLogger({
        level: "info",
        format: combine(timestamp({ format: "HH:mm:ss" }), myFormat),
        transports: [new transports.File({ filename: "./logs/shortly.log" })],
    })
}

module.exports = productionLogger
