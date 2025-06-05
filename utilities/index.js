const invModel = require("../models/inventory-model")

const {body, validationResult} = require("express-validator")

const jwt = require("jsonwebtoken")
require("dotenv").config

/* ************************
 * Constructs the nav HTML unordered list
 ************************** */
async function getNav(req, res, next) {
  let data = await invModel.getClassifications()
  //console.log(data)
  let list = "<ul>"
  list += '<li><a href="/" title="Home page">Home</a></li>'
  data.rows.forEach((row) => {
    list += "<li>"
    list +=
      '<a href="/inv/type/' +
      row.classification_id +
      '" title="See our inventory of ' +
      row.classification_name +
      ' vehicles">' +
      row.classification_name +
      "</a>"
    list += "</li>"
  })
  list += "</ul>"
  return list
}

/* **************************************
* Build the classification view HTML
* ************************************ */
async function buildClassificationOptions(data) {
  let grid
  if(data.length > 0){
    grid = '<ul id="inv-display">'
    data.forEach(vehicle => { 
      grid += '<li>'
      grid +=  '<a href="../../inv/detail/'+ vehicle.inv_id 
      + '" title="View ' + vehicle.inv_make + ' '+ vehicle.inv_model 
      + 'details"><img src="' + vehicle.inv_thumbnail 
      +'" alt="Image of '+ vehicle.inv_make + ' ' + vehicle.inv_model 
      +' on CSE Motors" /></a>'
      grid += '<div class="namePrice">'
      grid += '<hr />'
      grid += '<h2>'
      grid += '<a href="../../inv/detail/' + vehicle.inv_id +'" title="View ' 
      + vehicle.inv_make + ' ' + vehicle.inv_model + ' details">' 
      + vehicle.inv_make + ' ' + vehicle.inv_model + '</a>'
      grid += '</h2>'
      grid += '<span>$' 
      + new Intl.NumberFormat('en-US').format(vehicle.inv_price) + '</span>'
      grid += '</div>'
      grid += '</li>'
    })
    grid += '</ul>'
  } else { 
    grid += '<p class="notice">Sorry, no matching vehicles could be found.</p>'
  }
  return grid
}

/**adding back in grid */
async function buildClassificationGrid(data) {
  let grid
  if (data.length > 0) {
    grid = '<ul id="inv-display">'
    data.forEach(vehicle => {
      grid += '<li>'
      grid += '<a href="/inv/detail/' + vehicle.inv_id
      + '" title="View ' + vehicle.inv_make + ' ' + vehicle.inv_model + ' details">'
      + '<img src="' + vehicle.inv_thumbnail + '" alt="Image of ' + vehicle.inv_make + ' ' + vehicle.inv_model + ' on CSE Motors"></a>'
      grid += '<div class="namePrice">'
      grid += '<hr>'
      grid += '<h2><a href="/inv/detail/' + vehicle.inv_id + '" title="View '
      + vehicle.inv_make + ' ' + vehicle.inv_model + ' details">' + vehicle.inv_make + ' ' + vehicle.inv_model + '</a></h2>'
      grid += '<span>$' + new Intl.NumberFormat('en-US').format(vehicle.inv_price) + '</span>'
      grid += '</div>'
      grid += '</li>'
    })
    grid += '</ul>'
  } else {
    grid = '<p class="notice">Sorry, no matching vehicles could be found.</p>'
  }
  return grid
}


/* ***************************
 *  Build the vehicle detail view HTML
 * ************************** */
function buildDetailView(data) {
  let detailView = `
    <div class="detail-wrapper">
      <div class="detail-image">
        <img src="${data.inv_image.replace('/image/', '/images/')}" alt="Image of ${data.inv_make} ${data.inv_model}">

      </div>
      <div class="detail-info">
        <h2>${data.inv_year} ${data.inv_make} ${data.inv_model}</h2>

        <div class="detail-row"><span class="label">Price:</span> $${Number(data.inv_price).toLocaleString()}</div>
        <div class="detail-row"><span class="label">Category:</span> ${data.classification_name}</div>
        <div class="detail-row description-row"><span class="label">Description:</span><span class="value">${data.inv_description}</span></div>
        <div class="detail-row"><span class="label">Color:</span> ${data.inv_color}</div>
        <div class="detail-row"><span class="label">Mileage:</span> ${parseInt(data.inv_miles).toLocaleString()} miles</div>
      </div>
    </div>
  `;
  console.log("Rendered HTML:\n", detailView);

  return detailView;
}

