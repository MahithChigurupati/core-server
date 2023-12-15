const bcrypt = require("bcrypt")
const moment = require("moment")
const logger = require("../../logger")

const sequelize = require("../model/index")

const ethers = require("ethers")
const addresses = require("../../constants/contractAddresses.json")
const addr = require("../../constants/addresses.json")
const contractABI = require("../../constants/abi.json")

const zkScript = require("../../../ZK-Snarks/script")

// importing db models
const db = require("../model")
const Device = db.devices
const State = db.states
const Organization = db.organizations
const Request = db.requests

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

        if (!created) {
            await deviceRecord.update({
                token: token,
                token_updated: moment().format("YYYY-MM-DDTHH:mm:ss"),
            })
        }

        console.log(`${token} - Token created successfully.`)

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
    var serverKey = process.env.SERVER_KEY
    var fcm = new FCM(serverKey)

    const { from, txId, address, notification, txType } = req.body

    if (!address || !notification) {
        return res.status(400).send("Bad request, address and notification message are required.")
    }

    try {
        const deviceRecord = await Device.findOne({
            where: { wallet_address: address },
        })

        if (!deviceRecord) {
            return res.status(404).send("Device not found for the provided address.")
        }

        const existingRequest = await Request.findOne({ where: { txId: txId } })

        if (existingRequest) {
            return res.status(200).send("Notification already sent.")
        }

        await Request.create({
            from: from,
            txId: txId,
            address: address,
            notification: notification,
            tx_type: txType,
        })

        var message = {
            to: deviceRecord.token,
            notification: {
                title: from,
                body: notification,
            },
            data: {
                title: "Notification",
                body: `{"from" : "${from}", "txId": "${txId}", "message" : "${notification}", "txType": "${txType}" }`,
            },
        }

        fcm.send(message, function (err, response) {
            if (err) {
                console.error("Something has gone wrong! " + err)
                return res.status(500).send("Error in sending notification.")
            } else {
                console.log("Successfully sent with response: ", message)
                res.send("Notification sent successfully.")
            }
        })
    } catch (error) {
        console.error("Error in sendPushNotify: ", error)
        res.status(500).send("Internal server error.")
    }
}

const executeProofs = async (req, res) => {
    const { id, address, dob, ageThreshold, id_type } = req.body

    if (!id || !address || !dob || !ageThreshold) {
        return res.status(400).send("Missing required fields.")
    }

    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL)

    let contractAddress = null

    if (id_type === "DL") {
        contractAddress = addresses["11155111"][0]
    } else {
        contractAddress = addr["11155111"][0]
    }

    const contract = new ethers.Contract(contractAddress, contractABI, provider)

    try {
        const idData = await contract.getID(address)

        const currentTimestamp = Date.now()

        const ageThresholdTimestamp = ageThreshold * 365 * 24 * 60 * 60 * 1000

        console.log("executing proof with ->")
        console.log(address, dob, currentTimestamp, ageThresholdTimestamp)

        const { proof, publicSignals } = await zkScript.createAgeProof(
            address,
            dob,
            currentTimestamp,
            ageThresholdTimestamp
        )

        const responseObject = {
            UID: idData.UID,
            proof: proof,
            publicSignals: publicSignals,
            txType: ageThreshold.toString(),
        }

        res.status(200).send(responseObject)
    } catch (error) {
        console.error("Error interacting with the contract:", error)
        res.status(500).send("Failed to retrieve data from the smart contract.")
    }
}

const sendProof = async (req, res) => {
    const { pi_a, pi_b, pi_c, protocolType, curve, publicSignals } = req.body

    console.log(publicSignals)

    if (!pi_a || !pi_b || !pi_c || !curve || !protocolType || !publicSignals) {
        console.log("Missing required fields.")
        return res.status(400).send("Missing required fields.")
    }

    const proof = {
        pi_a: pi_a,
        pi_b: pi_b,
        pi_c: pi_c,
        protocol: protocolType,
        curve: curve,
    }

    console.log(proof)
    console.log(publicSignals)

    try {
        const result = await zkScript.verifyAgeProof(proof, publicSignals)
        console.log(result)
        res.status(200).send(result)
    } catch (error) {
        console.error("Error interacting with the contract:", error)
        res.status(500).send("Failed to retrieve data from the smart contract.")
    }
}

const verifyProof = async (req, res) => {
    const { proof, publicSignals } = req.body

    if (!proof || !publicSignals) {
        return res.status(400).send("Missing required fields.")
    }

    try {
        const result = await zkScript.verifyAgeProof(proof, publicSignals)

        res.status(200).send(result)
    } catch (error) {
        console.error("Error interacting with the contract:", error)
        res.status(500).send("Failed to retrieve data from the smart contract.")
    }
}

const getAllStates = async (req, res) => {
    try {
        const states = await State.findAll()
        console.log(states)
        res.json(states)
    } catch (error) {
        logger.error("Error in getAllStates: ", error)
        res.status(500).send("Internal server error.")
    }
}

const getOrganizationsInState = async (req, res) => {
    const { stateId } = req.params

    if (!stateId) {
        return res.status(400).send("Bad request, missing state identifier.")
    }

    try {
        const organizations = await Organization.findAll({
            where: { stateId: stateId },
        })
        console.log(organizations)
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
    verifyProof,
    sendProof,
}
