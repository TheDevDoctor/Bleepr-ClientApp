import { environment } from 'src/environments/environment';

// *********************************************************
// Interfaces for Auth Service
// *********************************************************

// User: stores details of the logged in user returned from ADB2C
export class User {
  firstname: string;
  surname: string;
  primaryEmail: string;
  oid: string;

  constructor(authClaims: any) {
    this.firstname = authClaims[environment.authOptions.claims.firstname];
    this.surname = authClaims[environment.authOptions.claims.surname];
    this.primaryEmail = authClaims[environment.authOptions.claims.email][0];
    this.oid = authClaims[environment.authOptions.claims.oid];
  }
}
