const mongoose = require('mongoose');
const User = require('../models/user');

mongoose.connect(`mongodb://localhost/meetingApp`, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const users = [{
    email: "dima",
    password: "12345",

}];

User.create(users).then(() => {
    console.log(`Created ${users.length} user`);
    mongoose.connection.close();
});