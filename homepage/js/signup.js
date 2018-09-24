      function generateSignupQueryURL(query) {
        return (
          `name=${encodeURI(query.name)}&` +
          `phone=${query.phone}&` +
          `email=${query.email}&` +
          `password=${encodeURI(query.password)}&` +
          `verify=true`
        );
      }


      function createLoginToken(params) {
        return new Promise((resolve,reject)=>{
            document.cookie = `AMP_TK=${params.uid}; path='/' domain=account:3000`;
            resolve();
        });
      }
