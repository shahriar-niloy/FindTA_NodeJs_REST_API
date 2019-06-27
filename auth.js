const jwt = require('jsonwebtoken');
const secretkey = "secretkey";

module.exports = (req, res, next) => {
    try {
        //const token = req.headers.authorization.split(" ")[1];
        //console.log("At auth");
        const token = req.cookies['jwt'];
        //console.log("Cookies: " + token);
        if(token){
            //console.log("Inside if");
            const decoded = jwt.verify(token, secretkey); 
            req.userdata = decoded; 
            //console.log("Decoded: ", decoded);   
        }else{
            throw new Error("No token found");
        }
        next();
    } catch(error) {
        return res.status(401).json({
            message: "Auth failed" + error
        });
    }
};