/* *******************************
 * Classification Validation Rules
 * *******************************/
function classificationRules() {
  return [
    body("classification_name")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Classification name is required.")
      .matches(/^[a-zA-Z0-9]+$/)
      .withMessage("Classification name must be letters and numbers only (no spaces or special characters).")
  ]
}

/* *******************************
 * Check classification data and return errors
 * *******************************/
async function checkClassificationData(req, res, next) {
  const {classification_name} = req.body
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const nav = await getNav()
    res.render("inventory/add-classification", {
      title: "Add Classification",
      nav,
      errors: errors.array(),
      message: null,
      classification_name
    })
    return
  }
  next()
}

/* *******************************
 * Check classification data and return errors
 * *******************************/
function inventoryRules() {
  return [
    body("classification_id")
      .isInt({min: 1})
      .withMessage("Please choose a valid classification. Thank you."),
     body("inv_make")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Make is required."),
    body("inv_model")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Model is required."),
    body("inv_year")
      .isInt({ min: 1900, max: 2099 })
      .withMessage("Enter a valid 4-digit year."),
    body("inv_description")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Description is required."),
    body("inv_image")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Image path is required."),
    body("inv_thumbnail")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Thumbnail path is required."),
    body("inv_price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number."),
    body("inv_miles")
      .isInt({ min: 0 })
      .withMessage("Miles must be a positive integer."),
    body("inv_color")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Color is required.")
  ]
}

/*handle errors and return sticky data*/

async function checkInventoryData(req, res, next) {
  const {
    classification_id, inv_make, inv_model, inv_year, inv_miles,
    inv_description, inv_color, inv_image, inv_thumbnail, inv_price
  } = req.body

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const nav = await getNav()

    const classificationList = await buildClassificationOptions(classification_id)



    res.render("inventory/add-inventory", {
      title: "Add Inventory",
      nav,
      classificationList,
      errors: errors.array(),
      message: null,
      classification_id, inv_make, inv_model, inv_year,
      inv_description, inv_image, inv_thumbnail, inv_price,
      inv_miles, inv_color
    })
    return
  }
  next()
}

/**
 * Builds the <option> tags for the classification dropdown
 */
async function buildClassificationOptions(selectedId) {
  const data = await invModel.getClassifications()
  let options = '<option value="">Choose a Classification</option>'
  data.rows.forEach(row => {
    options += `<option value="${row.classification_id}"${row.classification_id == selectedId ? ' selected' : ''}>${row.classification_name}</option>`
  })
  return options
}

/* ****************************************
 * Middleware For Handling Errors
 * Wrap other function in this for 
 * General Error Handling
 **************************************** */
function handleErrors(fn) {
  return (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next)
}

const Util = {
  getNav,
  buildClassificationOptions,
  buildClassificationGrid,
  buildDetailView,
  classificationRules,
  checkClassificationData,
  inventoryRules,
  checkInventoryData,
  handleErrors
}

/* ****************************************
* Middleware to check token validity
**************************************** */
Util.checkJWTToken = (req, res, next) => {
 if (req.cookies.jwt) {
  jwt.verify(
   req.cookies.jwt,
   process.env.ACCESS_TOKEN_SECRET,
   function (err, accountData) {
    if (err) {
     req.flash("notice", "Please log in")
     res.clearCookie("jwt")
     return res.redirect("/account/login")
    }
    res.locals.accountData = accountData
    res.locals.loggedin = 1
    next()
   })
 } else {
  next()
 }
}

/* ****************************************
 *  Check Login
 * ************************************ */
 Util.checkLogin = (req, res, next) => {
  if (res.locals.loggedin) {
    next()
  } else {
    req.flash("notice", "Please log in.")
    return res.redirect("/account/login")
  }
 }

module.exports = Util

