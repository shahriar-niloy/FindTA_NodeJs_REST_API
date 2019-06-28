const express = require("express");
var cors = require('cors');
const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const auth = require('./auth');
const config = require('./config/default.json');
const app = express();

const courseRouter = require('./courses');
const utaRouter = require('./uta');
const noticeRouter = require('./notice');
const instructorRouter = require('./instructors');
const statRouter = require('./pageStats');

app.use(cookieParser());
app.use(cors({ credentials: true, origin: 'http://localhost:3001' }));
app.use(bodyParser.json());

app.use('/api/courses', courseRouter);
app.use('/api/uta', utaRouter);
app.use('/api/notice', noticeRouter);
app.use('/api/instructors', instructorRouter);
app.use('/api/stats', statRouter);

const conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "findta"
});

conn.connect(function(err) {
  if (err) throw err;
});


//--------login apicalls-------

app.post("/api/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  conn.query(`SELECT * FROM users where username = '${username}' and password = '${password}' `, function(err, result, fields) {
    if (err) throw err;
    if(result.length > 0){
      res.status(200);
      const token = jwt.sign({ username: username }, "secretkey");
      res.cookie("jwt", token, { domain: "localhost", path: "/", httpOnly: true, secure: false, expires: new Date(Date.now() + 9000000) });
      res.header("x-auth-token", token);
      res.send("Login Successful");
    }else{
      res.status(400);
      res.send("Login Unsuccessful");
    }
  });
});

app.get("/api/isLoggedIn", (req, res) => {
  const token = req.cookies['jwt'];
  if(token){
    try{
      jwt.verify(token, "secretkey")
      res.status(200).send({});
    } catch(error) {
      res.status(400).send({});
    }
  }else{
    res.status(400).send({});
  }
});

app.get("/api/logout", (req, res) => {
  res.cookie("jwt", "", { domain: "localhost", path: "/", httpOnly: true, secure: false, expires: new Date(Date.now()) });
  res.send({});
});

app.listen(3000, () => {
  console.log("Listening on port 3000");
});
