const express = require("express");
var cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mysql = require("mysql");
const app = express();

const courseRouter = require('./courses');
const utaRouter = require('./uta');
const noticeRouter = require('./notice');
const instructorRouter = require('./instructors');
const statRouter = require('./pageStats');
const otherRouter = require('./other');

app.use(cookieParser());
app.use(cors({ credentials: true, origin: 'http://localhost:3001' }));
app.use(bodyParser.json());

app.use('/api/courses', courseRouter);
app.use('/api/uta', utaRouter);
app.use('/api/notice', noticeRouter);
app.use('/api/instructors', instructorRouter);
app.use('/api/stats', statRouter);
app.use('/api', otherRouter);

const conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "findta"
});

conn.connect(function(err) {
  if (err) throw err;
});

app.listen(3000, () => {
  console.log("Listening on port 3000");
});