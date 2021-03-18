// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiBaseURL: 'https://bleepr-test.azurewebsites.net/api/',
  cosmosDB: {
    usersContainerId: 'users',
    contentContainerId: 'content',
    bleepsContainerId: 'bleeps',
    articlesContainerId: 'articles',
    feedsContainerId: 'feeds',
    messagesContainerId: 'messages',
    conversationsContainerId: 'conversations'
  },
  blobStorage: {
    storageUri: 'https://bleepr.blob.core.windows.net/'
  },
  authOptions: {
    logout: {
      redirectUri: 'http://localhost:8100/landing-page'
    },
    options: {
      appId: 'c9b4b63e-105d-4e03-869e-020253591b39',
      // tslint:disable-next-line:max-line-length
      authorizationBaseUrl: 'https://bleeprb2c.b2clogin.com/bleeprb2c.onmicrosoft.com/B2C_1_SIGNIN/oauth2/v2.0/authorize',
      scope: 'openid offline_access https://bleeprb2c.onmicrosoft.com/messaging-functions/user_impersonation',
      responseType: 'code',
      pkceEnable: true,
      state: 'auth',
      accessTokenEndpoint: '',
      web: {
        redirectUrl: 'http://localhost:8100/auth',
        windowTarget: '_self'
      },
      android: {
        pkceEnabled: true,
        responseType: 'code',
        redirectUrl: 'msauth://io.bleepr.bleeprApp/2jmj7l5rSw0yVb%2FvlWAYkK%2FYBwk%3D',
        authorizationBaseUrl: 'https://bleeprb2c.b2clogin.com/tfp/bleeprb2c.onmicrosoft.com/B2C_1_SIGNIN/oauth2/v2.0/authorize',
        accessTokenEndpoint: 'https://bleeprb2c.b2clogin.com/tfp/bleeprb2c.onmicrosoft.com/B2C_1_SIGNIN/oauth2/v2.0/token',
        handleResultOnNewIntent: true,
        handleResultOnActivityResult: true
      },
      ios: {
        pkceEnabled: true,
        responseType: 'code',
        redirectUrl: 'io.bleepr.bleeprApp://auth',
        accessTokenEndpoint: 'https://bleeprb2c.b2clogin.com/bleeprb2c.onmicrosoft.com/B2C_1_SIGNIN/oauth2/v2.0/token',
      }
    },
    claims: {
      firstname: 'extension_Firstname',
      surname: 'family_name',
      email: 'emails',
      oid: 'oid',
    }

  },
  crossref: {
    key: 'matthew@bleepr.io',
    format: 'json',
    apiBaseURL: 'http://www.crossref.org/openurl/',
  },
  signalR: {
    functionsURL: 'https://bleepr-messaging.azurewebsites.net/'
  },
  monitoring: {
    appInsights: {
      instrumentationKey: 'f49d58dd-a00c-49c8-ae83-d3f86a837164'
    }
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
