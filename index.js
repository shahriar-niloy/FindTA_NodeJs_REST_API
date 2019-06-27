const express = require("express");
var cors = require('cors');
const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const auth = require('./auth');
const config = require('./config/default.json');
const app = express();

app.use(cookieParser());
app.use(cors({ credentials: true, origin: 'http://localhost:3001' }));
app.use(bodyParser.json());

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

//-------------Course related apicalls--------------

app.get("/api/courses", (req, res) => {
  conn.query("SELECT * FROM courses", function(err, result, fields) {
    if (err) throw err;
    res.send(result);
  });
});

app.post("/api/courses/", auth, (req, res) => {
  const { code, title, timeslot, section, picture } = req.body;
  conn.query(`INSERT INTO COURSES ( CODE, TITLE, SEC, TIMESLOT, PIC ) VALUES ('${code}', '${title}', '${section}', '${timeslot}', '${picture}')`, (err, result, field) => {
    if(err) throw err;
    res.status(200).send(result);
  });
});

app.get("/api/courses/:id", (req, res) => {
  conn.query(`SELECT * FROM courses where id = ${req.params.id}`, function(err, result, fields) {
    if (err) throw err;
    console.log(result);
    res.send(result);
  });
});

app.delete("/api/courses/:id", auth, (req, res) => {
  conn.query(`DELETE FROM courses where id = ${req.params.id}`, function(err, result, fields) {
    if (err) {
      res.status(401).send(result);
      throw err;
    }
    res.status(200).send(result);
  });
});

app.put("/api/courses/:id", auth, (req, res) => {
  const { code, timeslot, title, sec } = req.body;
  console.log("code: ", req.body);
  conn.query(`UPDATE COURSES SET code = '${code}', timeslot = '${timeslot}', sec = ${sec}, title = '${title}' where id = ${req.params.id}`, function(err, result, fields) {
    if (err) {
      res.status(401).send(error);
      throw err;
    }
    res.status(200).send(result);
  });
});

app.get("/api/courseMaterials/:id", (req, res) => {
  conn.query(`SELECT courseID, name, link FROM MATERIAL WHERE COURSEID = ${req.params.id}`, (err, result, fields) => {
    if(err) throw err;
    //console.log(result)
    if(result)
      res.send(result);
    else 
      res.send({});
  });
});

app.put("/api/courseMaterials/:id", auth, (req, res) => {
  const material = req.body;
  let err = false;
  conn.query(`delete from material where courseID = ${req.params.id}`, (error, result, fields) => {
    if(error) {
      err = true;
      throw error; 
    }
  });
  material.map((row) => {
    conn.query(`INSERT INTO material (courseID, name, link)
                VALUES (${req.params.id}, '${row.name}', '${row.link}')`, (error, result, fields) => {
      if(error) {
        throw error; 
        err = true;
      }
    });
  });
});

app.delete("/api/courseMaterials/delete/:courseID/:name/", auth, (req, res) => {
  const { courseID, name } = req.params;
  console.log(courseID, name);
  conn.query(`DELETE FROM MATERIAL WHERE COURSEID = ${courseID} AND NAME = '${name}'`, (error, result, fields) => {
    if(error) throw error;
    res.status(200).send({});
  });
});

//-------------UTA related apicalls--------------

app.get("/api/uta/", (req, res) => {
  conn.query(`SELECT * FROM uta`, function(err, result, fields) {
    if (err) throw err;
    res.send(result);
  });
});

app.get("/api/uta/:id", (req, res) => {
  conn.query(`SELECT * FROM uta where id = ${req.params.id}`, function(
    err,
    result,
    fields
  ) {
    if (err) throw err;
    res.send(result);
  });
});

app.get("/api/schedule/", (req, res) => { // get template office hour
  conn.query(
    `SELECT dayNum, day, TS1, TS2, TS3, TS4, TS5, TS6 FROM schedule where utaid = 0 and semester = 2 order by daynum`,
    function(err, result, fields) {
      if (err) throw err;
      console.log(result);
      res.send(result);
    }
  );
});

app.get("/api/schedule/:id", (req, res) => {
  conn.query(
    `SELECT utaid, dayNum, day, TS1, TS2, TS3, TS4, TS5, TS6 FROM schedule where utaid = ${
      req.params.id
    } and semester = 2 order by daynum`,
    function(err, result, fields) {
      if (err) throw err;
      res.send(result);
    }
  );
});

app.post("/api/updateSchedule", auth, (req, res) => {
  const data = req.body;
  data.oh.map(item => {
    conn.query(`insert into schedule 
    (utaid, semester, dayNum, day, TS1, TS2, TS3, TS4, TS5, TS6)
    values (${data.id},${2},${item.dayNum},'${item.day}','${item.TS1}','${item.TS2}','${item.TS3}','${item.TS4}','${item.TS5}','${item.TS6}')
    on duplicate key update
    day = '${item.day}', TS1 = '${item.TS1}', TS2 = '${item.TS2}', TS3 = '${item.TS3}', TS4 = '${item.TS4}', TS5 = '${item.TS5}', TS6 = '${item.TS6}'`, (err, result, fields) => {
      if(err) {
        console.log("Update Shcedule Error: " + err); 
        res.status(500).send("Coudn't update schedule");
        return;
      }
    });
  });
  res.status(200).send("Successfully updated schedule");
});

//---------notice related apicalls---------------

app.post("/api/addNotice", auth, (req, res) => {
  const { courseCode, section, subject, content } = req.body;
  const date = new Date();
  conn.query(`insert into notice (courseID, subject, content, date) values ((select id from courses where code = '${courseCode}' and sec = '${section}'), '${subject}', '${content}', '${date.toISOString().slice(0,10)}')`, (err, result, fileds) => {
    if(err){
      res.status(400);
      res.send("Error Inserting Record");
      throw err;
    }else{
      res.status(200);
      res.send("Successfully inserted record");
    }
  });
});

app.get("/api/notice", (req, res) => {
  conn.query("SELECT notice.id, courseID, code, subject, content, date, sec FROM notice, courses where courses.id = notice.courseID order by date desc", function(err, result, fields) {
    if (err) throw err;
    res.send(result);
  });
});

app.get("/api/notice/course/:id", (req, res) => {
  conn.query(`SELECT notice.id, courseID, code, subject, content, date, sec FROM notice, courses where notice.courseID = ${req.params.id} and courses.id = notice.courseID order by date desc`, function(err, result, fields) {
    if (err) throw err;
    res.status(200).send(result);
  });
});

app.put("/api/notice/:id", (req, res) => {
  const { subject, content, sec  } = req.body;
  conn.query(`UPDATE NOTICE SET subject = '${subject}', content = '${content}' where id = ${req.params.id}`, (err, result ,field) => {
    if(err) throw err;
    res.status(200).send("success");
  });
});

app.delete("/api/notice/:id", (req, res) => {
  conn.query(`DELETE FROM NOTICE WHERE ID = ${req.params.id}`, (error, result, fields) => {
    if (error) throw error;
    res.status(200).send("delete successfull");
  })
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