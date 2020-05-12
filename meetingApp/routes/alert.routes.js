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
    console.log("events", req.body.events);
    console.log("alertOption", req.body.alertOption);

    Event.findOne({
        _id: req.body.events
    }).then((event) => {
        console.log("event", event.start_date);
        let remindTime;
        switch (req.body.alertOption) {
            case "day":
                console.log("day");
                remindTime = moment(event.start_date).subtract(1, "day");
                break;
            case "hour":
                console.log("hour");
                remindTime = moment(event.start_date).subtract(6, "hour");
                break;
            case "days":
                console.log("days");
                remindTime = moment(event.start_date).subtract(2, "day")
                break;
        }
        event.remindTime = remindTime;
        event.save()
        res.redirect("/personalAccount")
    })

});


module.exports = router;