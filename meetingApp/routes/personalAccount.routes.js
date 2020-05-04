const express = require("express");
const router = express.Router();
// Require user model
const User = require("../models/user.model");
const Event = require("../models/events");


// fetch the data from database when loading the calender
router.get("/data", function (req, res) {
    Event.find().then((dataToSend) => {
        dataToSend.forEach((e) => {
            e.id = e._id;
            return e
        });
        console.log("outPut: dataToSend", dataToSend);
        res.send(dataToSend);
    });
});

// add delete edit the events to database
router.post("/data", (req, res) => {
    let data = req.body;
    console.log('data', data);
    let mode = data["!nativeeditor_status"];
    console.log("outPut: mode", mode)
    let sid = data.id;
    console.log("outPut: sid", sid)
    let tid = sid;
    console.log("outPut: tid", tid)

    function update_response(err) {
        if (err) mode = "error";
        else if (mode == "inserted") {
            tid = data._id;
            console.log("outPut: functionupdate_response -> tid", tid)
        }
        res.setHeader("Content-Type", "application/json");
        res.send({
            action: mode,
            sid: sid,
            tid: String(tid)
        });
    }

    if (mode == "updated") {
        Event.findByIdAndUpdate({
            _id: req.body.id,
        }, {
            text: req.body.text,
            start_date: req.body.start_date,
            end_date: req.body.end_date,
        }, update_response);
    } else if (mode == "deleted") {
        Event.deleteOne({
            _id: req.body.id
        }, update_response);
    } else if (mode == "inserted") {
        let event = new Event({
            id: req.body.id,
            text: req.body.text,
            start_date: req.body.start_date,
            end_date: req.body.end_date,
        });
        event.save()

    } else res.send("Not supported operation");
});

module.exports = router;