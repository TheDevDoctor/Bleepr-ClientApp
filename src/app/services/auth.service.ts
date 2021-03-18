import 'capacitor-secure-storage-plugin';
import { OAuthService, JwksValidationHandler, AuthConfig } from 'angular-oauth2-oidc';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { User } from '../models/auth-types';
import { UserService } from './user.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { MonitoringService } from './monitoring/monitoring.service';
import { Plugins, Capacitor, registerWebPlugin } from '@capacitor/core';
import { OAuth2Client } from '@byteowls/capacitor-oauth2';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

const { Storage, App, SecureStoragePlugin, Browser } = Plugins;

declare const window: any;

@Injectable()
export class AuthService {
    isLoggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    accessToken: string;
    accessTokenExpiry: number;
    refreshToken: string;
    profileInfo: string;
    accessToken$: BehaviorSubject<string> = new BehaviorSubject<string>(this.accessToken);

    authConfigurationOptions = environment.authOptions.options;

    constructor(
        private oauthService: OAuthService,
        private userService: UserService,
        private monitoringService: MonitoringService,
        private http: HttpClient,
        private router: Router,
        private iab: InAppBrowser
    ) {
        // register oauth client
        registerWebPlugin(OAuth2Client);

        // add state change listener
        this.addStateChangeListener();
    }

    // AUTHENTICATION FUNCTIONS --------------------------------------------------------------
    /**
     * authenticate with azure B2C.
     */
    private authenticateWithB2C() {
        Plugins.OAuth2Client.authenticate(this.authConfigurationOptions).then(response => {
            this.sortAuthResponse(response);
        })
            .catch(reason => {
                // send reason for failed login to monitoring service.
                this.monitoringService.logException(new Error(`User failed to log in, reason: ${reason}`), 2);
            });
    }

    /**
     * Actions are different depending on if web or native, native will get the access token in one call.
     * For web implementation you need to use authorisation code to make a second call to retrieve access
     * tokens.
     * @param response the authenticate OAuth2Client function response.
     */
    public sortAuthResponse(response) {
        if (Capacitor.getPlatform() === 'web') {
            this.requestAccessToken(response);
        } else {
            this.sortTokenResponse(response);
        }
    }

    /**
     * sort the token response and store the needed values.
     * @param response the respone from azure B2C.
     */
    private sortTokenResponse(response) {
        // setup the user.
        this.setupUser(response.access_token);

        // store access token expiry.
        this.accessTokenExpiry = response.expires_on;

        // store ref token and save it to local secure storage.
        this.refreshToken = response.refresh_token;
        SecureStoragePlugin.set({ key: 'refresh_token', value: this.refreshToken })
            .catch(error => {
                // log storing error to monitoring service.
                this.monitoringService.logException(new Error(`User failed to store refresh token, reason: ${error}`), 2);
            });
    }

    /**
     * refresh the access token. Used when the access token has expired or the app has been closed down.
     */
    private refreshAccessToken() {
        const platform = Capacitor.getPlatform();

        if (platform === 'web') {
            const uri = 'https://bleeprb2c.b2clogin.com/bleeprb2c.onmicrosoft.com/B2C_1_SIGNIN/oauth2/v2.0/token?' +
                'client_id=' + environment.authOptions.options.appId + '&' +
                'redirect_uri=' + environment.authOptions.options.web + '&' +
                'scope=' + environment.authOptions.options.scope + '&' +
                'grant_type=refresh_token' + '&' +
                'refresh_token=' + this.refreshToken;

            this.http.get(uri).subscribe(response => {
                this.sortTokenResponse(response);
            });
        } else if (platform === 'android' || platform === 'ios') {
            const refreshOptions = {
                appId: environment.authOptions.options.appId,
                accessTokenEndpoint: platform === 'ios' ? environment.authOptions.options.ios.accessTokenEndpoint :
                    environment.authOptions.options.android.accessTokenEndpoint,
                refreshToken: this.refreshToken,
                scope: environment.authOptions.options.scope
            };

            Plugins.OAuth2Client.refreshToken(
                refreshOptions
            ).then(response => {
                // sort the auth response:
                this.sortAuthResponse(response);
            }).catch(error => {
                this.authenticateWithB2C();
            }
            );
        }
    }

