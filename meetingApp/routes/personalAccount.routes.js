const express = require("express");
const router = express.Router();
// Require user model
const User = require("../models/user.model");
//require event model
const Event = require("../models/Events.model");
// require moment.js
const momentTimezone = require("moment-timezone");
const moment = require("moment");
const axios = require("axios");
const nodemailer = require("nodemailer");
const Token = require("../models/Token.model");
const randomToken = require("random-token");
const checkVerifiedUser = require("../helpers/middlewares").checkVerifiedUser;

//fetch the data from database when loading the calender
router.get("/data", (req, res) => {
  let dataToClientSide = [];
  Event.find().then((dataToSend) => {
    dataToSend.forEach((e) => {
      let utcTime = moment.utc(e.start_date);
      let localTime = utcTime.local();
      e.start_date = localTime;
    });
    dataToSend.forEach((e) => {
      if (e.attendList.includes(req.user.id)) {
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
    Event.findOne({
      id: req.body.id
    }).then((event) => {
      if ((req.user.id).localeCompare(event._userId) === 0) {
        event.text = req.body.text
        event.start_date = req.body.start_date
        event.end_date = req.body.end_date
        event.sentReminder = false
        event.save();
        update_response();
      } else {
        mode = "error";
        update_response();
      }
    });
    // delete an event
  } else if (mode == "deleted") {
    Event.findOne({
      id: req.body.id,
    }).then((event) => {
      if ((req.user.id).localeCompare(event._userId) === 0) {
        event.delete();
        update_response();
      } else {
        event.attendList.pull(
          (req.user.id)
        ), event.save();
        update_response();
      }
    });
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
router.get("/personalAccount", checkVerifiedUser, (req, res) => {
  let userEmail = req.user.email.split("@");
  let userName = userEmail[0];
  axios
    .get("http://ip-api.com/json")
    .then((response) => {
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
      res.render("auth/personalAccount", {
        user: req.user,
        zone: response.data,
        userName: userName,
      });
    });
});

module.exports = router;