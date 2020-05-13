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
        dataToClientSide.map((event) => {
            let eventText = event.text.split("&");
            event.text = eventText[0]
            return event.text
        })
    });
    res.render("auth/alert-invite", {
        events: dataToClientSide
    });
    //res.render('auth/invite')
});

router.post("/invite", (req, res) => {
    let userEmail = (req.user.email).split("@");
    let userName = userEmail[0];
    let invitedUserEmail;
    console.log("req.body", req.body.email);
    User.find({
            email: req.body.email
        })
        .then((users) => {
            console.log("users", users);
            users.forEach((user) => {
                console.log("outPut: user", user)
                invitedUserEmail = user.email
                const token = new Token({
                    _eventId: req.body.event,
                    _userId: req.user.id,
                    invitedUserId: user._id,
                    token: randomToken(16),
                });
                return Promise.all([token.save(), Event.findOne({
                    _id: req.body.event
                })]).then((response) => {
                    console.log("array", response);
                    let token = response[0];
                    let event = response[1];
                    console.log("outPut: event", event)
                    let newTextarea = event.text.split("&")
                    let eventStart = moment.utc(event.start_date).local().format("LLLL");
                    let eventEnd = moment.utc(event.end_date).local().format("LLLL");
                    const mailOptions = {
                        from: "ourmeetingapp@gmail.com",
                        to: invitedUserEmail,
                        subject: "Invitation Token",
                        html: `<p>Hi there,<br>You've been invited by <b>${userName}</b> to an event<b> ${newTextarea[0]} on ${eventStart} to ${eventEnd}</b><br>
                To accept this invitation, simply click below.</p><br>
                <a href= "http://${req.headers.host}/invitationConfirmation/${token.token}"><b>I accept</b><a><br>
                <h4>Enjoy<br>
                The Plan-It Team</h4>
                `
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
            res.render("auth/invitationConfirmation", {
                inviteEmail: req.body.email,
            });
        });
});


router.get("/invitationConfirmation/:token", (req, res) => {
    console.log(req.params.token);
    Token.findOne({
            token: req.params.token
        }).populate("_userId").populate("invitedUserId").populate("_eventId")
        .then((token) => {
            console.log("This is the token", token);
            console.log("user email", token._userId.email);
            let invitedUserEmail = (token.invitedUserId.email).split("@");
            let invitedUserName = invitedUserEmail[0];
            let event = token._eventId.text;
            let newTextarea = event.split("&")
            const mailOptions = {
                from: "ourmeetingapp@gmail.com",
                to: token._userId.email,
                subject: "Invitation Token",
                html: `<p>Hi there, ${invitedUserName} has accepted your invitation for the ${newTextarea[0]} event .</p><br>
        <h4>Enjoy<br>
        The Plan-It Team</h4>
        `
            };
            transporter.sendMail(mailOptions, function (err) {
                if (err) {
                    return res.send({
                        msg: err.message,
                    });
                }
            });
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
        });
});


module.exports = router;