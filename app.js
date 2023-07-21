///jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
//const TwitterStrategy = require('passport-twitter').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const GitHubStrategy = require('passport-github').Strategy;
const findOrCreate = require('mongoose-findorcreate')

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  facebookId: String,
  //twitterId: String,
  linkedinId: String,
  githubId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username });
  });
});
passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// passport.use(new TwitterStrategy({
//     consumerKey: process.env.TWITTER_CONSUMER_KEY,
//     consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
//     callbackURL: "http://127.0.0.1:3000/auth/twitter/secrets"
//   },
//   function(token, tokenSecret, profile, cb) {
//     User.findOrCreate({ twitterId: profile.id }, function (err, user) {
//       return cb(err, user);
//     });
//   }
// ));

passport.use(new LinkedInStrategy({
    clientID: process.env.LINKEDIN_API_KEY,
    clientSecret: process.env.LINKEDIN_SECRET_KEY,
    callbackURL: "http://127.0.0.1:3000/auth/linkedin/secrets"
  },
  function(token, tokenSecret, profile, done) {
    User.findOrCreate({ linkedinId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));


passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://127.0.0.1:3000/auth/github/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ githubId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));


  app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/secrets');
    });

    app.get('/auth/facebook',
      passport.authenticate('facebook'));

    app.get('/auth/facebook/secrets',
      passport.authenticate('facebook', { failureRedirect: '/login' }),
      function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
      });

//       app.get('/auth/twitter', passport.authenticate('twitter', { scope: ['profile'] }));
//
// app.get('/auth/twitter/secrets',
//   passport.authenticate('twitter', { failureRedirect: '/login' }),
//   function(req, res) {
//     // Successful authentication, redirect home.
//     res.redirect('/secrets');
//   });

      app.get('/auth/linkedin',
  passport.authenticate('linkedin'));

app.get('/auth/linkedin/secrets',
  passport.authenticate('linkedin', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

      app.get('/auth/github',
  passport.authenticate('github'));

app.get('/auth/github/secrets',
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/",(req,res)=>{
  res.render("home");
});

app.get("/login",(req,res)=>{
  res.render("login");
});

app.get("/register",(req,res)=>{
  res.render("register");
});

app.get("/secrets",(req,res)=>{
  if(req.isAuthenticated()){
    res.render("secrets");
  }else{
    res.redirect("/login");
  }
});

app.get("/logout",(req,res)=>{
  res.render("home");
});

app.post("/register",(req,res)=>{
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, ()=>{
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/login",(req,res)=>{

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

req.login(user,(err)=>{
  if (err){
    console.log(err);
  }else{
    passport.authenticate("local")(req, res, ()=> {
      res.redirect("/secrets");
    });
   }
 });
});

app.listen(3000,()=>console.log("Server started on port 3000!"));
