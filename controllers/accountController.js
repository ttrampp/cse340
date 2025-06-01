const utilities = require("../utilities");
const accountModel = require("../models/account-model")

/* ****************************************
*  Deliver login view
* *************************************** */

async function buildLogin(req, res, next) {
    let nav = await utilities.getNav();
    res.render("account/login", {
        title: "Login",
        nav
    });
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
  const { accountFirstname, accountLastname, accountEmail, accountPassword } = req.body

  const regResult = await accountModel.registerAccount(
    accountFirstname,
    accountLastname,
    accountEmail,
    accountPassword
  )

  if (regResult) {
    req.flash(
      "notice",
      `Congratulations, you're registered ${accountFirstname}. Please log in.`
    )
    res.status(201).render("account/login", {
      title: "Login",
      nav,
    })
  } else {
    req.flash("notice", "Sorry, the registration failed.")
    res.status(501).render("account/register", {
      title: "Registration",
      nav,
    })
  }
}

module.exports = {buildLogin, buildRegister, registerAccount};