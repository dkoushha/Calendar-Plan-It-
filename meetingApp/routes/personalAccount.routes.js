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

//fetch the data from database when loading the calender
router.get("/data", function (req, res) {
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

// add delete edit the events to database
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
    res.setHeader("Content-Type", "application/json");
    res.send({
      action: mode,
      sid: sid,
      tid: String(tid),
    });
  }
  // edit an event
  if (mode == "updated") {
    Event.findOneAndUpdate(
      {
        id: req.body.id,
      },
      {
        text: req.body.text,
        start_date: req.body.start_date,
        end_date: req.body.end_date,
      },
      {
        new: true,
      },
      update_response
    );
    // delete an event
  } else if (mode == "deleted") {
    Event.findOneAndDelete(
      {
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
router.get("/personalAccount", (req, res) => {
  axios.get("http://ip-api.com/json").then((response) => {
    console.log("Latitude: ", response.data.lat);
    console.log("Longitude", response.data.lon);
    let userLat = response.data.lat;
    let userLon = response.data.lon;
    //API Key:EUU8LOIMTSKG
    axios
      .get(
        "http://api.timezonedb.com/v2.1/get-time-zone?key=EUU8LOIMTSKG&format=json&by=position&lat=" +
          userLat +
          "&lng=" +
          userLon
      )
      .then((response) => {
        // console.log(response.data);
        res.render("auth/personalAccount", {
          user: req.user,
          zone: response.data,
        });
      });
  });
});

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USERNAME,
    pass: process.env.GMAIL_PASSWORD,
  },
});

router.get("/invite", (req, res) => {
  console.log(req.user);
  let dataToClientSide = [];
  Event.find().then((dataToSend) => {
    //console.log('Data',dataToSend);
    dataToSend.forEach((e) => {
      //console.log(e._userId);
      if (e._userId == req.user.id) {
        dataToClientSide.push(e);
      }
    });
    console.log("Data to clint side", dataToClientSide);
  });

  res.render("auth/invitation", { events: dataToClientSide });
  //res.render('auth/invite')
});

router.post("/invite", (req, res) => {
  User.findOne({ email: req.body.email })
    .then((user) => {
      console.log("Invited user ID", user._id);
      return user;
    })
    .then((user) => {
      const token = new Token({
        _eventId: req.body.event,
        _userId: req.user.id,
        invitedUserId: user._id,
        token: randomToken(16),
      });
      token.save();
      console.log("token wiht invited user ID", token);
      const mailOptions = {
        from: "ourmeetingapp@gmail.com",
        to: req.body.email,
        subject: "Invitation Token",
        text:
          "Hello,\n\n" +
          `Please verify your invitation made by ${req.user.email} and clicking the link: \nhttp://` +
          req.headers.host +
          "/invitationConfirmation/" +
          token.token +
          ".\n",
      };

      transporter.sendMail(mailOptions, function (err) {
        if (err) {
          return res.send({
            msg: err.message,
          });
        }
        let userEmail = req.user.email;
        let inviteEmail = req.body.email;
        res.render("auth/invitationConfirmation", {
          userEmail: userEmail,
          inviteEmail: inviteEmail,
        });
      });
    });
});

router.get("/invitationConfirmation/:token", (req, res) => {
  console.log(req.params.token);
  Token.findOne({ token: req.params.token })
    .then((token) => {
      console.log("This is the token", token);
      let inviteInfoAndEventInfo = [];
      // token.forEach((e) => {
      console.log("Invited User:", token.invitedUserId);
      inviteInfoAndEventInfo.push(token.invitedUserId);
      inviteInfoAndEventInfo.push(token._eventId);
      // });
      console.log("Invited user and Event", inviteInfoAndEventInfo);

      return Event.findOneAndUpdate({ _id: token._eventId }, { $addToSet: { attendList: token.invitedUserId }},{new:true})
    }).then(() => {
        console.log('User pushed to attendlist');
        res.send("Token confirmation");
    })
    
  // let promise2 = Event.findOne({ _id: eventId });
  // // .then(() => {
  // //   //event.attendList.push(user._id);
  // //   //console.log('Attendind list of event',event.attendList);
  // // });
  // Promise.all([promise1, promise2]).then((userAndEvent) => {
  //   console.log("Invited User", userAndEvent);
  //   userAndEvent.forEach((e) => {
  //     if (e.attendList) {
  //       console.log("Attending List:", e.attendList);
  //     }
  //   });
  // });

  
});
module.exports = router;
