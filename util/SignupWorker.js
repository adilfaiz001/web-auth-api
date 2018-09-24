const Hasher = require('./PasswordHasher');
const firebaseSignup = require('./database');


exports.CreateNewUser = function(params){

  var userData = firebaseSignup.firebase.database();

  let uid = generateUserId();
  let salt = generateSalt(12)
  let hash = Hasher.getHash(params.password,salt);

  return new Promise((resolve,reject)=>{
    userData.ref().child('users').orderByChild('phone').equalTo(params.phone).once('value',(searches)=>{
      if(searches.val()===null){
        userData.ref('users/user-'+ uid).set({
          "uid":uid,
          "name":params.name,
          "phone":params.phone,
          "email":params.email,
          "password":hash,
          "resetPasswordToken" : null,
          "resetPasswordExpires" : null
        }).then(()=>{
          resolve({
            "success":true,
            "uid":uid,
            "hash":hash
          });
        });
      }
      else {
        resolve({
          "success":false,
          "error":"PHONE-EXISTS"
        });
      }
    });
  });
}







//================================Utility Function============================//

function generateUserId(){
        var userId = "";
        var date = new Date();

        var min  = (date.getMinutes() < 10 ? "0" : "") + date.getMinutes();
        var sec  = (date.getSeconds() < 10 ? "0" : "") + date.getSeconds();
        var mon = ((date.getMonth() + 1) < 10 ? "0" : "") + (date.getMonth() + 1);
        var day  = (date.getDate() < 10 ? "0" : "") + date.getDate();

        var dateOrder = [ mon, day, min, sec ];

        // GEN 8 RANDOM HEX
        for(var i=0 ; i<8 ; i++){
            userId = userId + Math.floor(Math.random()*16).toString(16);
        }
        // GEN 2 DEFINED DATE
        for(var i=0 ; i<2 ; i++){
            userId = userId + dateOrder[Math.floor(Math.random()*2)].toString();
        }
        // GEN 8 RANDOM HEX
        for(var i=0 ; i<8 ; i++){
            userId = userId + Math.floor(Math.random()*16).toString(16);
        }
        // GEN 2 DEFINED DATE
        for(var i=0 ; i<2 ; i++){
            userId = userId + dateOrder[Math.floor(Math.random()*2 + 2)].toString();
        }

        return userId;
}


function generateSalt(length) {
    var salt = "";
    for(var i=0 ; i<length ; i++){
        salt = salt + Math.floor(Math.random()*16).toString(16);
    }
    return salt;
}
