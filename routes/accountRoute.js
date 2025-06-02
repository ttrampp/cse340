const express = require("express");
const router = new express.Router();
const utilities = require("../utilities");
const accountController = require("../controllers/accountController");
const regValidate = require("../utilities/accountValidation")

router.get("/", utilities.handleErrors(accountController.buildLogin));
router.get("/login", utilities.handleErrors(accountController.buildLogin));
router.get("/register", utilities.handleErrors(accountController.buildRegister));
router.post('/register', regValidate.registrationRules(), regValidate.checkRegData, utilities.handleErrors(accountController.registerAccount))

//Process the login attempt
router.post(
    "/login",
    regValidate.loginRules(),
    regValidate.checkLoginData,
    (req, res) => {
        res.status(200).send('login process')
    }
)

module.exports = router;