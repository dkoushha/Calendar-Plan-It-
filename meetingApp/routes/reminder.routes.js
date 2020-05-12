// const express = require("express");
// const router = express.Router();
// // Require user model
// const User = require("../models/User.model");
// //require event model
// const Event = require("../models/Events");
// // require moment.js
// const momentTimezone = require("moment-timezone");
// const moment = require("moment");
// const nodemailer = require("nodemailer");
// const cron = require("node-cron");
// const mongoose = require("mongoose");

// //email authorization
// const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//         user: process.env.GMAIL_USERNAME,
//         pass: process.env.GMAIL_PASSWORD,
//     },
// });

// cron.schedule("* * * * *", function () {
//     Event.find()
//         .populate("attendList")
//         .then((events) => {
//             console.log("event", events);
//             events.forEach((e) => {
//                 console.log("e", e);
//                 let reminderDate = moment.utc(e.start_date).seconds(0).milliseconds(0);
//                 console.log("outPut: date", reminderDate);
//                 let dateToCompare = moment
//                     .utc(new Date)
//                     .seconds(0)
//                     .milliseconds(0);
//                 // let tryTime = moment(reminderDate).subtract(3, "hour");
//                 // console.log("outPut: tryTime", tryTime)

//                 console.log("outPut: dateToCompareWithout", dateToCompare);
//                 if (
//                     (reminderDate.isSame(dateToCompare, "second") ||
//                         reminderDate.isBefore(dateToCompare, "second")) &&
//                     !e.sentReminder
//                 ) {
//                     let userEmails = e.attendList.map(e => e.email)
//                     let mailList = userEmails.toString()
//                     console.log("outPut: mailList", mailList)
//                     e.sentReminder = true;
//                     console.log("event remind", e.sentReminder);
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


// module.exports = router;