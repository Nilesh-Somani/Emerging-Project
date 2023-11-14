const express = require("express"),
        
        app = express();

app.set("view engine", "ejs");

app.get("/", (req,res) => {
    res.render("demo");
})

app.listen(3000, () => {
    open("http://localhost:3000");
})
