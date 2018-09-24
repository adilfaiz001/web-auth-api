const firebase = require('./database');
const async = require('../node_modules/async');
const crypto = require('crypto');
const nodemailer = require('../node_modules/nodemailer');


exports.resetPassword = function(req,res,next){

  console.log("Reset Password Block");

  var userData = firebase.firebase.database();
  async.waterfall([
    function(done) {
      crypto.randomBytes(20,function(err,buf){
        var token = buf.toString('hex');
        done(err,token);
      });
    },
    function(token,done){

      userData.ref().child('users').orderByChild('email').equalTo(req.body.email).once('value',(userch,err)=>{

        if(userch.val() === null)
        {
          console.log('No user account');
          req.flash('error','No account with '+req.body.email);
          return res.redirect('/forget');
        }

        else
        {
          var user = userch.val();
          var key;
          for(var field in user)
          {
            key = field;
          }
          var uid = user[key]['uid'];
          var email = user[key]['email'];

          userData.ref('users/user-'+uid).update({
            "resetPasswordToken" : token,
            "resetPasswordExpires" : Date.now() + 3600000
          });
          console.log(email);
          done(err,token,email);
        }
      });
    },
    function(token,email,done){
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'socialcops001@gmail.com',
          pass: '98939605'
        }
      });
      var mailOptions = {
        to: email,
        from: 'socialcops001@gmail.com',
        subject: 'SocialCops password reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions,function(err){
        console.log('mail sent');
        req.flash('success','An email has been sent to '+email+' with further instructions.');
        done(err,'done');
      });
    }
  ],function(err){
        res.redirect('/forget');
  });
}
