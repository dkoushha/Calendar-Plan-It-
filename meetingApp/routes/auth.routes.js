const express = require("express");
const router = express.Router();
// Require user model
const User = require("../models/user.model");
// Require token model
const Token = require("../models/token");
const randomToken = require("random-token");
// Add bcrypt to encrypt passwords
const bcrypt = require("bcrypt");
const bcryptSalt = 10;
// Add passport
const passport = require("passport");
// add express-validation
const { validationResult } = require("express-validator");
// add middleware
const signUpValidation = require("../helpers/middlewares").signUpValidation;
// nodemailer
const nodemailer = require("nodemailer");
//axios
const axios = require("axios");
const URL = "http://localhost:3000/";

router.get("/signup", (req, res) => {
  res.render("auth/signup");
});

router.post("/signup", signUpValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render("auth/signup", {
      errors: errors.array(),
    });
  }
  const salt = bcrypt.genSaltSync(bcryptSalt);
  const hashPass = bcrypt.hashSync(req.body.password, salt);
  let user = new User({
    email: req.body.email,
    password: hashPass,
  });
  user.save();
  // .then((theSignedUpUser) => {
  //     req.login(theSignedUpUser, () => res.send("you are logged in"));
  // });
  const token = new Token({
    _userId: user._id,
    token: randomToken(16),
  });
  console.log(token);
  token.save();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USERNAME,
      pass: process.env.GMAIL_PASSWORD,
    },
  });
  const mailOptions = {
    from: "topalian.noubar@gmail.com",
    to: user.email,
    subject: "Account Verification Token",
    text:
      "Hello,\n\n" +
      "Please verify your account by clicking the link: \nhttp://" +
      req.headers.host +
      "/confirmations/" +
      token.token +
      ".\n",
  };
  transporter.sendMail(mailOptions, function (err) {
    if (err) {
      return res.send({
        msg: err.message,
      });
    }
    res.send("A verification email has been sent to " + user.email + ".");
  });
});

//
router.get("/confirmations/:token", (req, res) => {
  Token.findOne({
    token: req.params.token,
  }).then((token) => {
    User.findOne({
      _id: token._userId,
    }).then((user) => {
      user.isVerified = true;
      console.log(user.isVerified);
      user.save();
      req.login(user, () =>
        res.render("auth/personalAccount", {
          user: user,
        })
      );
    });
  });
});

//Login
router.get("/login", (req, res) => {
  res.render("auth/login", { errorArr: req.flash("error") });
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/private-page",
    failureRedirect: "/login",
    failureFlash: true,
    passReqToCallback: true,
  })
);
//Logout
router.get("/logout", (req, res) => {
  req.logOut();
  res.render("auth/logout");
});

router.get("/private-page", (req, res) => {
  //console.log(req.user);
  //API Key:EUU8LOIMTSKG
  axios
    .get(
      "http://api.timezonedb.com/v2.1/list-time-zone?key=EUU8LOIMTSKG&format=json"
    )
    .then((response) => {
      let zoneName=[];
      response.data.zones.forEach((elem) => {
          zoneName.push(elem.zoneName) 
      });
      
      console.log(zoneName[0]);
      axios.get('http://api.timezonedb.com/v2.1/get-time-zone?key=EUU8LOIMTSKG&format=json&by=zone&zone='+ zoneName[0])
        .then((resp)=>{
          console.log(resp.data);
          res.render("auth/personalAccount", {
            user: req.user,
            data: response.data,
            zone: resp.data
          });
        })
      // res.render("auth/personalAccount", {
      //   user: req.user,
      //   data: response.data
      // });
    }); 
});


module.exports = router;
