// importing external libraries
// bcrypt for hashing the password
// moment for creating timestamps
// logger for logging
const bcrypt = require("bcrypt")
const moment = require("moment")
const logger = require("../../logger")

const sequelize = require("../model/index")

// importing db models
const db = require("../model")
const Device = db.devices
const State = db.states
const Organization = db.organizations

// A health check method to check db connection status
const healthCheck = async (req, res) => {
    logger.info("hitting status check")

    sequelize.sequelize.authenticate().then(() => {
        res.send("Connection established successfully.")
    })
}

const saveOrUpdateToken = async (req, res) => {
    const { emailAddress, token, walletAddress } = req.body

    if (!emailAddress || !token || !walletAddress) {
        return res.status(400).send("Bad request, missing required fields.")
    }

    try {
        // Find the device record by email, or create a new one
        let [deviceRecord, created] = await Device.findOrCreate({
            where: { email: emailAddress },
            defaults: {
                token: token,
                wallet_address: walletAddress,
                email: emailAddress,
                token_created: moment().format("YYYY-MM-DDTHH:mm:ss"),
                token_updated: moment().format("YYYY-MM-DDTHH:mm:ss"),
            },
        })

        // If the record already exists, update the token
        if (!created) {
            await deviceRecord.update({
                token: token,
                token_updated: moment().format("YYYY-MM-DDTHH:mm:ss"),
            })
        }

        res.status(201).send(
            created ? "Token created successfully." : "Token updated successfully."
        )
    } catch (error) {
        logger.error("Error in saveOrUpdateToken: ", error)
        res.status(500).send("Internal server error.")
    }
}

const sendPushNotify = async (req, res) => {
    var FCM = require("fcm-node")
    var serverKey = `${process.env.SERVER_KEY}`
    var fcm = new FCM(serverKey)

    const { emailAddress, notification } = req.body // Get email address from request

    if (!emailAddress || !notification) {
        return res
            .status(400)
            .send("Bad request, email address and notification message are required.")
    }

    try {
        // Retrieve device token from database
        const deviceRecord = await Device.findOne({
            where: { email: emailAddress },
        })

        if (!deviceRecord) {
            return res.status(404).send("Device not found for the provided email address.")
        }

        var message = {
            to: deviceRecord.token, // Use the retrieved token
            notification: {
                title: "ZK Wallet",
                body: notification,
            },
            // Optionally, add data payload
            // data: {
            //     //you can send only notification or only data(or include both)
            //     title: "ok cdfsdsdfsd",
            //     body: '{"name" : "okg ooggle ogrlrl","product_id" : "123","final_price" : "0.00035"}',
            // },
        }

        fcm.send(message, function (err, response) {
            if (err) {
                console.log("Something has gone wrong!" + err)
                return res.status(500).send("Error in sending notification.")
            } else {
                console.log("Successfully sent with response: ", response)
                res.send("Notification sent successfully.")
            }
        })
    } catch (error) {
        console.error("Error in sendPushNotify: ", error)
        res.status(500).send("Internal server error.")
    }
}

const executeProofs = async (req, res) => {}

const getAllStates = async (req, res) => {
    try {
        const states = await State.findAll()
        res.json(states)
    } catch (error) {
        logger.error("Error in getAllStates: ", error)
        res.status(500).send("Internal server error.")
    }
}

const getOrganizationsInState = async (req, res) => {
    const { stateId } = req.params // or req.body, depending on how you're passing the state identifier

    if (!stateId) {
        return res.status(400).send("Bad request, missing state identifier.")
    }

    try {
        const organizations = await Organization.findAll({
            where: { stateId: stateId },
        })
        res.json(organizations)
    } catch (error) {
        logger.error("Error in getOrganizationsInState: ", error)
        res.status(500).send("Internal server error.")
    }
}

module.exports = {
    healthCheck,
    saveOrUpdateToken,
    sendPushNotify,
    getAllStates,
    getOrganizationsInState,
    executeProofs,
}
