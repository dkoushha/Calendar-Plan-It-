const express = require("express");
const router = express.Router();
// Require user model
const User = require("../models/User.model");
//require event model
const Event = require("../models/Events");
// require moment.js
const momentTimezone = require("moment-timezone");
const moment = require("moment");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const mongoose = require("mongoose");

//email authorization
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USERNAME,
        pass: process.env.GMAIL_PASSWORD,
    },
});

// cron.schedule("* * * * *", function () {
//     Event.find()
//         .populate("attendList")
//         .then((events) => {
//             events.forEach((e) => {
//                 let reminderDate = moment.utc(e.remindTime).seconds(0).milliseconds(0);
//                 let dateToCompare = moment
//                     .utc(new Date)
//                     .seconds(0)
//                     .milliseconds(0);
//                 if (
//                     (reminderDate.isSame(dateToCompare, "second") ||
//                         reminderDate.isBefore(dateToCompare, "second")) &&
//                     !e.sentReminder
//                 ) {
//                     let userEmails = e.attendList.map(e => e.email)
//                     let mailList = userEmails.toString()
//                     e.sentReminder = true;
//                     let eventDate = moment.utc(e.start_date).local().format("LLLL");
//                     let mailOptions = {
//                         from: "ourmeetingapp@gmail.com",
//                         to: mailList,
//                         subject: `reminder email`,
//                         text: `Hi there, this email was automatically sent to you as 
//                         a reminder for the event name ${e.text} on ${eventDate}`
//                     };
//                     transporter.sendMail(mailOptions, function (error, info) {
//                         if (error) {
//                             console.log("error", error);
//                         } else {
//                             console.log("Email successfully sent!");
//                         }
//                     });
//                     e.save();
//                 }
//             });
//         });
// });


module.exports = router;