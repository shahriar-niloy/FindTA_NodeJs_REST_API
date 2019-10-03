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
  conn.query("SELECT * FROM courses", function(err, result, fields) {
    if (err) throw err;
    res.send(result);
  });
});

router.post("", auth, (req, res) => {
  const { code, title, timeslot, section, picture } = req.body;
  conn.query(`INSERT INTO COURSES ( CODE, TITLE, SEC, TIMESLOT, PIC ) VALUES (?,?,?,?,?)`, [code, title, section, timeslot, picture], (err, result, field) => {
    if(err) throw err;
    res.status(200).send(result);
  });
});

router.get("/:id", (req, res) => {
  conn.query(`SELECT * FROM courses where id = ?`, [req.params.id], function(err, result, fields) {
    if (err) throw err;
    console.log(result);
    res.send(result);
  });
});

router.delete("/:id", auth, (req, res) => {
  conn.query(`DELETE FROM courses where id = ?`, [req.params.id], function(err, result, fields) {
    if (err) {
      res.status(401).send(result);
      throw err;
    }
    res.status(200).send(result);
  });
});

router.put("/:id", auth, (req, res) => {
  const { code, timeslot, title, sec } = req.body;
  console.log("code: ", req.body);
  conn.query(`UPDATE COURSES SET code = ?, timeslot = ?, sec = ?, title = ? where id = ?`, [code, timeslot, sec, title, req.params.id], function(err, result, fields) {
    if (err) {
      res.status(401).send(error);
      throw err;
    }
    res.status(200).send(result);
  });
});

router.get("/materials/:id", (req, res) => {
  conn.query(`SELECT courseID, name, link FROM MATERIAL WHERE COURSEID = ?`, [req.params.id], (err, result, fields) => {
    if(err) throw err;
    //console.log(result)
    if(result)
      res.send(result);
    else 
      res.send({});
  });
});

router.put("/materials/:id", auth, (req, res) => {
  const material = req.body;
  let err = false;
  conn.query(`delete from material where courseID = ?`, [req.params.id], (error, result, fields) => {
    if(error) {
      err = true;
      throw error; 
    }
  });
  material.map((row) => {
    conn.query(`INSERT INTO material (courseID, name, link)
                VALUES (?,?,?)`, [req.params.id, row.name, row.link], (error, result, fields) => {
      if(error) {
        throw error; 
        err = true;
      }
    });
  });
  res.status(200).send("Updated Course Materials");
  console.log("Update course material end");
});

router.delete("/materials/delete/:courseID/:name/", auth, (req, res) => {
  const { courseID, name } = req.params;
  console.log(courseID, name);
  conn.query(`DELETE FROM MATERIAL WHERE COURSEID = ? AND NAME = ?`, [courseID, name], (error, result, fields) => {
    if(error) throw error;
    res.status(200).send({});
  });
});

module.exports = router;