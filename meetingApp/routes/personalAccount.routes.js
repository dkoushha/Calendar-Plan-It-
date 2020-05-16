const express = require("express");
const router = express.Router();
// Require user model
const User = require("../models/user.model");
//require event model
const Event = require("../models/Events.model");
const Alarm = require("../models/alarm.model");

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
      let localTime = moment.utc(e.start_date).local();
      let utcTimeEnd = moment.utc(e.end_date).local();
      e.start_date = localTime;
      e.end_date = utcTimeEnd
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
      id: req.body.id,
    }).then((event) => {
      if (req.user.id.localeCompare(event._userId) === 0) {
        event.text = req.body.text;
        event.start_date = req.body.start_date;
        event.end_date = req.body.end_date;
        event.sentReminder = false;
        return event.save().then(() => {
          update_response();
        })
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
      if (req.user.id.localeCompare(event._userId) === 0) {
        return event.delete().then(() => {
          update_response();
        })
      } else {
        event.attendList.pull(req.user.id), event.save();
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
  let userEvents = [];
  let userInvitedEvent = [];
  Event.find().then((dataToSend) => {
    //console.log('Data',dataToSend);
    dataToSend.forEach((e) => {
      //console.log(e._userId);
      if (e._userId == req.user.id) {
        userEvents.push(e);
        console.log("outPut: userEvents", userEvents);
      } else if (e.attendList.length > 1 && e.attendList.includes(req.user.id)) {
        console.log("e,id,0", e.attendList[0]);
        console.log("user id", e._userId);
        userInvitedEvent.push(e);
        console.log("outPut: userInvitedEvent", userInvitedEvent);
      }
    });
    res.render("auth/personalAccount", {
      userInvitedEvent: userInvitedEvent,
      userEvents: userEvents,
      userName: userName,
      user: req.user,
    });
  });
});

router.get("/eventPage/:id", (req, res) => {
  console.log("event id", req.params.id);
  Promise.all([
    Event.findOne({
      _id: req.params.id,
    })
    .populate("_userId")
    .populate("attendList"),
    Alarm.findOne({
      _eventId: req.params.id,
      _userId: req.user._id
    }),
  ]).then((response) => {
    let userName = req.user.email.split("@")[0];
    let userImg = req.user.image;
    let eventName = response[0].text;
    let eventStart = moment.utc(response[0].start_date).local().format("LLLL");
    let eventEnd = moment.utc(response[0].end_date).local().format("LLLL");
    let attendList = response[0].attendList;
    let hostName = attendList[0].email.split("@")[0];
    let hostImage = attendList[0].image;
    let attendeesImgs = [];
    let attendeesNames = [];
    let name;
    if (attendList.length > 1) {
      attendList.shift()
      console.log("outPut: attendList", attendList)
      attendList.map((e) => {
        attendeesImgs.push(e.image);
        name = e.email.split("@")[0];
        attendeesNames.push(name);
      });
    }
    let alarmDuration
    if (response[1]) {
      alarmDuration = response[1].duration
    } else {
      console.log("object");
    }
    res.render("auth/eventPage", {
      userName: userName,
      userImg: userImg,
      eventName: eventName,
      eventStart: eventStart,
      eventEnd: eventEnd,
      hostName: hostName,
      hostImage: hostImage,
      alarmDuration: alarmDuration,
      attendeesImgs: attendeesImgs,
      attendeesNames: attendeesNames,
    });
  });
})

module.exports = router;