    /**
     * Used for web instance only. Web cannot get the access token directly, due to CORS, so it has to request token
     * seperately with the authorisation code
     * @param authResponse the response from the initial request to azure AD B2C authorization endpoint.
     */
    private requestAccessToken(authResponse) {
        const uri = 'https://bleeprb2c.b2clogin.com/bleeprb2c.onmicrosoft.com/B2C_1_SIGNIN/oauth2/v2.0/token?' +
            'client_id=' + environment.authOptions.options.appId + '&' +
            'redirect_uri=' + environment.authOptions.options.web + '&' +
            'scope=' + environment.authOptions.options.scope + '&' +
            'code=' + authResponse.code + '&' +
            'grant_type=authorization_code';

        this.http.get(uri).subscribe(response => {
            this.sortTokenResponse(response);
        });
    }

    /**
     * On authentication of the user set the access token and load the user docs:
     * @param accessToken the current acess token, must be valid.
     */
    private setupUser(accessToken) {
        this.accessToken = accessToken;
        this.accessToken$.next(this.accessToken);
        this.isLoggedIn.next(true);
        this.userService.getUserOnLoad(this.user.oid);
    }

    // Get the user object
    public get user() {
        const claims = this.extractTokenClaims(this.accessToken);
        if (!claims) {
            return null;
        }
        const user = new User(claims);
        return user;
    }

    /**
     * Extract the claims from the access token
     * @param token the access token with the claims.
     */
    private extractTokenClaims(token) {
        const jwtData = token.split('.')[1];
        const decodedJwtJsonData = window.atob(jwtData);
        const decodedJwtData = JSON.parse(decodedJwtJsonData);

        return decodedJwtData;
    }

    // Get the access token
    public get token() {
        return this.accessToken$.asObservable();
    }

    public returnLoggedInState() {
        return this.isLoggedIn.asObservable();
    }

    /**
     * Check authentication status and trigger login to the app.
     */
    public async login(redirectToLanding = true) {

        // web framework should not use refresh token logic to directly login as this is insecure in web.

        // if refresh token stored locally, then refresh token:
        if (this.refreshToken) {
            this.refreshAccessToken();
            return;
        }

        // check to see if refresh token is stored in secure memory and refresh, if not then redirect to login;
        await SecureStoragePlugin.get({ key: 'refresh_token' })
            .then(value => {
                this.refreshToken = value.value;
                this.refreshAccessToken();
            })
            // Redirect to the landing page if no refresh token found
            .catch(error => {
                console.log(error);
                redirectToLanding ? this.router.navigate(['landing-page']) : this.authenticateWithB2C();
            });
    }

    /**
     * Plugin does not currently have logout functionality in built, this is the suggested solution
     * for azure B2C from plugin page.
     */
    public async logout() {
        // if web direct to signout with a redirect uri as the landing page.
        if (Capacitor.getPlatform() === 'web') {
            const logoutUri = 'https://bleeprb2c.b2clogin.com/bleeprb2c.onmicrosoft.com/B2C_1_SIGNIN/oauth2/v2.0/logout?' +
                `post_logout_redirect_uri=${environment.authOptions.logout.redirectUri}`;

            const browser = await Browser.open({ url: logoutUri, windowName: '_self' });

        // on native cannot use redirect, and capacitor browser has no support for programatically closing browser on android???
        // use cordova in app browser solves this.
        } else {
            const browser = this.iab.create('https://bleeprb2c.b2clogin.com/bleeprb2c.onmicrosoft.com/B2C_1_SIGNIN/oauth2/v2.0/logout');

            browser.on('loadstop').subscribe(ev => {
                browser.close();
            });
        }

        // clear the stored data. i.e. token
        this.clearUserData();

        // remove OAuth2 stored variables.
        Plugins.OAuth2Client.logout(
            this.authConfigurationOptions
        ).then(() => {
            console.log('logged out');
            SecureStoragePlugin.remove({ key: 'refresh_token' });
            sessionStorage.clear();
        }).catch(reason => {
            console.error('OAuth logout failed', reason);
        });

        // navigate to the landing page.
        this.router.navigate(['landing-page']);
    }

    /**
     * Clear the user data, should be called whenever the user is logged out.
     */
    private clearUserData() {
        this.accessToken = undefined;
        this.accessToken$.next(this.accessToken);
        this.refreshToken = undefined;
        this.userService.clearUser();
    }

    private async addStateChangeListener() {
        App.addListener('appStateChange', (state) => {
            if (state.isActive) {
                // check that an access token has been set, this stops code this firing on app first opening when login should occur anyway.
                if (this.accessToken) {
                    // check if the auth token is valid, if not, login.
                    if (this.accessTokenExpiry < (Date.now() / 1000) - 60) {
                        this.login();

                        // else trigger new signal connection by pushing update to observable
                    } else {
                        this.setupUser(this.accessToken);
                    }
                }
            }
        });
    }
}
