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
    Event.findOne({
        _id: req.body.events
    }).then((event) => {
        console.log("event", event.start_date);
        let remindTime;
        switch (req.body.alertOption) {
            case "1-day":
                console.log("day");
                remindTime = moment(event.start_date).subtract(1, "day");
                break;
            case "6-hours":
                console.log("hour");
                remindTime = moment(event.start_date).subtract(6, "hour");
                break;
            case "2-days":
                console.log("days");
                remindTime = moment(event.start_date).subtract(2, "day")
                break;
        }
        event.remindTime = remindTime;
        console.log("text", event.text);
        console.log(typeof (event.text));
        let newTextarea = event.text.split("&")
        console.log("outPut: newTextarea", newTextarea[0])
        event.text = `${newTextarea[0]} &#x23F0 ${req.body.alertOption} `
        event.save()
    }).then(() => {
        res.redirect("/personalAccount")
    })
});


module.exports = router;