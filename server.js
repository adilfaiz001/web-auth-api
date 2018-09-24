const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const vhost = require('vhost');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('express-flash');
const emailVarifier = require('email-verify');


const ServerConfig = require('./config.json');
const Hasher = require('./util/PasswordHasher');

const master = express();
const homepage = express();     //homepage
const account = express();      //account

const SignupWorker = require('./util/SignupWorker');
const LoginWorker = require('./util/LoginWorker');
const forgetPasswordWorker = require('./util/forgetPasswordWorker');
const resetWorker = require('./util/resetWorker');
const firebase = require('./util/database');

var urlencodedParser = bodyParser.urlencoded({extended : true});



//================================Middleware==================================//
homepage.set('views',path.join(__dirname,'homepage'));
account.set('views',path.join(__dirname,'account'));

homepage.set('view engine','ejs');
account.set('view engine','ejs');

homepage.use(express.static(path.join(__dirname,'homepage')));
account.use(express.static(path.join(__dirname,'account')));

homepage.use(bodyParser.urlencoded({extended:true}));
account.use(bodyParser.urlencoded({extended:true}));

account.locals.moment = require('moment');

account.use(cookieParser('secret'));



account.use(session({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));
account.use(flash());

account.use(function(req, res, next){
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

//===============================================================================//






//================================Routes=========================================//


master.listen(3000,()=>{
  console.log("Server Running........");
});


//--------------------------------Homepage---------------------------------------//
homepage.get('/',(req,res)=>{
  res.render('index');
});

homepage.get('/signup',(req,res)=>{
  res.set({
    'Access-Control-Allow-Origin' : '*'
  });
  res.render('signup');
});

homepage.post('/signupWorker',(req,res)=>{

    let params = getParameters(req);

    SignupWorker.CreateNewUser({
      "name" : params.name,
      "phone" : params.phone,
      "email" : params.email,
      "password" : params.password
    }).then( _res => {
      if(_res.success===true){
        res.status(200).json({
          "state" : "SUCCESS",
          "uid" : _res.uid,
          "hash" : _res.hash
        });
      }
      else {
        res.status(200).json({"state" : _res.error});
      }
    });
});


//=============================Account=======================================//

account.get('/',(req,res)=>{
  let uid = req.query.uid;
  res.render('index',{uid:uid});
});

account.get('/login',(req,res)=>{
  res.render('login');
});

account.get('/forget',(req,res)=>{
  res.render('forget');
});

account.post('/loginWorker',(req,res)=>{

});

account.post('/resetPassword',(req,res,next)=>{
  forgetPasswordWorker.resetPassword(req,res,next);
});














//============================================================================//

//============================virtual host====================================//
master.use(vhost('homepage',homepage));
master.use(vhost('account',account));

//============================================================================//


//==========================Utility Function==================================//
function getParameters(request){
    url = request.url.split('?');
    var query = {
        "action" : url[0]
    };
    if(url.length>=2){
        url[1].split('&').forEach((q)=>{
            try{
                query[q.split('=')[0]] = q.split('=')[1];
            } catch(e) {
                query[q.split('=')[0]] = '';
            }
        })
    }
    return query;
}
