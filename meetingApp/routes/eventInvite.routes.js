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

// email authorization
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USERNAME,
    pass: process.env.GMAIL_PASSWORD,
  },
});

router.post("/invite", (req, res) => {
  User.find({
    email: req.body.email,
  }).then((user) => {
    user.forEach((e) => {
      console.log("User ID", e._id);
      console.log("Invited user ID", user);
      const token = new Token({
        _eventId: req.body.event,
        _userId: req.user.id,
        invitedUserId: e._id,
        token: randomToken(16),
      });
      token.save().then(() => {
        const mailOptions = {
          from: "ourmeetingapp@gmail.com",
          to: e.email,
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
        });
      });
    });
    res.render("auth/invitationConfirmation");
  });
});

router.get("/invitationConfirmation/:token", (req, res) => {
  console.log(req.params.token);
  Token.findOne({
    token: req.params.token,
  })
    .then((token) => {
      console.log("This is the token", token);
      let inviteInfoAndEventInfo = [];
      // token.forEach((e) => {
      console.log("Invited User:", token.invitedUserId);
      inviteInfoAndEventInfo.push(token.invitedUserId);
      inviteInfoAndEventInfo.push(token._eventId);
      // });
      console.log("Invited user and Event", inviteInfoAndEventInfo);

      return Event.findOneAndUpdate(
        {
          _id: token._eventId,
        },
        {
          $addToSet: {
            attendList: token.invitedUserId,
          },
        },
        {
          new: true,
        }
      );
    })
    .then(() => {
      console.log("User pushed to attendlist");
      res.render("auth/signupForm");
    });
});
module.exports = router;
