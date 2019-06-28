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

router.get("/last/:days", auth, (req, res) => {
  const query = `SELECT DATE_FORMAT(Date, "%D %b") as date FROM (select a.Date 
      from (
          select curdate() - INTERVAL (a.a + (10 * b.a)) DAY as Date
          from (select 0 as a union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9) as a
          cross join (select 0 as a union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9) as b
      ) as a
      where a.Date between CURRENT_DATE() - INTERVAL ${req.params.days -
        1} DAY AND CURRENT_DATE() ORDER BY a.Date asc limit ${
    req.params.days
  }) AS temp`;
  let data = [];
  let data2 = [];
  let i = 0,
    j = 0;
  conn.query(query, (error, result, fields) => {
    if (error) throw error;
    data = result;
  });
  conn.query(
    `SELECT DATE_FORMAT(date, "%D %b") AS date, count FROM (SELECT date, count FROM VISITORS WHERE DATE BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL ${req
      .params.days - 1} DAY) AND CURRENT_DATE() ORDER BY DATE ASC LIMIT ${
      req.params.days
    }) AS TEMP`,
    (error, result, fields) => {
      if (error) throw error;
      data2 = result;
      for (i in data) {
        if (j < data2.length && data[i].date === data2[j].date) {
          data[i].count = data2[j].count;
          ++j;
        } else {
          data[i].count = 0;
        }
      }
      res.status(200).send(data);
    }
  );
});

router.get("", auth, (req, res) => {
  conn.query(`SELECT * FROM VISITORS`, (error, result, fields) => {
    if (error) throw error;
    res.status(200).send(result);
  });
});

router.get("/hello", (req, res) => {
  if (req.cookies["visited"]) {
    res.status(200).send("Welcome back");
  } else {
    conn.query(
      `UPDATE STATS SET VALUE = VALUE + 1 WHERE NAME = 'uniqueVisitors'`,
      (error, result, fields) => {
        if (error) throw error;
      }
    );
    res
      .cookie("visited", "true", { expire: 24 * 60 * 60 + Date.now() })
      .status(200)
      .send("Cookie sent");
  }
  conn.query(
    `INSERT INTO VISITORS VALUES (CURRENT_DATE(), 1) ON DUPLICATE KEY UPDATE COUNT = COUNT+ 1`,
    (error, result, fields) => {
      if (error) throw error;
    }
  );
});

router.get("/unique", auth, (req, res) => {
  conn.query(
    `SELECT value FROM STATS WHERE NAME = 'uniqueVisitors'`,
    (error, result, fields) => {
      if (error) throw error;
      console.log(result);
      res.status(200).send(result[0].value.toString());
    }
  );
});

router.get("/served", auth, (req, res) => {
  conn.query(
    `SELECT SUM(COUNT) as count FROM VISITORS`,
    (error, result, fields) => {
      if (error) throw error;
      console.log(result);
      res.status(200).send(result[0].count.toString());
    }
  );
});

module.exports = router;