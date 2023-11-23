//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs  = require('ejs');
const bodyParser = require('body-parser');
const mongoose  = require('mongoose');
//const encrypt = require('mongoose-encryption');
//const md5 = require('md5');
const bcrypt = require('bcrypt');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const app = express();
const port = 3000;
const saltRounds = 10;

//console.log(process.env.SECRET);

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended:true }));

app.use(session({
    secret: 'This is our little secret',
    resave: false,
    saveUninitialized: false
  }));

app.use(passport.initialize());
app.use(passport.session());



mongoose.connect('mongodb://localhost:27017/userDB');
const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());
//passport.serializeUser(User.serializeUser());
//passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
passport.deserializeUser(async (id, done) => {
    try {
        return done(null, await User.findById(id));
    } catch(error) {
        return done(error);
    } 
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get('/', function(req, res) {
    res.render("home");
    
});

app.get("/auth/google", 
  passport.authenticate("google", { scope: ["profile"] })
);

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get('/login', function(req, res) {
    res.render("login");
    
});

app.get('/register', function(req, res) {
    res.render("register");
    
});


app.get('/secrets', async function(req, res) {  
    try{
        const foundUser = await User.find({"secret":{$ne:null}});
        if (!foundUser) {
            console.log("No secret found!");
        }
        if (foundUser) {
            res.render("secrets", {userWithSecret : foundUser});
        }
    } catch(error){
        console.log(error);
    }
    
});

app.get('/logout', function(req, res) {
    req.logout(function(err) {
        if (err) { 
            return next(err); 
        }
        res.redirect('/');
    });
    
});

app.post('/register', function(req, res) {
    console.log(req.body);
    //console.log(req.body["username"]);
    User.register({username: req.body.username}, req.body.password, function(err, user) {
        if (err) { 
            console.log(err);
            res.redirect("/register");
         } else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
         }      
       
      });    
    
});


app.post('/login', async function(req, res) {
    //console.log(req.body);   
     
    const user = new User ({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            }); 
        }
    })
});



app.get('/submit', function(req, res) { 
    
    if(req.isAuthenticated()){
        res.render("submit");
    } else{
        //console.log('Not authenticated');
        res.redirect("/login");
    }    
    
});

app.post('/submit', async function(req, res) {   
    //console.log(req.body); 
    const submittedSecret = req.body.secret;  
    console.log(req.user.id);  
    try { //find email if it is match
        const foundUser = await User.findById({
            _id: req.user.id
        });

        if (foundUser) {            
            foundUser.secret = submittedSecret;
            foundUser.save().then(()=>{
                res.redirect("/secrets");
            }).catch((err)=>{
                console.log(err);
            })
            
        }

    }catch (error) {
        console.log(error);
    }
     
    
});




app.listen(port, ()=>{
    console.log(`Server running on port ${port}`);
})
  