var express = require("express");
var path = require("path");
var routes = require("./routes");
var server = express();
var cons = require('consolidate');

server.engine('html', cons.swig);
server.set("port", process.env.PORT || 3000);
server.set("views", path.join(__dirname, "views"));
// server.set("view engine", "ejs");
server.set("view engine", "html");
server.use(routes);
server.listen(server.get("port"), function(){
    console.log("Server started on port " + server.get("port"));
});