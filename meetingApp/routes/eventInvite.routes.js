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

    res.render("auth/invitation", {
        events: dataToClientSide
    });
    //res.render('auth/invite')
});

router.post("/invite", (req, res) => {
    console.log("req.body", req.body.email);
    User.findOne({
            email: req.body.email
        })
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
                text: "Hello,\n\n" +
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
                let inviteEmail = req.body.email;
                res.render("auth/invitationConfirmation", {
                    inviteEmail: inviteEmail,
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
            console.log('User pushed to attendlist');
            res.send("Token confirmation");
        })
});
module.exports = router;