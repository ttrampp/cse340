const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")
const invController = {}
const {getInventoryLogs, logInventoryChange} = require("../models/audit-model")

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

    if (addResult && addResult.rows.length > 0) {
      const newVehicleId = addResult.rows[0].inv_id
      const newVehicleData = {
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
      }

      // Log the ADD action to the inventory_audit table
      await logInventoryChange(
        newVehicleId,
        "ADD",
        null,
        JSON.stringify(newVehicleData),
        req.session.accountData.account_id
      )

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
 * Deliver the delete inventory confirmation view
 * ************************** */
invController.buildDeleteView = async function (req, res, next) {
  const inv_id = req.params.inv_id;
  try {
    const data = await invModel.getInventoryById(inv_id);
    const nav = await utilities.getNav();
    const name = `${data.inv_make} ${data.inv_model}`;
    res.render("inventory/delete-confirm", {
      title: `Delete ${name}`,
      nav,
      message: req.flash("notice"),
      errors: null,
      inv_id: data.inv_id,
      inv_make: data.inv_make,
      inv_model: data.inv_model,
      inv_year: data.inv_year,
      inv_price: data.inv_price
    });
  } catch (error) {
    console.error("Error building delete view:", error);
    next(error);
  }
}

/* ***************************
 *  Delete Inventory Item
 * ************************** */
invController.deleteInventoryItem = async function (req, res, next) {
  const inv_id = parseInt(req.body.inv_id, 10)

  try {
    //Get deleted item data before deleting--for audit log
    const deletedData = await invModel.getInventoryById(inv_id)
    const deleteResult = await invModel.deleteInventoryItem(inv_id)

    if (deleteResult) {
      // Log DELETE to audit table
      await logInventoryChange(
        inv_id,
        "DELETE",
        JSON.stringify(deletedData),
        null,
        req.session.accountData.account_id
      );

      const nav = await utilities.getNav()
      req.flash("notice", "The inventory item was successfully deleted.")
      res.redirect("/inv/")
    } else {
      const nav = await utilities.getNav()
      req.flash("notice", "Sorry, the delete failed.")
      res.status(501).render("inventory/delete-confirm", {
        title: "Delete Inventory Item",
        nav,
        message: req.flash("notice"),
        errors: null,
        inv_id: req.body.inv_id,
        inv_make: req.body.inv_make,
        inv_model: req.body.inv_model,
        inv_year: req.body.inv_year,
        inv_price: req.body.inv_price
      })
    }
  } catch (error) {
    console.error("Error deleting inventory item:", error)
    next(error)
  }
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
    // Get original inventory data BEFORE the update (for logging)
    const originalData = await invModel.getInventoryById(inv_id);

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
      const newData = {
        inv_id,
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
        classification_name: originalData.classification_name
      }

      // Log UPDATE to audit log
      await logInventoryChange(
        inv_id,
        "UPDATE",
        JSON.stringify(originalData),
        JSON.stringify(newData),
        req.session.accountData.account_id
      );
      const nav = await utilities.getNav()
      const itemName = inv_make + " " + inv_model;
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
      })
    }
  } catch (error) {
    next(error)
  }
}

/* ***************************
 *  Build Inventory Change Log View (Admin only)
 * ************************** */
invController.buildInventoryLogView = async function (req, res) {
  try {
    const logs = await require("../models/audit-model").getInventoryLogs()
    const nav = await utilities.getNav()

    console.log("Sending logs to inventory log view:", logs)

    console.log("Logs going to inventory-log.ejs:");
    logs.forEach((log, i) => {
      console.log(`Log #${i + 1}:`, log);
    });

    res.render("inventory/inventory-log", {
      title: "Inventory Change Log",
      nav,
      logs,
      accountData: req.session.accountData,
      message: req.flash("notice")
    })
  } catch (err) {
    console.error("Failed to load audit log:", err)
    const nav = await utilities.getNav()
    res.status(500).render("inventory/inventory-log", {
      title: "Inventory Change Log",
      nav,
      logs: [],
      accountData: req.session.accountData,
      message: "Error loading log."
    })
  }
}

/* ***************************
 *  Display Inventory Audit Logs (Admin only)
 * ************************** */
invController.showAuditLogs = async function (req, res, next) {
  try {
    const logs = await getInventoryLogs()
    const nav = await utilities.getNav()
    res.render("inventory/audit-log", {
      title: "Inventory Audit Log",
      nav,
      logs
    })
  } catch (error) {
    console.error("Error loading audit logs:", error)
    next(error)
  }
}

/* ***************************
 *  Clear Audit Logs
 * ************************** */
invController.clearAuditLog = async function (req, res, next) {
  try {
    await require("../models/audit-model").clearInventoryLogs()
    req.flash("notice", "Audit log cleared.")
    res.redirect("/inv/log")
  } catch (error) {
    console.error("Error clearing audit log:", error)
    next(error)
  }
}



module.exports = invController