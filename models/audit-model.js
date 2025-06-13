const pool = require("../database");

/****************************************
 *** Log and inventory change---add, update, delete
 ****************************************/
async function logInventoryChange(vehicle_id, action, old_data, new_data, user_id) {
  try {
    const sql = `
      INSERT INTO inventory_audit (
        vehicle_id,
        action,
        old_data,
        new_data,
        changed_by
      )
      VALUES ($1, $2, $3, $4, $5)
    `;
    const result = await pool.query(sql, [
      vehicle_id,
      action,
      old_data,
      new_data,
      user_id,
    ]);
    return result;
  } catch (error) {
    console.error("Error logging inventory change:", error);
    throw error;
  }
}

/****************************************
 *** Get all inventory audit logs
 ****************************************/
async function getInventoryLogs() {
  try {
    const sql = `
      SELECT ia.*, 
             a.account_firstname || ' ' || a.account_lastname AS changed_by_name,
             i.inv_make || ' ' || i.inv_model AS vehicle_name
      FROM inventory_audit ia
      JOIN account a ON ia.changed_by = a.account_id
      JOIN inventory i ON ia.vehicle_id = i.inv_id
      ORDER BY ia.change_date DESC
    `;
    const result = await pool.query(sql);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving inventory logs:", error);
    throw error;
  }
}

/****************************************
 *** Clear Inventory Audit logs
 ****************************************/
async function clearInventoryLogs() {
  try {
    const sql = "DELETE FROM inventory_audit"
    await pool.query(sql)
  } catch (error) {
    console.error("Error clearing audit logs:", error)
    throw error
  }
}

module.exports = {
  logInventoryChange,
  getInventoryLogs,
  clearInventoryLogs
};