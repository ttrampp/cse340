// Needed Resources 
const express = require("express")
const router = new express.Router() 
const invController = require("../controllers/invController")
const utilities = require("../utilities");
const inventoryValidate = require("../utilities/")

// Route to build inventory by classification view
router.get("/type/:classificationId", utilities.handleErrors(invController.buildByClassificationId));

// View details for one specific vehicle
router.get("/detail/:invId", utilities.handleErrors(invController.buildByInventoryId));

router.get("/trigger-error", utilities.handleErrors(invController.triggerError));

router.get("/", invController.buildManagement);

router.get("/add-classification", utilities.handleErrors(invController.buildAddClassification));

router.get("/add-inventory", utilities.handleErrors(invController.buildAddInventory));

router.get("/edit/:inv_id", utilities.handleErrors(invController.buildEditInventoryView));

router.post(
    "/add-classification",
    utilities.classificationRules(),
    utilities.checkClassificationData,
    utilities.handleErrors(invController.addClassification)
)

router.post(
    "/add-inventory",
    utilities.inventoryRules(),
    utilities.checkInventoryData,
    utilities.handleErrors(invController.addInventory)
)

router.get("/getInventory/:classification_id", utilities.handleErrors(invController.getInventoryJSON));

//Route to handle inventory update form submission
router.post(
    "/update/",
    inventoryValidate.inventoryRules(),
    inventoryValidate.checkInventoryData,
    utilities.handleErrors(invController.updateInventory)
)

//Deliver the delete confirmation view
router.get('/delete/:inv_id', async (req, res, next) => {
    try {
        return invController.buildDeleteView(req, res, next);
    } catch (err) {
        next(err);
    }
});

//Handle the delete submission
router.post('/delete/', async (req, res, next) => {
    try {
        return invController.deleteInventoryItem(req, res, next);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
