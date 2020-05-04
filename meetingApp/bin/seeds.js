// const mongoose = require('mongoose');
// const User = require('../models/user');

// mongoose.connect(`mongodb://localhost/meetingApp`, {
//     useCreateIndex: true,
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// });

// const users = [{
//     email: "dima",
//     password: "12345",

// }];

// User.create(users).then(() => {
//     console.log(`Created ${users.length} user`);
//     mongoose.connection.close();
// });


const mongoose = require('mongoose');
const Event = require('../models/events');

mongoose.connect(`mongodb://localhost/meetingApp`, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const events = [{
    text: "Some Helpful event",
    start_date: new Date(2020, 8, 1),
    end_date: new Date(2020, 8, 5)

}, {
    text: "Another Cool Event",
    start_date: new Date(2020, 8, 11),
    end_date: new Date(2020, 8, 11)

}];

Event.create(events).then(() => {
    console.log(`Created ${events.length} user`);
    mongoose.connection.close();
});