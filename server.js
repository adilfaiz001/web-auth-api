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



//----------------------------Password Reset-----------------------------------//
account.get('/forget',(req,res)=>{
    res.render('forget');
});

account.post('/resetPassword',(req,res,next)=>{
    forgetPasswordWorker.resetPassword(req,res,next);
});

account.get('/reset/:token',(req,res)=>{

    var userData = firebaseSignup.firebase.database();
    var timestamp = Date.now();

    userData.ref().child('users').orderByChild('resetPasswordToken').equalTo(req.params.token).limitToFirst(1).once('value',(userch)=>{

        if (userch.val()===null)
        {
            console.log("Invalid token");
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forget');
        }
        else if(userch.val().resetPasswordExpires<timestamp){
            console.log('Token Expires');
            req.flash('error','Password reset token expires');
            return res.redirect('/forget');
        }
        else {
            console.log("Success! Render to reset page");
            res.render('reset', {token: req.params.token});
        }
        //console.log(userch.val().resetPasswordExpires+"   "+timestamp);
    });
});

account.post('/reset/:token',(req,res)=>{

    console.log(req.params.token);
    console.log(req.body.password+'  '+req.body.confirm);

    resetWorker.resetPassword(req,res);
});

//-----------------------------------------------------------------------------//




account.post('/sessionsWorker', (req, res) => {
    let params = getParameters(req);
    SessionsWorker.BookSession({
        "uid" : params.uid,
        "phone" : params.phone,
        "name" : decodeURI(params.name),
        "location" : params.location,
        "duration" : params.duration,
        "device" : params.device
    }).then( _res => {
        if(_res.success===true){
            res.status(200).json({
                "state" : "SUCCESS",
                "sid" : _res.sid,
                "startDate" : _res.startDate
            });
            console.log(`\nNEW SESSION ADDED => \n\t- sid: ${_res.sid} \n\t- phone: ${params.phone}`);
        } else {
            res.status(500).json({"state" : "FAILED"});
        }
    }).catch((err)=>{
        console.log('\n'+err+'\n');
        res.status(500).send(err);
    });
});
account.post('/userCancelSession', (req, res)=> {
    let params = getParameters(req);
    SessionsWorker.CancelSession(params.sid, params.exp).then((_res)=>{
        if(_res.success===true){
            res.status(200).json({
                "state" : "SUCCESS"
            });
        } else {
            res.status(200).json({"state" : "NO-USER"});
        }
    });
});
account.post('/userCancelActiveSession', (req, res)=> {
    let params = getParameters(req);
    // SessionsWorker.CancelSession(params.sid).then((_res)=>{
    //     if(_res.success===true){
    //         res.status(200).json({
    //             "state" : "SUCCESS"
    //         });
    //     } else {
    //         res.status(200).json({"state" : "NO-USER"});
    //     }
    // });
    SessionsWorker.ExpireSession(params.sid).then((_res)=>{
        if(_res.success===true){
            res.status(200).json({
                "state" : "SUCCESS"
            });
        } else {
            res.status(200).json({"state" : "NO-USER"});
        }
    });
});

//---------------------------referral--------------------------------//
const referLink = require('./util/referralWorker');

account.get('/referral/:user',(req,res)=>{
    var url;

    if((req.params.user !== 'undefined'))
    {
        referLink.getLink(req.params.user).then((_res)=>{
            if (_res.status === true)
            {
                url = _res.url;
            }
            res.render('referral',{user:req.params.user,referLink:url});
        });


    }
    else if (req.params.user === 'undefined')
    {
        res.redirect('http://homepage:3000/signup');
    }
    else
    {
        res.redirect('http://homepage:3000/signup');
    }

});


//-----------------------------------------------------------------------------//












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
