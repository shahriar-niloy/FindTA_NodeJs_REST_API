const express = require("express");
const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const router = express.Router();

const conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "findta"
});

router.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  conn.query(
    `SELECT * FROM users where username = ? and password = ? `, [username, password],
    function(err, result, fields) {
      if (err) throw err;
      if (result.length > 0) {
        res.status(200);
        const token = jwt.sign({ username: username }, "secretkey");
        res.cookie("jwt", token, {
          domain: "localhost",
          path: "/",
          httpOnly: true,
          secure: false,
          expires: new Date(Date.now() + 9000000)
        });
        res.header("x-auth-token", token);
        res.send("Login Successful");
      } else {
        res.status(400);
        res.send("Login Unsuccessful");
      }
    }
  );
});

router.get("/isLoggedIn", (req, res) => {
  const token = req.cookies["jwt"];
  if (token) {
    try {
      jwt.verify(token, "secretkey");
      res.status(200).send({});
    } catch (error) {
      res.status(400).send({});
    }
  } else {
    res.status(400).send({});
  }
});

router.get("/logout", (req, res) => {
  res.cookie("jwt", "", {
    domain: "localhost",
    path: "/",
    httpOnly: true,
    secure: false,
    expires: new Date(Date.now())
  });
  res.send({});
});

module.exports = router;
