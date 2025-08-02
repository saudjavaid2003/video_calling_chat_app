const express = require("express");
const router = express.Router(); // ✅ Capital 'R' in Router

router.get("/", function (req, res) {
  res.render("index");
  router.get("/chat",function(req,res){
    res.render("chat")
    
  })
});


module.exports = router; // ✅ Fix this line too
