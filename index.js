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

app.use(cookieParser());
app.use(cors({ credentials: true, origin: 'http://localhost:3001' }));
app.use(bodyParser.json());

app.use('/api/courses', courseRouter);
app.use('/api/uta', utaRouter);
app.use('/api/notice', noticeRouter);

const conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "findta"
});

conn.connect(function(err) {
  if (err) throw err;
});

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





//--------login apicalls-------

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


//--------------instructor related----------------
app.get("/api/instructors/", (req, res) => {
  conn.query(`SELECT * FROM instructor`, function(err, result, fields) {
    if (err) throw err;
    res.send(result);
  });
});

app.get("/api/instructors/:id", (req, res) => {
  conn.query(`SELECT * FROM instructor where id = ${req.params.id}`, function(
    err,
    result,
    fields
  ) {
    if (err) throw err;
    res.send(result);
  });
});


//-----page stats related api calls ---------
//------must need auth---------------

app.get("/api/stats/last/:days", auth, (req, res) => {
  const query = `SELECT DATE_FORMAT(Date, "%D %b") as date FROM (select a.Date 
    from (
        select curdate() - INTERVAL (a.a + (10 * b.a)) DAY as Date
        from (select 0 as a union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9) as a
        cross join (select 0 as a union all select 1 union all select 2 union all select 3 union all select 4 union all select 5 union all select 6 union all select 7 union all select 8 union all select 9) as b
    ) as a
    where a.Date between CURRENT_DATE() - INTERVAL ${req.params.days-1} DAY AND CURRENT_DATE() ORDER BY a.Date asc limit ${req.params.days}) AS temp`
  let data = [];
  let data2 = [];
  let i = 0, j = 0;
  conn.query(query, (error, result, fields) => {
    if(error) throw error;
    data = result;
  });
  conn.query(`SELECT DATE_FORMAT(date, "%D %b") AS date, count FROM (SELECT date, count FROM VISITORS WHERE DATE BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL ${req.params.days-1} DAY) AND CURRENT_DATE() ORDER BY DATE ASC LIMIT ${req.params.days}) AS TEMP`, (error, result, fields) => {
    if(error) throw error; 
    data2 = result; 
    for(i in data){
      if(j < data2.length && data[i].date === data2[j].date){
        data[i].count = data2[j].count;
        ++j;
      }else{
        data[i].count = 0;
      }
    }
    res.status(200).send(data);
  });
});

app.get("/api/stats", auth, (req, res) => {
  conn.query(`SELECT * FROM VISITORS`, (error, result, fields) => {
    if(error) throw error; 
    res.status(200).send(result);
  });
});

app.get("/api/stats/hello", (req, res) => {
  if(req.cookies['visited']){
    res.status(200).send("Welcome back");
  } 
  else{
    conn.query(`UPDATE STATS SET VALUE = VALUE + 1 WHERE NAME = 'uniqueVisitors'`, (error, result, fields) => {
      if(error) throw error; 
    });
    res.cookie("visited","true", { expire: 24*60*60 + Date.now() }).status(200).send("Cookie sent");
  }
  conn.query(`INSERT INTO VISITORS VALUES (CURRENT_DATE(), 1) ON DUPLICATE KEY UPDATE COUNT = COUNT+ 1`, (error, result, fields) => {
    if(error) throw error;
  });
});

app.get("/api/stats/unique", auth, (req, res) => {
  conn.query(`SELECT value FROM STATS WHERE NAME = 'uniqueVisitors'`, (error, result, fields) => {
    if(error) throw error;
    res.status(200).send(result[0].value.toString());
  });
});

app.get("/api/stats/served", auth, (req, res) => {
  conn.query(`SELECT SUM(COUNT) as count FROM VISITORS`, (error, result, fields) => {
    if(error) throw error;
    console.log(result[0].count);
    res.status(200).send(result[0].count.toString());
  });
});