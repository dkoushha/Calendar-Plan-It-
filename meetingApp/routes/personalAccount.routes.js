const express = require("express");
const router = express.Router();
// Require user model
const User = require("../models/User.model");
//require event model
const Event = require("../models/Events");
// require moment.js
const momentTimezone = require("moment-timezone");
const moment = require("moment");
const axios = require("axios");
const nodemailer = require("nodemailer");
const Token = require("../models/Token");
const randomToken = require("random-token");
const checkVerifiedUser = require("../helpers/middlewares").checkVerifiedUser




//fetch the data from database when loading the calender
router.get("/data", (req, res) => {
  //Event.find({attendList: req.body.user})
  let dataToClientSide = [];
  Event.find().then((dataToSend) => {
    dataToSend.forEach((e) => {
      let utcTime = moment.utc(e.start_date);
      let localTime = utcTime.local();
      e.start_date = localTime;
    });
    console.log("Data", dataToSend);
    console.log("User ID", req.user.id);
    dataToSend.forEach((e) => {
      console.log("Event user ID", e._userId);
      if (e._userId == req.user.id) {
        console.log("Element", e);
        dataToClientSide.push(e);
      }
    });
    res.send(dataToClientSide);
  });
});

// add delete edit the events in the database
router.post("/data", (req, res) => {
  let data = req.body;
  // operation mode (edit, add, delete)
  let mode = data["!nativeeditor_status"];
  let sid = data.id;
  let tid = sid;

  function update_response(err) {
    if (err) mode = "error";
    else if (mode == "inserted") {
      tid = data.id;
      console.log("outPut: functionupdate_response -> tid", tid);
    }
    // send the data back to the calendar
    res.setHeader("Content-Type", "application/json");
    res.send({
      action: mode,
      sid: sid,
      tid: String(tid),
    });
  }
  // edit an event
  if (mode == "updated") {
    Event.findOneAndUpdate({
        id: req.body.id,
      }, {
        text: req.body.text,
        start_date: req.body.start_date,
        end_date: req.body.end_date,
        sentReminder: false,
      }, {
        new: true,
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
    let event = new Event({
      id: req.body.id,
      text: req.body.text,
      start_date: req.body.start_date,
      end_date: req.body.end_date,
      _userId: req.user.id,
      attendList: req.user.id,

    });
    event.save();
    update_response();
  } else res.send("Not supported operation");
});

//find out time zone
//for the user from ip
let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USERNAME,
        pass: process.env.GMAIL_PASSWORD,
    },
});

router.get("/personalAccount", checkVerifiedUser, (req, res) => {    
    console.log(req.user);
    let dataToClientSide = [];
    Event.find().then((dataToSend) => {
        dataToSend.forEach((e) => {
            if (e._userId == req.user.id) {
                dataToClientSide.push(e);
            }
        });
        console.log("DATA CLIENT SIDE", dataToClientSide);
        // res.render("auth/personalAccount", {
        //     events: dataToClientSide
        // });
        return axios.get("http://ip-api.com/json")
    });
  axios.get("http://ip-api.com/json").then((response) => {
      console.log("Latitude: ", response.data.lat);
      console.log("Longitude", response.data.lon);
      let userLat = response.data.lat;
      let userLon = response.data.lon;
      //API Key:EUU8LOIMTSKG
      return axios.get(
        "http://api.timezonedb.com/v2.1/get-time-zone?key=EUU8LOIMTSKG&format=json&by=position&lat=" +
        userLat +
        "&lng=" +
        userLon
      );
    })
    .then((response) => {
      console.log("req.user", req.user);
      res.render("auth/personalAccount", {
        user: req.user,
        zone: response.data,
        events: dataToClientSide
      });
    });
});

module.exports = router;