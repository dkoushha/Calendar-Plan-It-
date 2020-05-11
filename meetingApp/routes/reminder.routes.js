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
//     Event.find().populate("attendList").then((events) => {
//         console.log("event", events);
//         events.forEach((e) => e.attendList)
//         let userIds = []
//         events.forEach((e) => {
//             let date = moment.utc(e.start_date).seconds(0).milliseconds(0);
//             console.log("outPut: date", date)
//             let dateToCompareWithSecond = new Date();
//             let dateToCompare = moment.utc(dateToCompareWithSecond).seconds(0).milliseconds(0);
//             console.log("outPut: dateToCompareWithout", dateToCompare)
//             if ((date.isSame(dateToCompare, "second") || date.isBefore(dateToCompare, "second")) && !e.sentReminder) {
//                 console.log("event remind", e.sentReminder);
//                 userIds.push(...e.attendList);
//                 e.sentReminder = true;
//                 console.log("event remind", e.sentReminder);
//                 e.save()
//             }
//         });
//     })
// })
//     console.log("userIds", userIds);
//     let userIdsToUse = []
//     if (userIds.length >= 0) {
//         userIds.forEach((id) => {
//             userIdsToUse.push(new mongoose.Types.ObjectId(id))
//             return userIdsToUse
//         });
//         console.log("user id to use", userIdsToUse);
//     }
//     return User.find({
//         _id: {
//             $in: userIdsToUse
//         }
//     })
// })
// .then((users) => {
//     console.log("users", users);
//     let mailList = "";
//     users.forEach((user) => {
//         mailList += user.email + ','
//         console.log("userId", user._id);
//     })
//     console.log("mailList", mailList);
//     let mailOptions = {
//         from: "ourmeetingapp@gmail.com",
//         to: mailList,
//         subject: `reminder email`,
//         text: `Hi there, this email was automatically sent by us`
//     };
//     transporter.sendMail(mailOptions, function (error, info) {
//         if (error) {
//             console.log("error", error);
//         } else {
//             console.log("Email successfully sent!");
//         }
//     });
// });
// });

module.exports = router;