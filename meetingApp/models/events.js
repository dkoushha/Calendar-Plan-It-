const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// const timeZone = require("mongoose-timezone");

const eventSchema = new Schema({
  _userId: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  text: {
    type: String,
  },
  start_date: {
    type: Date,
  },
  end_date: {
    type: Date,
  },
  id: {
    type: String,
  },
});

// eventSchema.plugin(timeZone, {
//   paths: ["start_date", "end_date"]
// });
const Event = mongoose.model("Event", eventSchema);
module.exports = Event;