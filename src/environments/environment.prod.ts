export const environment = {
  production: true,
  apiBaseURL: '#{{BACKENDAPI_ENDPOINT}}#',
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
    storageUri: '#{{BLOB_STORAGE_URI}}#'
  },
  authOptions: {
    logout: {
      redirectUri: '#{{LOGOUT_REDIRECT_URI}}#'
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
        redirectUrl: '#{{CLIENT_REDIRECT_URI}}#',
        windowTarget: '_self'
      },
      android: {
        pkceEnabled: true,
        responseType: 'code',
        redirectUrl: 'msauth://io.bleepr.bleeprApp/Ehlwv4QhH0PKuzL4HQCCrcvM3wA%3D',
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
      instrumentationKey: '#{{APP_INSIGHTS_IKEY}}#'
    }
  }
};
