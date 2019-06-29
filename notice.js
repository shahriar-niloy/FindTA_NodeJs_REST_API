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

router.post("", auth, (req, res) => {
  const { courseCode, section, subject, content } = req.body;
  const date = new Date();
  conn.query(
    `insert into notice (courseID, subject, content, date) values ((select id from courses where code = ? and sec = ?), ?, ?, '${date
      .toISOString()
      .slice(0, 10)}')`, [courseCode, section, subject, content],
    (err, result, fileds) => {
      if (err) {
        res.status(400);
        res.send("Error Inserting Record");
        throw err;
      } else {
        res.status(200);
        res.send("Successfully inserted record");
      }
    }
  );
});

router.get("", (req, res) => {
  conn.query(
    "SELECT notice.id, courseID, code, subject, content, date, sec FROM notice, courses where courses.id = notice.courseID order by date desc",
    function(err, result, fields) {
      if (err) throw err;
      res.send(result);
    }
  );
});

router.get("/course/:id", (req, res) => {
  conn.query(
    `SELECT notice.id, courseID, code, subject, content, date, sec FROM notice, courses where notice.courseID = ? and courses.id = notice.courseID order by date desc`, [req.params.id], function(err, result, fields) {
      if (err) throw err;
      res.status(200).send(result);
    }
  );
});

router.put("/:id", (req, res) => {
  const { subject, content, sec } = req.body;
  conn.query(
    `UPDATE NOTICE SET subject = ?, content = ? where id = ?`, [subject, content, req.params.id],
    (err, result, field) => {
      if (err) throw err;
      res.status(200).send("success");
    }
  );
});

router.delete("/:id", (req, res) => {
  conn.query(
    `DELETE FROM NOTICE WHERE ID = ?`, [req.params.id],
    (error, result, fields) => {
      if (error) throw error;
      res.status(200).send("delete successfull");
    }
  );
});

module.exports = router;
