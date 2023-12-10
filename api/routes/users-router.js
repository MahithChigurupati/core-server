// defining routes to route request calls to corresponding methods

const userController = require("../controller/user-controller.js")

const router = require("express").Router()

//Route for GET method -- a health check method
router.get("/health", userController.healthCheck)

//Route for POST method -- to save or update device token
router.post("/token", userController.saveOrUpdateToken)

//Route for POST method -- to send push notification
router.post("/notify", userController.sendPushNotify)

// Route to execute proofs
router.post("/proof", userController.executeProofs)

// Route to verify proof
router.post("/verify", userController.verifyProof)

// Route to sendProof
router.post("/sendProof", userController.sendProof)

router.get("/states", userController.getAllStates)
router.get("/organizations/:stateId", userController.getOrganizationsInState)

module.exports = router
