const nodemailer = require('nodemailer');
const async = require('async');
const firebase = require('./database');
const Hasher = require('./PasswordHasher');

exports.resetPassword = function(req,res)
{
  async.waterfall([
    function(done){
      var userData = firebase.firebase.database();
      var timestamp = Date.now();
      userData.ref().child('users').orderByChild('resetPasswordToken').equalTo(req.params.token).once('value',(userch,err)=>{
        console.log(userch.val());
        if (userch.val()===null)
        {
          console.log("Token Expires");
          req.flash('error', 'Password reset token is invalid.');
          return res.redirect('back');
        }
        else if(userch.val().resetPasswordExpires<timestamp){
          console.log('Token Expires');
          req.flash('error','Password reset token expires');
          return res.redirect('/forget');
        }
        else if(req.body.password === req.body.confirm){
          console.log("Password Reset section");

          let salt = generateSalt(12);
          let hash = Hasher.getHash(req.body.password,salt);

          var user = userch.val();
          var key;
          for(var field in user)
          {
            key = field;
          }
          var uid = user[key]['uid'];
          var email = user[key]['email'];
          console.log(uid,email);
          userData.ref('users/user-'+uid).update({
            'password': hash,
            'resetPasswordToken':null,
            'resetPasswordExpires':null
          });
          done(err,email);
        }
        else{
          req.flash("error","Password do not match");
          return res.redirect('back');
        }
      });
    },
    function(email,done){
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth:{
          user: 'socialcops001@gmail.com',
          pass: '98939605'
        }
      });
      var mailOptions = {
        to: email,
        from: 'socialcops001@gmail.com',
        subject: "Your Password has been changed",
        text:'Hello,\n\n' +
            'This is a confirmation that the password for your account '+email+' has been just changed.\n'

      };
      smtpTransport.sendMail(mailOptions,function(err){
        console.log("Confirmation mail sent");
        req.flash('success','Success! Your password has been changed.');
        done(err);
      });
    }
  ],function(err){
    res.redirect('/forget');
  });
}

//===========================Utility Function=================================//
function generateSalt(length) {
    var salt = "";
    for(var i=0 ; i<length ; i++){
        salt = salt + Math.floor(Math.random()*16).toString(16);
    }
    return salt;
}
