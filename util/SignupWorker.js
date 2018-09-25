const Hasher = require('./PasswordHasher');
const firebaseSignup = require('./database');


exports.CreateNewUser = function (params) {

    var usersData = firebaseSignup.firebase.database();


    let salt = generateSalt(12);
    let uid = generateUserId();
    let hash = Hasher.generateHash(params.password, salt);

    let ref_id = params.ref;
    if (ref_id === '')
    {
        console.log("testing")

        return new Promise((resolve,reject) => {

            usersData.ref().child('users').orderByChild('phone').equalTo(params.phone).once('value', (searchres)=>{

                if(searchres.val()===null)
                {
                    usersData.ref().child('users').orderByChild('email').equalTo(params.email).once('value',(user)=>{
                        console.log(user.val());
                        if (user.val()===null)
                        {
                            usersData.ref('users/user-' + uid).set({
                                "uid" : uid,
                                "phone" : params.phone,
                                "email" : params.email,
                                "emailVerify" : false,
                                "name" : decodeURI(params.name),
                                "salt" : salt,
                                "password" : hash,
                                "addedOn" : getDateTime(),
                                "isDeleted" : false,
                                "login" : true,
                                "referLink": generateReferLink({"phone":params.phone,"name":params.name}),
                                "referCount": 0
                            });
                            /*.then(()=>{
                                SpreadsheetWorker.WriteToSpreadsheet({
                                    "ssId" : ssConfig.spreadsheets.records,
                                    "sheet" : "Users",
                                    "values" : [
                                        `${getDateTime()}`,
                                        `${uid}`,
                                        `${decodeURI(params.name)}`,
                                        `${params.phone}`
                                    ]
                                });
                                resolve({
                                    "success" : true,
                                    "uid" : uid,
                                    "hash" : hash
                                });
                            });*/
                            resolve({
                                "success" : true,
                                "uid" : uid,
                                "hash" : hash
                            });
                        } else {
                            resolve({
                                "success" : false,
                                "error" : "EMAIL-EXIST"
                            });
                        }
                    });


                }else {
                    resolve({
                        "success" : false,
                        "error" : "PHONE-EXISTS"
                    });
                }
            });
        });
    }
    else
    {
        console.log("here"+ref_id);
        return new Promise((resolve,reject) => {
            usersData.ref().child('users').orderByChild('phone').equalTo(params.phone).once('value', (searchres)=>{

                if(searchres.val()===null){

                    usersData.ref().child('users').orderByChild('email').equalTo(params.email).once('value',(user)=>{

                        if (user.val()===null)
                        {
                            usersData.ref('users/user-' + uid).set({
                                "uid" : uid,
                                "phone" : params.phone,
                                "email" : params.email,
                                "emailVerify" : false,
                                "name" : decodeURI(params.name),
                                "salt" : salt,
                                "password" : hash,
                                "addedOn" : getDateTime(),
                                "isDeleted" : false,
                                "login" : true,
                                "referLink": generateReferLink({"phone":params.phone,"name":params.name}),
                                "referCount": 1
                            }).then(()=>{
                                usersData.ref().child('users').orderByChild('phone').equalTo(ref_id).once('value',(userch)=>{
                                    var user = userch.val();
                                    var key;
                                    for(var field in user)
                                    {
                                        key = field;
                                    }
                                    var uid = user[key]['uid'];
                                    var referCount = user[key]['referCount'];
                                    if (user!== null){
                                        usersData.ref('users/user-'+uid).update({
                                            "referCount": referCount+1
                                        });
                                        console.log("Referral complete");
                                    }
                                });
                            });
                            /*.then(()=>{
                                SpreadsheetWorker.WriteToSpreadsheet({
                                    "ssId" : ssConfig.spreadsheets.records,
                                    "sheet" : "Users",
                                    "values" : [
                                        `${getDateTime()}`,
                                        `${uid}`,
                                        `${decodeURI(params.name)}`,
                                        `${params.phone}`
                                    ]
                                });
                                resolve({
                                    "success" : true,
                                    "uid" : uid,
                                    "hash" : hash
                                });
                            });*/
                            resolve({
                                "success" : true,
                                "uid" : uid,
                                "hash" : hash
                            });
                        } else {
                            resolve({
                                "success" : false,
                                "error" : "EMAIL-EXIST"
                            });
                        }
                    });
                } else {
                    resolve({
                        "success" : false,
                        "error" : "PHONE-EXISTS"
                    });
                }
            });
        });
    }
}

//==============================================================================================//
//-------------------------------------- UTILITY FUNCTIONS -------------------------------------//
//==============================================================================================//

function getDateTime() {
    var date = new Date();

    var hour = (date.getHours() < 10 ? "0" : "") + date.getHours();
    var min  = (date.getMinutes() < 10 ? "0" : "") + date.getMinutes();
    var sec  = (date.getSeconds() < 10 ? "0" : "") + date.getSeconds();
    var year = date.getFullYear();
    var month = ((date.getMonth() + 1) < 10 ? "0" : "") + (date.getMonth() + 1);
    var day  = (date.getDate() < 10 ? "0" : "") + date.getDate();

    return ( `${hour}:${min}:${sec} ${day}/${month}/${year}`);
}

function generateUserId() {
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

    // if(){

    // } else {
        return userId;
    //}
}

function generateSalt(length) {
    var salt = "";
    for(var i=0 ; i<length ; i++){
        salt = salt + Math.floor(Math.random()*16).toString(16);
    }
    return salt;
}

function generateReferLink(params){
    const url = `?ref=${params.phone}&name=${params.name}`;
    return (`http://homepage:3000/signup${url}`);
}
