const express = require('express');
const mysql = require("mysql");
const router = express.Router();

const conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "findta"
});

router.get('/startDate', (req, res) => {
    conn.query("SELECT value FROM config where variable = 'startDate'", function(err, result, fields) {
        if (err) throw err;
        res.send(result[0].value);
    });
})

router.get('/endDate', (req, res) => {
    conn.query("SELECT value FROM config where variable = 'endDate'", function(err, result, fields) {
        if (err) throw err;
        res.send(result[0].value);
    });
})

module.exports = router;