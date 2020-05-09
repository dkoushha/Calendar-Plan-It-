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


//email authorization
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USERNAME,
        pass: process.env.GMAIL_PASSWORD,
    },
});

cron.schedule("* * * * *", function () {
    Event.find().then((events) => {
        let userId;
        console.log("event", events);
        console.log("new date", new Date());
        events.forEach((e) => {
            console.log("start day", typeof (e.start_date));
            let date = new Date(e.start_date).toISOString();
            let dateToCompareWithSecond = new Date();
            let dateToCompareWithout = moment(dateToCompareWithSecond).seconds(0).milliseconds(0).toISOString();
            console.log("outPut: dateToCompareWithout", dateToCompareWithout)

            if (date == dateToCompareWithout) {
                console.log("event", e);
                userId = e._userId
            }
        });
        console.log("userId", userId);
        userId

        return User.findOne({
            _id: userId
        })
    }).then((user) => {
        console.log("user", user);
        userEmail = user.email
        let mailOptions = {
            from: "ourmeetingapp@gmail.com",
            to: userEmail,
            subject: `reminder email`,
            text: `Hi there, this email was automatically sent by us`
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                throw error;
            } else {
                console.log("Email successfully sent!");
            }
        });
    })

});

module.exports = router;