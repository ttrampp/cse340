const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")

const invCont = {}

/* ***************************
 *  Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async function (req, res, next) {
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

invCont.buildByInventoryId = async function (req, res, next) {
  const invId = req.params.invId;
  console.log("✅ Route hit: /inventory/detail/" + invId);
  try {
    const data = await invModel.getInventoryById(invId);
    console.log("✅ Data returned from DB:", data);

    if (!data) {
      console.log("❌ No data found for inv_id:", invId);
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
    console.error("❌ ERROR in buildByInventoryId:", error);
    next(error);
  }
};

invCont.triggerError = async function (req, res, next) {
  try {
    throw new Error("Intentional 500 error triggered.");
  } catch (error) {
    next(error);
  }
};


module.exports = invCont