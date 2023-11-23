//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs  = require('ejs');
const bodyParser = require('body-parser');
const mongoose  = require('mongoose');
//const encrypt = require('mongoose-encryption');
//const md5 = require('md5');
const bcrypt = require('bcrypt');
//const session = require('express-session');
//const passport = require('passport');
//const passportLocalMongoose = require('passport-local-mongoose');


const app = express();
const port = 3000;
const saltRounds = 10;

//console.log(process.env.SECRET);

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended:true }));

// app.use(session({
//     secret: 'This is our little secret',
//     resave: false,
//     saveUninitialized: false,
//     cookie: { secure: true }
//   }));

// app.use(passport.initialize());
// app.use(passport.session());

let userLoggedIn = 0;

//console.log(md5('123456'));

mongoose.connect('mongodb://localhost:27017/userDB');
const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});

//userSchema.plugin(passportLocalMongoose);


//userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

//const secretSchema = {
    //email: String,
    ////secret: String
//};

const User = new mongoose.model('User', userSchema);
///const Secret = new mongoose.model('Secret', secretSchema);

//passport.use(User.createStrategy());
//passport.serializeUser(User.serializeUser());
//passport.deserializeUser(User.deserializeUser());


app.get('/', function(req, res) {
    res.render("home");
    
});

app.get('/login', function(req, res) {
    res.render("login");
    
});

app.get('/register', function(req, res) {
    res.render("register");
    
});

app.get('/logout', function(req, res) {
    
    res.render("home");
    
});

app.get('/submit', function(req, res) {    
    res.render("submit");
    
});

app.post('/register', function(req, res) {
    console.log(req.body);
    //console.log(req.body["username"]);
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        const newUser = new User({
            email: req.body.username,
           password: hash
        });
        
        newUser.save().then(()=>{
            res.render("secrets");
        }).catch((err)=>{
            console.log(err);
        })
    });
    
    
});


app.post('/login', async function(req, res) {
    //console.log(req.body);
    const username = req.body.username;
    const password = req.body.password;    
    
    try { //find email if it is match
        const foundUser = await User.findOne({
          email: username
        });
  
        if (!foundUser) {
            console.log("Email / Account Not Found!");
        }
  
        if (foundUser) {            
            bcrypt.compare(password, foundUser.password, function(err, result) {
                if(result == true){
                    res.render("secrets");
                    userLoggedIn = 1;
                }
            });
            //if (foundUser.password = password) {
                //res.render("secrets");
                //userLoggedIn = 1;
            //}
            //else{
                //console.log("Password Not Match");
            //}
            
            
        }
    } catch (error) {
        console.log(error);
    }
    
    
});

app.post('/submit', function(req, res) {   
    //console.log(req.body); 
    //const secrets = req.body.secret;
    
    res.render("home");
    
});




app.listen(port, ()=>{
    console.log(`Server running on port ${port}`);
})
  