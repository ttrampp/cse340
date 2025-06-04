const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")
const invController = {}

/* ***************************
 *  Build inventory by classification view
 * ************************** */
invController.buildByClassificationId = async function (req, res, next) {
  const classification_id = req.params.classificationId
  const data = await invModel.getInventoryByClassificationId(classification_id)

  const grid = await utilities.buildClassificationGrid(data)
  let nav = await utilities.getNav()
  const className = data[0].classification_name
  res.render("./inventory/classification", {
    title: className + " vehicles",
    nav,
    grid,
  })
}

/* ***************************
 *  Build inventory by ID
 * ************************** */

invController.buildByInventoryId = async function (req, res, next) {
  const invId = req.params.invId;
  console.log("Route hit: /inventory/detail/" + invId);
  try {
    const data = await invModel.getInventoryById(invId);
    console.log("Data returned from DB:", data);

    if (!data) {
      console.log("No data found for inv_id:", invId);
      return res.status(404).render("error", {
        title: "Vehicle Not Found",
        message: "We couldn’t find a vehicle with that ID.",
        nav: await utilities.getNav()
      });
    }

    const html = utilities.buildDetailView(data);
    const nav = await utilities.getNav();

    res.render("./inventory/detail", {
      title: `${data.inv_make} ${data.inv_model}`,
      nav,
      html,
    });

  } catch (error) {
    console.error("ERROR in buildByInventoryId:", error);
    next(error);
  }
};

invController.triggerError = async function (req, res, next) {
  try {
    throw new Error("Intentional 500 error triggered.");
  } catch (error) {
    next(error);
  }
};


/* ***************************
 *  Deliver the management view
 * ************************** */

invController.buildManagement = async function (req, res, next) {
  try {
    let nav = await utilities.getNav();
    const inventory = await invModel.getAllInventory();
    const inventoryTable = await utilities.buildInventoryTable(inventory);
    res.render("inventory/management", {
      title: "Inventory Management",
      nav,
      message: req.flash("notice"),
      inventoryTable
    })
  } catch (error) {
    next(error)
  }
}

/* ***************************
 *  Deliver the classification form view
 * ************************** */

invController.buildAddClassification = async function (req, res, next) {
  try {
    const nav = await utilities.getNav()
    res.render("inventory/add-classification", {
      title: "Add Classification",
      nav,
      message: req.flash("notice"),
      errors: null
    })
  } catch (error){
    next(error)
  }
}


invController.addClassification = async function (req, res, next) {
  const {classification_name} = req.body

  try {
    const addResult = await invModel.addClassification(classification_name)

    if (addResult) {
      const nav = await utilities.getNav()
      req.flash("notice", `Successfully added ${classification_name} classification`)
      res.status(201).render("inventory/management", {
        title: "Inventory Management",
        nav, 
        message: req.flash("notice")
      })
    } else {
      const nav = await utilities.getNav()
      req.flash("notice", "Sorry, the classification could not be added.")
      res.status(501).render("inventory/add-classification", {
        title: "Add Classification",
        nav,
        message: req.flash("notice"),
        errors: null
      })
    }
  } catch (error) {
    next(error)
  }
}

invController.buildAddInventory = async function (req, res, next) {
  try {
    const nav = await utilities.getNav()
    const classificationList = await utilities.buildClassificationOptions("")
    res.render("inventory/add-inventory", {
      title: "Add Inventory",
      nav,
      classificationList,
      errors: null,
      message: req.flash("notice")
    })
  } catch (error) {
    next(error)
  }
}

invController.addInventory = async function (req, res, next) {
  const {
    classification_id, inv_make, inv_model, inv_year, inv_miles, 
    inv_color, inv_description, inv_image, inv_thumbnail, inv_price
  } = req.body

  try {
    const addResult = await invModel.addInventory(
      classification_id,
      inv_make,
      inv_model,
      inv_year,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_miles,
      inv_color
    )

    if (addResult) {
      const nav = await utilities.getNav()
      req.flash("notice", "Inventory item successfully added.")
      res.status(201).render("inventory/management", {
        title: "Inventory Management",
        nav,
        message: req.flash("notice")
      })
    } else {
      const nav = await utilities.getNav()
      const classificationList = await utilities.buildClassificationOptions(classification_id)
      req.flash("notice", "Inventory item failed to add.")
      res.status(501).render("inventory/add-inventory", {
        title: "Add Inventory",
        nav,
        classificationList,
        message: req.flash("notice"),
        error: null,
        classification_id, inv_make, inv_model, inv_year,
        inv_description, inv_image, inv_thumbnail, inv_price,
        inv_miles, inv_color
      })
    }
  } catch (error) {
    next(error)
  }
}

module.exports = invController