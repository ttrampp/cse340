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
    let classificationSelect = await utilities.buildClassificationOptions("");

    res.render("inventory/management", {
      title: "Inventory Management",
      nav,
      classificationSelect,
      message: req.flash("notice"),
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

/* ***************************
 *  Return Inventory by Classification As JSON
 * ************************** */
invController.getInventoryJSON = async (req, res, next) => {
  const classification_id = parseInt(req.params.classification_id)
  const invData = await invModel.getInventoryByClassificationId(classification_id)
  if (invData[0].inv_id) {
    return res.json(invData)
  } else {
    next(new Error("No data returned"))
  }
}

/* ***************************
 *  Build edit inventory view
 * ************************** */
invController.buildEditInventoryView = async function (req, res, next) {
  const inv_id = parseInt(req.params.inv_id)
  let nav = await utilities.getNav()
  const itemData = await invModel.getInventoryById(inv_id)
  const classificationSelect = await utilities.buildClassificationOptions(itemData.classification_id)
  const itemName = `${itemData.inv_make} ${itemData.inv_model}`
  res.render("./inventory/edit-inventory", {
    title: "Edit " + itemName,
    nav,
    classificationList: classificationSelect,
    errors: null,
    message: req.flash("notice"),
    inv_id: itemData.inv_id,
    inv_make: itemData.inv_make,
    inv_model: itemData.inv_model,
    inv_year: itemData.inv_year,
    inv_description: itemData.inv_description,
    inv_image: itemData.inv_image,
    inv_thumbnail: itemData.inv_thumbnail,
    inv_price: itemData.inv_price,
    inv_miles: itemData.inv_miles,
    inv_color: itemData.inv_color,
    classification_id: itemData.classification_id
  })
}

/* ***************************
 *  Update Inventory Data
 * ************************** */
invController.updateInventory = async function (req, res, next) {
  const inv_id = parseInt(req.body.inv_id, 10)
  const classification_id = parseInt(req.body.classification_id, 10)
  const inv_make = req.body.inv_make
  const inv_model = req.body.inv_model
  const inv_description = req.body.inv_description
  const inv_image = req.body.inv_image
  const inv_thumbnail = req.body.inv_thumbnail
  const inv_price = parseFloat(req.body.inv_price)
  const inv_year = parseInt(req.body.inv_year, 10)
  const inv_miles = parseInt(req.body.inv_miles, 10)
  const inv_color = req.body.inv_color

  try {
    const updateResult = await invModel.updateInventory(
      inv_make,
      inv_model,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_year,
      inv_miles,
      inv_color,
      classification_id,
      inv_id
    )

    if (updateResult) {
      const nav = await utilities.getNav()
      const itemName = updateResult.inv_make + " " + updateResult.inv_model
      req.flash("notice", `The ${itemName} was successfully updated.`)
      res.redirect("/inv/")
    } else {
      const nav = await utilities.getNav()
      const classificationList = await utilities.buildClassificationOptions(classification_id)
      const itemName = updateResult.inv_make + " " + updateResult.inv_model
      req.flash("notice", "Sorry, the update failed.")
      res.status(501).render("inventory/edit-inventory", {
        title: "Edit " + itemName,
        nav,
        classificationList: classificationList,
        message: req.flash("notice"),
        error: null,
        inv_id, classification_id, inv_make, inv_model, inv_year,
        inv_description, inv_image, inv_thumbnail, inv_price,
        inv_miles, inv_color
      })
    }
  } catch (error) {
    next(error)
  }
}


module.exports = invController