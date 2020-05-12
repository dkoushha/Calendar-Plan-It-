const express = require("express");
const router = express.Router();
// Require user model
const User = require("../models/User.model");
//require event model
const Event = require("../models/Events");
// require moment.js
const momentTimezone = require("moment-timezone");
const moment = require("moment");

router.get("/invite", (req, res) => {
    res.render("auth/alert-invite");
});


router.post("/reminder", (req, res) => {
    console.log("what i need to see", req.body);
    // User.findOne({
    //         email: req.body.email
    //     })
    //     .then((user) => {
    //         console.log("Invited user ID", user._id);
    //         return user;
    //     })
    //     .then((user) => {
    //         const token = new Token({
    //             _eventId: req.body.event,
    //             _userId: req.user.id,
    //             invitedUserId: user._id,
    //             token: randomToken(16),
    //         });
    //         token.save();
    //         console.log("token wiht invited user ID", token);
    //         const mailOptions = {
    //             from: "ourmeetingapp@gmail.com",
    //             to: req.body.email,
    //             subject: "Invitation Token",
    //             text: "Hello,\n\n" +
    //                 `Please verify your invitation made by ${req.user.email} and clicking the link: \nhttp://` +
    //                 req.headers.host +
    //                 "/invitationConfirmation/" +
    //                 token.token +
    //                 ".\n",
    //         };

    //         transporter.sendMail(mailOptions, function (err) {
    //             if (err) {
    //                 return res.send({
    //                     msg: err.message,
    //                 });
    //             }
    //             let inviteEmail = req.body.email;
    //             res.render("auth/invitationConfirmation", {
    //                 inviteEmail: inviteEmail,
    //             });
    //         });
    //     });
    res.send("worked")
});


module.exports = router;