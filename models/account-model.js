//Bring in th edatabase connection
const pool = require("../database")

/* *****************************
*   Register new account
* *************************** */
async function registerAccount(accountFirstname, accountLastname, accountEmail, accountPassword) {
  try {
    const sql =
      "INSERT INTO account (accountFirstname, accountLastname, accountEmail, accountPassword, account_type) VALUES ($1, $2, $3, $4, 'Client') RETURNING *"
    return await pool.query(sql, [
      accountFirstname,
      accountLastname,
      accountEmail,
      accountPassword
    ])
  } catch (error) {
    return error.message
  }
}

// Export the function
module.exports = { registerAccount }