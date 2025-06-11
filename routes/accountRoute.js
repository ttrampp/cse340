const express = require("express");
const router = new express.Router();
const utilities = require("../utilities");
const accountController = require("../controllers/accountController");
const regValidate = require("../utilities/accountValidation")

//router.get("/", utilities.handleErrors(accountController.buildLogin));
router.get("/login", utilities.handleErrors(accountController.buildLogin));
router.get("/register", utilities.handleErrors(accountController.buildRegister));
router.post('/register', regValidate.registrationRules(), regValidate.checkRegData, utilities.handleErrors(accountController.registerAccount))

//Process the login attempt
router.post(
    "/login",
    regValidate.loginRules(),
    regValidate.checkLoginData,
    utilities.handleErrors(accountController.accountLogin)
)

//Default route -- account management view
router.get("/", utilities.checkLogin, utilities.handleErrors(accountController.buildAccountManagement))

// Deliver the account update view
router.get(
  "/update/:accountId",
  utilities.checkLogin,
  utilities.handleErrors(accountController.buildUpdateAccountView)
)

// Process account info update
router.post(
  "/update",
  regValidate.updateAccountRules(),         // will define this next
  regValidate.checkUpdateData,              // will define this next
  utilities.handleErrors(accountController.updateAccountInfo)
)

// Process password change
router.post(
  "/update-password",
  regValidate.passwordRules(),              // reuse strong password check
  regValidate.checkPasswordData,            // will define this next
  utilities.handleErrors(accountController.updateAccountPassword)
)

// Logout route
router.get("/logout", utilities.handleErrors(accountController.logout))

module.exports = router;