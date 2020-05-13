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
    res.render("auth/alert-invite", {
        events: dataToClientSide
    });
    //res.render('auth/invite')
});

router.post("/invite", (req, res) => {
    let userEmail = (req.user.email).split("@");
    let userName = userEmail[0];
    let usersIdArr = []
    console.log("req.body", req.body.email);
    User.find({
            email: req.body.email
        })
        .then((users) => {
            console.log("users", users);
            users.map((user) => usersIdArr.push(user._id))
            const token = new Token({
                _eventId: req.body.event,
                _userId: req.user.id,
                invitedUserId: usersIdArr,
                token: randomToken(16),
            });
            return Promise.all([token.save(), Event.findOne({
                _id: req.body.event
            })])
        }).then((response) => {
            console.log("array", response);
            let token = response[0];
            let event = response[1];
            let eventStart = moment.utc(event.start_date).local().format("LLLL");
            let eventEnd = moment.utc(event.end_date).local().format("LLLL");
            const mailOptions = {
                from: "ourmeetingapp@gmail.com",
                to: req.body.email,
                subject: "Invitation Token",
                html: `<p>Hi there,<br>You've been invited by <b>${userName}</b> to an event<b> ${event.text} on ${eventStart} to ${eventEnd}</b><br>
                To accept this invitation, simply click below.</p><br>
                <a href= "http://${req.headers.host}/invitationConfirmation/${token.token}"><b>I accept</b><a><br>
                <h6>Enjoy<br>
                The Plan-It Team</h6>
                `
            };
            transporter.sendMail(mailOptions, function (err) {
                if (err) {
                    return res.send({
                        msg: err.message,
                    });
                }
                res.render("auth/invitationConfirmation", {
                    inviteEmail: req.body.email,
                });
            });
        });
});


router.get("/invitationConfirmation/:token", (req, res) => {
    console.log(req.params.token);
    Token.findOne({
            token: req.params.token
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

            return Event.findOneAndUpdate({
                _id: token._eventId
            }, {
                $addToSet: {
                    attendList: token.invitedUserId
                }
            }, {
                new: true
            })
        }).then(() => {
            res.redirect("/");
        })
});
module.exports = router;