const express = require('express');
const mysql = require("mysql");
const router = express.Router();
const auth = require('./auth');

const conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "findta"
});

router.get("", (req, res) => {
  conn.query(`SELECT * FROM instructor`, function(err, result, fields) {
    if (err) throw err;
    res.send(result);
  });
});

router.get("/:id", (req, res) => {
  conn.query(`SELECT * FROM instructor where id = ?`, [req.params.id], function(
    err,
    result,
    fields
  ) {
    if (err) throw err;
    res.send(result);
  });
});

module.exports = router;