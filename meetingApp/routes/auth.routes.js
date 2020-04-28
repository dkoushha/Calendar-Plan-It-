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
    from: "dimayounis9@gmail.com",
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
        res.render("personalAccount", {
          user: user,
        })
      );
    });
  });
});

module.exports = router;
