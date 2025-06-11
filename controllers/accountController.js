const utilities = require("../utilities");
const accountModel = require("../models/account-model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
require("dotenv").config()

/* ****************************************
*  Deliver login view
* *************************************** */

async function buildLogin(req, res, next) {
    let nav = await utilities.getNav();
    res.render("account/login", {
        title: "Login",
        nav,
        errors: null,
    })
}

/* ****************************************
*  Deliver registration view
* *************************************** */

async function buildRegister(req, res, next) {
    let nav = await utilities.getNav();
    res.render("account/register", {
        title: "Register",
        nav,
        errors: null
    });
}

/* ****************************************
*  Process Registration
* *************************************** */
async function registerAccount(req, res) {
  let nav = await utilities.getNav()
  const { account_firstname, account_lastname, account_email, account_password } = req.body

  // Hash the password before storing
  let hashedPassword
  try {
    // regular password and cost (salt is generated automatically)
    hashedPassword = await bcrypt.hashSync(account_password, 10)
  } catch (error) {
    req.flash("notice", 'Sorry, there was an error processing the registration.')
    res.status(500).render("account/register", {
      title: "Registration",
      nav,
      errors: null,
    })
    return
  }

  const regResult = await accountModel.registerAccount(
    account_firstname,
    account_lastname,
    account_email,
    hashedPassword
  )

  if (regResult) {
    req.flash(
      "notice",
      `Congratulations, you're registered ${account_firstname}. Please log in.`
    )
    res.status(201).render("account/login", {
      title: "Login",
      nav,
      errors: null
    })
  } else {
    req.flash("notice", "Sorry, the registration failed.")
    res.status(501).render("account/register", {
      title: "Registration",
      nav,
      errors: null
    })
  }
}

/* ****************************************
 *  Process login request
 * ************************************ */
async function accountLogin(req, res) {
  let nav = await utilities.getNav()
  const { account_email, account_password } = req.body
  const accountData = await accountModel.getAccountByEmail(account_email)

  console.log("Submitted email:", account_email)
  console.log("Retrieved accountData:", accountData)

  if (!accountData) {
    req.flash("notice", "Please check your credentials and try again.")
    res.status(400).render("account/login", {
      title: "Login",
      nav,
      errors: null,
      account_email,
    })
    return
  }
  try {
    /*if (await bcrypt.compare(account_password, accountData.account_password)) {*/
    const match = await bcrypt.compare(account_password, accountData.account_password)
    console.log("Password match:", match)
    if (match) {
      delete accountData.account_password
      //save to session
      req.session.accountData = accountData
      //create JWT token
      const accessToken = jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      if(process.env.NODE_ENV === 'development') {
        res.cookie("jwt", accessToken, { httpOnly: true, maxAge: 3600 * 1000 })
      } else {
        res.cookie("jwt", accessToken, { httpOnly: true, secure: true, maxAge: 3600 * 1000 })
      }
      return res.redirect("/account/")
    }
    else {
      req.flash("notice", "Please check your credentials and try again.")
      res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
      })
    }
  } catch (error) {
    /*throw new Error('Access Forbidden')*/
    console.error(error)
    req.flash("notice", "Something went wrong during login. Are you sure you know who you are?")
    res.redirect("/account/login")
  }
}

/* ****************************************
 *  Deliver account management view
 * ************************************ */
async function buildAccountManagement(req, res) {
  let nav = await utilities.getNav()
  res.render("account/account-management", {
    title: "Account Management",
    nav, 
    errors: null,
    message: req.flash("notice"),
    accountData: res.locals.accountData
  })
}

/* ****************************************
 *  Deliver account update view
 * ************************************ */
async function buildUpdateAccountView(req, res) {
  const account_id = req.params.accountId
  const account = await accountModel.getAccountById(account_id)
  let nav = await utilities.getNav()

  res.render("account/update-account", {
    title: "Edit Account",
    nav,
    errors: null,
    message: req.flash("notice"),
    account_firstname: account.account_firstname,
    account_lastname: account.account_lastname,
    account_email: account.account_email,
    account_id: account.account_id
  })
}

/* ****************************************
 *  Process account info update
 * ************************************ */
async function updateAccountInfo(req, res) {
  const { account_id, account_firstname, account_lastname, account_email } = req.body
  let nav = await utilities.getNav()

  const updateResult = await accountModel.updateAccount(
    account_id,
    account_firstname,
    account_lastname,
    account_email
  )

  if (updateResult) {
    req.flash("notice", "Account information updated successfully.")
    const accountData = await accountModel.getAccountById(account_id)
    res.render("account/account-management", {
      title: "Account Management",
      nav,
      errors: null,
      message: req.flash("notice"),
      accountData
    })
  } else {
    req.flash("notice", "Update failed. Try again.")
    res.redirect(`/account/update/${account_id}`)
  }
}

/* ****************************************
 *  Process password change
 * ************************************ */
async function updateAccountPassword(req, res) {
  const { account_id, account_password } = req.body
  let nav = await utilities.getNav()

  try {
    const hashedPassword = await bcrypt.hash(account_password, 10)
    const updateResult = await accountModel.updatePassword(account_id, hashedPassword)

    if (updateResult) {
      req.flash("notice", "Password updated successfully.")
    } else {
      req.flash("notice", "Password update failed.")
    }

    const accountData = await accountModel.getAccountById(account_id)
    res.render("account/account-management", {
      title: "Account Management",
      nav,
      errors: null,
      message: req.flash("notice"),
      accountData
    })
  } catch (error) {
    console.error("Password update error:", error)
    req.flash("notice", "Error updating password.")
    res.redirect(`/account/update/${account_id}`)
  }
}

/* ****************************************
 *  Process logout and clear cookie
 * ************************************ */
function logout(req, res) {
  res.clearCookie("jwt")
  req.session.accountData = null
  res.locals.accountData = null
  res.locals.loggedin = 0
  req.flash("notice", "You have successfully logged out.")
  res.redirect("/")
}

module.exports = {
  buildLogin, 
  buildRegister, 
  registerAccount, 
  accountLogin, 
  buildAccountManagement, 
  buildUpdateAccountView, 
  updateAccountInfo, 
  updateAccountPassword, 
  logout
};