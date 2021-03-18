import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { SignalRConnection } from '../models/signal-r-connection';
import { environment } from '../../environments/environment';
import * as SignalR from '@microsoft/signalr';
import { MonitoringService } from './monitoring/monitoring.service';
import 'rxjs/add/operator/catch';
import { AuthService } from './auth.service';
import { map, first } from 'rxjs/operators';
import * as jwt_decode from 'jwt-decode';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {

  // SignalR Hub Connection containing all info to connect to Hub
  private hubConnection: SignalR.HubConnection;
  // Boolean indicating SignalR connection status
  private connectionEstablished = new EventEmitter<boolean>();
  // Data types that will be received from SignalR
  private messages$: Subject<any> = new Subject<any>();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private monitoringService: MonitoringService,
    private userService: UserService
  ) {
    // Get auth token when its returned from B2C
    this.authService.token.subscribe(token => {
      // Open the SignalR connection
      if (token) {
        this.startConnection(token);
      }
    });
  }

  /**
   * Opens a connection with SignalR hub using SignalRConnection auth object obtained from
   * the /negotiate endpoint
   * @param token the access token from the user's Azure AD B2C authenticated session
   */
  private startConnection(token: string) {

    // first check whether hub connection exists and if it does whether it is connected. If false to either then make connection.
    if (!this.hubConnection || this.hubConnection.state !== 'Connected') {

      // Call the SignalR negotiate function to get connection tokens for SignalR
      console.log('Calling SignalR negotiate endpoint');

      // Then use it to grab the App Session Token
      this.getAppServiceSessionToken(token).subscribe(sessionToken => {
        // Get the session ID from the token and persist it to the signed-in user's fragment
        const decodedToken = jwt_decode(sessionToken);
        const sessionId = decodedToken.stable_sid;
        // Get the user fragment, add the sessionId and update it
        const userFragSubscription = this.userService.returnUser()
          .pipe(first(user => user && user.fragment !== undefined))
          .subscribe(user => {
            const userFrag = user.fragment;
            // If there is no sessionId or it doesn't match the one just returned, update the userFrag
            if (!userFrag.sessionId || userFrag.sessionId !== sessionId) {
              userFrag.sessionId = sessionId;
              this.userService.updateUserFragment(userFrag).subscribe(res => {
                if (!res.ok) {
                  this.monitoringService.logException(new Error('Unable to update user fragment with session ID'));
                } else {
                  userFragSubscription.unsubscribe();
                }
              });
            }
            this.joinSignalRGroups(sessionToken, userFrag.id).subscribe(res => {
              if (!res.ok) {
                // TODO: add a status change property for the connection so we can adapt UI etc. if we can't fully connect
                this.monitoringService.logException(new Error('Unable to join group conversations in SignalR'));
              } else {
                console.log('Successfully joined group conversations.');
              }
            });
          });

        this.getSignalRConnection(sessionToken).subscribe(connection => {
          if (connection) {
            const options = {
              accessTokenFactory: () => connection.accessToken
            };

            // Build the hub connection using the connection info retrieved from /negotiate endpoint
            this.hubConnection = new SignalR.HubConnectionBuilder()
              .withUrl(connection.url, options)
              .withAutomaticReconnect()
              .configureLogging(SignalR.LogLevel.Information)
              .build();
            console.log('Establishing SignalR connection');
            // Start the hub connection
            this.establishSignalRConnection();
          } else {
            // TODO: Display error to user and have a flag that services can access to show connection is offline
            this.monitoringService.logException(new Error('No SignalR connection information was returned'));
          }
        });
      });
    }
  }

  /**
   * Get session token for authenticating with SignalR functions (App Service Authentication)
   */
  private getAppServiceSessionToken(token: string): Observable<string> {
    return this.http.post<any>(`${environment.signalR.functionsURL}.auth/login/aad`,
      `{"access_token":"${token}"}`)
      .pipe(
        map(authResp => {
          return authResp.authenticationToken;
        })
      );
  }

  /**
   * Get SignalR connection credentials by calling /negotiate function
   * @param sessionToken the App Service session token for authentication
   * @returns an Observable of the SignalRConnection
   */
  private getSignalRConnection(sessionToken: string): Observable<SignalRConnection> {
    return this.http.get<SignalRConnection>(`${environment.signalR.functionsURL}api/negotiate`, {
      headers: { 'X-ZUMO-AUTH': sessionToken }
    });
  }

  /**
   * Join the signed-in user to all of their group conversations (SignalR Groups) /joinGroup
   * @param sessionToken the App Service session token for authentication
   * @returns an Observable of the joinGroups HTTP response
   */
  private joinSignalRGroups(sessionToken: string, userId: string): Observable<HttpResponse<any>> {
    return this.http.get<HttpResponse<any>>(`${environment.signalR.functionsURL}api/joinGroups/${userId}`, {
      headers: { 'X-ZUMO-AUTH': sessionToken },
      observe: 'response'
    });
  }

  /**
   * Establish a connection with SignalR using the HubConnection
   */
  private establishSignalRConnection() {
    // Open up the connection and retry upon failure
    this.hubConnection
      .start()
      .then(() => {
        console.log('Hub connection started');
        // Then listen for the newMessage target
        this.listenForTopic('newMessage');
      })
      .catch(error => {
        this.monitoringService.logException(error);
        // TODO: add toasts/UI for messaging connection status
      });
  }

  /**
   * Listen to the hub connection for a specified event
   * @param topic the name of the topic (method in SignalR terminology) to listen for
   */
  public listenForTopic(topic: string) {
    this.hubConnection.on(topic, (data: any) => {
      // TODO: how do we make this dynamic to listen for other things like Notifications?
      // Hardcoding to messages subject for now
      this.messages$.next(data);
    });
  }

  /**
   * Returns an observable of the received messages[]
   * TODO: how do we make this whole thing dynamic?
   * @returns Observable: Array[] containing received messages
   */
  public returnMessages() {
    return this.messages$.asObservable();
  }
}
