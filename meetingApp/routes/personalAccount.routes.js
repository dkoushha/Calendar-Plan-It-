const express = require("express");
const router = express.Router();
// Require user model
const User = require("../models/User.model");
//require event model
const Event = require("../models/Events");
// require moment.js
const momentTimezone = require("moment-timezone");
const moment = require("moment");
const axios = require('axios')



//fetch the data from database when loading the calender
router.get("/data", function (req, res) {
  Event.find().then((dataToSend) => {
    dataToSend.forEach((e) => {
      let utcTime = moment.utc(e.start_date);
      console.log("utc time", utcTime);
      let localTime = utcTime.local();
      console.log("start-date", localTime);
      e.start_date = localTime;
    });
    console.log("outPut: dataToSend", dataToSend);
    res.send(dataToSend);
  });
});

// add delete edit the events to database
router.post("/data", (req, res) => {
  let data = req.body;
  console.log("data", data);
  // operation mode (edit, add, delete)
  let mode = data["!nativeeditor_status"];
  console.log("outPut: mode", mode);
  let sid = data.id;
  console.log("outPut: sid", sid);
  let tid = sid;
  console.log("outPut: tid", tid);

  function update_response(err) {
    if (err) mode = "error";
    else if (mode == "inserted") {
      tid = data.id;
      console.log("outPut: functionupdate_response -> tid", tid);
    }
    res.setHeader("Content-Type", "application/json");
    res.send({
      action: mode,
      sid: sid,
      tid: String(tid),
    });
  }
  // edit an event
  if (mode == "updated") {
    console.log("id", req.body.id);
    Event.findOneAndUpdate({
        id: req.body.id,
      }, {
        text: req.body.text,
        start_date: req.body.start_date,
        end_date: req.body.end_date,
      }, {
        new: true
      },
      update_response
    );
    // delete an event
  } else if (mode == "deleted") {
    Event.findOneAndDelete({
        id: req.body.id,
      },
      update_response
    );
    // add a new event
  } else if (mode == "inserted") {
    console.log("user", req.user._id);
    let event = new Event({
      id: req.body.id,
      text: req.body.text,
      start_date: req.body.start_date,
      end_date: req.body.end_date,
      _userId: req.user.id
    });
    event.save();
    update_response();
  } else res.send("Not supported operation");
});

// find out time zone for the user from ip 
// router.get("/personalAccount", (req, res) => {
//   axios.get("http://ip-api.com/json").then((response) => {
//     // console.log(response);
//     console.log("Latitude: ", response.data.lat);
//     console.log("Longitude", response.data.lon);
//     let userLat = response.data.lat;
//     let userLon = response.data.lon;

//     //API Key:EUU8LOIMTSKG
//     axios
//       .get(
//         "http://api.timezonedb.com/v2.1/get-time-zone?key=EUU8LOIMTSKG&format=json&by=position&lat=" +
//         userLat +
//         "&lng=" +
//         userLon
//       )
//       .then((response) => {
//         // console.log(response.data);

//         res.render("auth/personalAccount", {
//           user: req.user,
//           zone: response.data,
//         });
//       });
//   });
// });
module.exports = router;