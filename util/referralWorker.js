const firebaseSignup = require('./Database');



exports.getLink = function(params) {
    const userData = firebaseSignup.firebase.database();

    return new Promise((resolve,reject)=>{
        userData.ref().child('users').orderByChild('phone').equalTo(params).limitToFirst(1).once('value',(userch)=>{

            if(userch.val() !== null){
                var user = userch.val();
                var key;
                for(var field in user) {
                  key = field;
                }
                var referLink = user[key]['referLink'];
                var name = user[key]['name'];
                resolve({
                    "status" : true,
                    "url" : referLink,
                    "name": name
                });
            }
        });
    })

}
