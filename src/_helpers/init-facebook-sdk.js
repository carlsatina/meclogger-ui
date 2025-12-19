const facebookAppId = import.meta.env.VITE_FACEBOOK_ID || import.meta.env.VUE_APP_FACEBOOK_ID;

const initFacebookSdk = () => {
    return new Promise(resolve => {
        // wait for facebook sdk to initialize before starting the vue app
        window.fbAsyncInit = function () {
            const FB = window.FB;
            FB.init({
                appId: facebookAppId,
                cookie: true,
                xfbml: true,
                version: 'v18.0'
            });
        };

        // load facebook sdk script
        (function (d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) { return; }
            js = d.createElement(s); js.id = id;
            js.src = "https://connect.facebook.net/en_US/sdk.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));    
    });
}

export default initFacebookSdk
