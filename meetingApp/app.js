require("dotenv").config();

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const express = require("express");
const favicon = require("serve-favicon");
const hbs = require("hbs");
const mongoose = require("mongoose");
const logger = require("morgan");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/User.model");
const MongoStore = require("connect-mongo")(session);
const app_name = require("./package.json").name;
const debug = require("debug")(
  `${app_name}:${path.basename(__filename).split(".")[0]}`
);
const flash = require("connect-flash");
const momentTimezone = require("moment-timezone");
const moment = require("moment");
const nodemailer = require("nodemailer");
// Require user model
// const User = require("../models/User.model");
//require event model
const Event = require("./models/Events");
const cron = require("node-cron");
const app = express();

//mongoose
mongoose
  .connect("mongodb://localhost/meetingapp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then((x) => {
    console.log(
      `Connected to Mongo! Database name: "${x.connections[0].name}"`
    );
  })
  .catch((err) => {
    console.error("Error connecting to mongo", err);
  });

// Middleware Setup
app.use(logger("dev"));
app.use(bodyParser.json());

app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(flash());

app.use(cookieParser());

// express-session configuration
app.use(
  session({
    secret: "abc",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    }, // 1 day
    store: new MongoStore({
      mongooseConnection: mongoose.connection,
      resave: true,
      saveUninitialized: false,
      ttl: 24 * 60 * 60, // 1 day
    }),
  })
);

// associate user with a session // store the user into the session
passport.serializeUser((user, callback) => {
  callback(null, user._id);
});

// this happens on every single request (if the user is logged in // if user._id exists in the session)
// it makes the current user available as req.user
passport.deserializeUser((id, callback) => {
  User.findById(id)
    .then((user) => {
      callback(null, user);
    })
    .catch((error) => {
      callback(error);
    });
});
// passport localStrategy
passport.use(
  new LocalStrategy({
      usernameField: "email",
    },
    (email, password, callback) => {
      User.findOne({
          email,
        })
        .then((user) => {
          if (!user) {
            return callback(null, false, {
              message: "Incorrect email",
            });
          }
          if (!bcrypt.compareSync(password, user.password)) {
            return callback(null, false, {
              message: "Incorrect password",
            });
          }
          callback(null, user);
        })
        .catch((error) => {
          callback(error);
        });
    }
  )
);

// basic passport setup
app.use(passport.initialize());
app.use(passport.session());

// static engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.use(express.static(path.join(__dirname, "public")));
app.use(favicon(path.join(__dirname, "public", "images", "favicon.ico")));

// default value for title local
app.locals.title = "Meeting scheduler app";

const index = require("./routes/index.routes");
app.use("/", index);

const auth = require("./routes/auth.routes");
app.use("/", auth);

const personalAccount = require("./routes/personalAccount.routes");
app.use("/", personalAccount);


// email authorization
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.GMAIL_USERNAME,
//     pass: process.env.GMAIL_PASSWORD,
//   },
// });

// cron.schedule("* * * * *", function () {
//   Event.find().then((events) => {
//     let userId;
//     console.log("event", events);
//     console.log("new date", new Date());
//     events.forEach((e) => {
//       console.log("start day", typeof (e.start_date));
//       let date = new Date(e.start_date).toISOString();
//       let dateToCompareWithSecond = new Date();
//       let dateToCompareWithout = moment(dateToCompareWithSecond).seconds(0).milliseconds(0).toISOString();
//       console.log("outPut: dateToCompareWithout", dateToCompareWithout)
//       // let dateToCompare = dateToCompareWithout.getTime()
//       // console.log("outPut: dateToCompare", dateToCompare)

//       if (date == dateToCompareWithout) {
//         console.log("event", e);
//         userId = e._userId
//       }
//       return userId
//     });
//     console.log("userId", userId);
//     return userId
//   }).then((userId) => {
//     return User.findOne({
//       _id: userId
//     })
//   }).then((user) => {
//     console.log("user", user);
//     userEmail = user.email
//     let mailOptions = {
//       from: "ourmeetingapp@gmail.com",
//       to: userEmail,
//       subject: `Not a GDPR update ;)`,
//       text: `Hi there, this email was automatically sent by us`
//     };
//     transporter.sendMail(mailOptions, function (error, info) {
//       if (error) {
//         throw error;
//       } else {
//         console.log("Email successfully sent!");
//       }
//     });
//   })

// });

module.exports = app;