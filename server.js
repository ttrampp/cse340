/* ******************************************
 * This server.js file is the primary file of the 
 * application. It is used to control the project.
 *******************************************/
/***********************
 * Require Statements
 ************************/

// Load environment variables
require("dotenv").config();

const express = require("express");
const app = express();

// Middleware and libraries
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

// Utilities and database
const utilities = require("./utilities");
const pool = require("./database");

// Routes
const static = require("./routes/static");
const baseController = require("./controllers/baseController");
const inventoryRoute = require("./routes/inventoryRoute");
const accountRoute = require("./routes/accountRoute");


//static files
app.use(static)

/* ***********************
 * Body Parser Middleware
 *************************/
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

//Cookies and sessions
app.use(cookieParser())
app.use(utilities.checkJWTToken)

/* ***********************
 * Session and Messages Middleware
 *************************/
app.use(
  session({
    store: new (require("connect-pg-simple")(session))({
      createTableIfMissing: true,
      pool,
    }),
    secret: process.env.SESSION_SECRET, 
    resave: true,
    saveUninitialized: true,
    name: "sessionId",
  })
);

app.use(require("connect-flash")());
app.use(function (req, res, next) {
  res.locals.messages = require("express-messages") (req, res);
  next();
});


//Make session account data available in views
app.use((req, res, next) => {
  res.locals.accountData = req.session?.accountData || null;
  next();
});

/* ***********************
 * View Engine and Templates
 *************************/
app.set("view engine", "ejs")
app.use(expressLayouts)
app.set("layout", "./layouts/layout") //not at views root

/* ***********************
 * Routes
 *************************/

//Index route
app.get("/", utilities.handleErrors(baseController.buildHome))

//Inventory routes
app.use("/inv", inventoryRoute)

//Account route
app.use("/account", accountRoute)

// File Not Found Route - must be last route in list
app.use(async (req, res, next) => {
  next({status: 404, message: 'Sorry, we appear to have lost that page.'})
})

/* ***********************
* Express Error Handler
* Place after all other middleware
*************************/
app.use(async (err, req, res, next) => {
  let nav = await utilities.getNav()
  console.error(`Error at: "${req.originalUrl}": ${err.message}`)
  let message;
  if(err.status == 404){ 
    message = err.message} else {
      message = `R2-D2 beeped something about a bad request. It's ok, no Jedi were harmed in this crash.
      <a href= "/">Hop back in the DeLorean</a> and try again.`}
  res.render("errors/error", {
    title: err.status || 'Server Error',
    message,
    nav
  });
});


/* ***********************
 * Local Server Information
 * Values from .env (environment) file
 *************************/
const port = process.env.PORT || 5500;
const host = "localhost";

/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, () => {
  console.log(`app listening on ${port}`)
})
