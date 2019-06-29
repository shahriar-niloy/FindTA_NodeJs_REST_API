const express = require("express");
const mysql = require("mysql");
const router = express.Router();
const auth = require("./auth");

const conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "findta"
});


router.get("", (req, res) => {
  conn.query(`SELECT * FROM uta`, function(err, result, fields) {
    if (err) throw err;
    res.send(result);
  });
});

router.get("/:id", (req, res) => {
  conn.query(`SELECT * FROM uta where id = ?`, [req.params.id], function(
    err,
    result,
    fields
  ) {
    if (err) throw err;
    res.send(result);
  });
});

router.get("/schedule/", (req, res) => {
  // get template office hour
  conn.query(
    `SELECT dayNum, day, TS1, TS2, TS3, TS4, TS5, TS6 FROM schedule where utaid = 0 and semester = 2 order by daynum`,
    function(err, result, fields) {
      if (err) throw err;
      console.log(result);
      res.send(result);
    }
  );
});

router.get("/schedule/:id", (req, res) => {
  conn.query(
    `SELECT utaid, dayNum, day, TS1, TS2, TS3, TS4, TS5, TS6 FROM schedule where utaid = ? and semester = 2 order by daynum`,
    [req.params.id],
    function(err, result, fields) {
      if (err) throw err;
      res.send(result);
    }
  );
});

router.post("/updateSchedule", auth, (req, res) => {
  const data = req.body;
  data.oh.map(item => {
    conn.query(
      `insert into schedule 
      (utaid, semester, dayNum, day, TS1, TS2, TS3, TS4, TS5, TS6)
      values (?,2,?,?,?,?,?,?,?,?)
      on duplicate key update
      day = ?, TS1 = ?, TS2 = ?, TS3 = ?, TS4 = ?, TS5 = ?, TS6 = ?`,
      [data.id, item.dayNum, item.day, item.TS1, item.TS2, item.TS3, item.TS4, item.TS5, item.TS6, item.day, item.TS1, item.TS2, item.TS3, item.TS4, item.TS5, item.TS6],
      (err, result, fields) => {
        if (err) {
          console.log("Update Shcedule Error: " + err);
          res.status(500).send("Coudn't update schedule");
          return;
        }
      }
    );
  });
  res.status(200).send("Successfully updated schedule");
});

module.exports = router;
