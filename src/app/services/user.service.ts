import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BlobUploadsViewStateService } from './blob_storage/blob-uploads-view-state.service';
import { DatabaseService } from './database.service';
import { environment } from 'src/environments/environment';
import { ToastController } from '@ionic/angular';
import { AppBlobService } from './blob_storage/app-blob-service.service';
import { map } from 'rxjs/operators';
import { Plugins, Capacitor } from '@capacitor/core';
import { NotificationsService } from './notifications.service';
import { AuthService } from './auth.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { MonitoringService } from './monitoring/monitoring.service';

const { App } = Plugins;

@Injectable({
  providedIn: 'root'
})
/**
 * User Service: handles user files and anything related to backend user data interaction
 */
export class UserService {
  private user: any;
  private user$ = new BehaviorSubject<any>(this.user);

  private suggestedConnections: any[];
  private suggestedConnections$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>(this.suggestedConnections);
  private suggestedConnectsContToken: any;

  public connectionFragments: any;
  public connectionFragments$: BehaviorSubject<any> = new BehaviorSubject<any>(this.connectionFragments);

  constructor(
    private blobState: BlobUploadsViewStateService,
    private databaseService: DatabaseService,
    private oauthService: OAuthService,
    public toastController: ToastController,
    private appBlobService: AppBlobService,
    private notificationsService: NotificationsService,
    private monitoringService: MonitoringService
  ) { }

  /**
   * Gets the self user document from cosmos DB.
   * @parameter id: id of the user document to get.
   */
  private getSelfUser(id) {
    this.databaseService.queryDocuments(`SELECT * FROM u WHERE u.userId = "${id}"`,
      environment.cosmosDB.usersContainerId, id).subscribe(data => {
        if (data.body._count === 3) {
          this.setUser(this.formatUser(data.body.Documents));
        } else {
          this.setUser(null);
        }
      });
  }

  /**
   * Calls the function to get the self user document from cosmos DB and also notifications doc.
   * @parameter id: id of the user document to get.
   */
  public getUserOnLoad(userId) {
    this.getSelfUser(userId);
    this.notificationsService.onGetNotifications(userId);
    if (userId && Capacitor.getPlatform() !== 'web') {
      this.notificationsService.connectToPushNotifications(userId);
    }
  }

  /**
   * Gets the user object (containing information on user's details)
   * @return an observable of the user object
   */
  public returnUser() {
    return this.user$.asObservable();
  }

  public clearUser() {
    this.user = undefined;
    this.user$.next(undefined);
    this.suggestedConnections = undefined;
    this.suggestedConnectsContToken = undefined;
    this.connectionFragments = undefined;
    this.connectionFragments$.next(undefined);
  }

  /**
   * Sets the current user object to a new object passed as input
   * @param user user object to update the BehaviourSubject with
   */
  public setUser(user) {
    this.user = user;
    this.user$.next(this.user);

    this.notificationsService.setUserFragment(this.user.fragment);
  }

  public async setProfilePic(guid: string, updateUri: string) {
    this.appBlobService.downloadBlob('media/images/' + guid, this.user.fragment.userId).subscribe(res => {
      res.blobBody.then(blob => {
        this.addToProfilePicContainer(blob, updateUri);
      });
    });
  }

  public async addToProfilePicContainer(blob, updateUri) {
    const subscription = await this.appBlobService.uploadBlob('profile-pictures', blob, undefined, this.user.fragment.userId);
    subscription.subscribe(resp => {
      if (resp.uri) {
        this.user.profilePic = updateUri;
        this.setUser(this.user);
      }
    });
  }

  formatUser(usrArray) {
    const usr: any = {};
    usrArray.forEach(element => {
      usr[element.type] = element;
    });
    this.checkForCookieConsent(usr.account.cookie_consent);
    this.appBlobService.checkBlobExists(usr.fragment.userId, 'profile-pictures').subscribe(exists => {
      if (exists) {
        this.user.profilePic = `${environment.blobStorage.storageUri}profile-pictures/${this.user.fragment.userId}`;
        this.setUser(this.user);
      }
    });

    return usr;
  }

  checkForCookieConsent(consent) {
    if (!consent) {
      this.presentCookieConsent();
    }
  }

  async presentCookieConsent() {
    const toast = await this.toastController.create({
      message: 'We use cookies to improve your experience on the platform. Please click okay to consent to the use of cookies.',
      position: 'bottom',
      color: 'tertiary',
      buttons: [
        {
          text: 'Okay',
          role: 'cancel',
          handler: () => {
            this.cookieConsentGiven();
          }
        }
      ]
    });
    toast.present();
  }

  cookieConsentGiven() {
    this.user.account.cookie_consent = true;
    this.updateUserAccount(this.user.account);
  }

  /**
   * Updates the user's profile picture with a new image
   * @param profPic image file to upload to blob storage
   */
  public updateProfilePic(blobFile) {
    const file = { file: blobFile, filename: 'profile_pic', container: this.user.fragment.userId };
    this.sendToBlob([file]);
  }

  /**
   * Helper method to call the blob service and upload file(s)
   * @param files array of files to send to blob
   */
  public sendToBlob(files) {
    this.blobState.uploadItems(files);
  }

  /**
   * Adds a connection request to the requester's connect_pending and to the requestee's connect_requests
   * @param connectionId the id of the connection to add
   */
  public sendConnectRequest(connectionId) {
    // call sproc to add to requestees.
    return this.databaseService.callSproc('users', connectionId, 'addToArraySproc',
      [connectionId, 'connect_requests', this.user.fragment.userId, 'account']).pipe(
        map(res => {
          if (res.ok) {
            this.user.account.connect_pending.push(connectionId);
            this.removeSuggestedConnection(connectionId);

            this.updateUserAccount(this.user.account);
          } else {
            // TODO: replace console.log with logging
            console.log('error while calling sproc to add to connection.');
          }
          return res;
        })
      );
  }

  private removeSuggestedConnection(connectionId) {
    const connectIndex = this.suggestedConnections.findIndex(e => e.userId === connectionId);
    if (connectIndex > -1) {
      this.suggestedConnections.splice(connectIndex, 1);
      this.suggestedConnections$.next(this.suggestedConnections);
    }
    if (this.suggestedConnections.length < 7) {
      this.getSuggestedConnections();
    }
  }

  /**
   * Get's the next set of suggested contact, ten at a time. If end of pagination then will not get any more requests.
   */
  private getSuggestedConnections() {
    if (this.suggestedConnectsContToken !== null) {
      const sql = this.constructConnectionsSQL(true, true);
      const query = `SELECT * FROM users u WHERE u.id NOT IN ${sql} AND u.type = "fragment"`;
      this.databaseService.queryDocuments(query, 'users', null, { maxItems: 10, continuationToken: this.suggestedConnectsContToken })
        .subscribe(resp => {
          if (!this.suggestedConnections) {
            this.suggestedConnections = [];
          }
          this.suggestedConnections = this.suggestedConnections.concat(resp.body.Documents);
          this.suggestedConnectsContToken = resp.headers.get('x-ms-continuation');
          this.suggestedConnections$.next(this.suggestedConnections);
        });
    } else {
      console.log('There are no more suggested contacts');
    }
  }

  constructConnectionsSQL(includeSelf: boolean, incPendAndReq: boolean) {

    let sql = includeSelf ? `("${this.user.fragment.id}"` : '(';

    const connections = incPendAndReq ? Object.keys(this.user.profile.connections)
      .concat(this.user.account.connect_requests, this.user.account.connect_pending) : Object.keys(this.user.profile.connections);

    if (connections.length > 0) {
      if (includeSelf) {
        sql += ', ';
      }
      connections.forEach((connect, index) => {
        sql += index === 0 ? `"${connect}"` : `, "${connect}"`;
      });
    }
    sql += ')';
    return sql;
  }

  /**
   * Accepts a connection request in the connect_pending list
   * @param connectionId the id of the connection to accept
   */
  public acceptConnectionRequest(connectionId) {
    return this.databaseService.acceptConnectRequest(this.user.fragment.userId, connectionId);
  }

  /**
   * Declines a connections request in the connect_pending list and removes it
   * @param connectionId the id of the connection to decline
   */
  public declineConnectionRequest(connectionId) {
    const index = this.user.account.connect_requests.indexOf(connectionId);
    if (index > -1) {
      this.user.account.connect_requests.splice(index, 1);
    }
    this.updateUserAccount(this.user.account);
  }

  /**
   * Update the user document for the current signed-in user in the DB & locally
   * @param user the user object that will replace the existing doc
   */
  public updateUser(user) {
    this.databaseService.updateUser(user).subscribe(res => {
      if (res.ok) {
        this.user = res.body;
        this.user$.next(this.user);
      }
    });
  }

  public updateUserFragment(fragment) {
    return this.databaseService.createOrUpdateDocument(fragment, environment.cosmosDB.usersContainerId, fragment.userId).pipe(
      map(res => {
        if (res.ok) {
          this.user.fragment = res.body;
          this.user$.next(this.user);
        }
        return res;
      }));
  }

  public updateUserProfile(profile) {
    return this.databaseService.createOrUpdateDocument(profile, environment.cosmosDB.usersContainerId, profile.userId).pipe(
      map(res => {
        if (res.ok) {
          this.user.profile = res.body;
          this.user$.next(this.user);
        }
        return res;
      }));
  }

  public updateUserAccount(account) {
    this.databaseService.createOrUpdateDocument(account, environment.cosmosDB.usersContainerId, account.userId).subscribe(res => {
      if (res.ok) {
        this.user.account = res.body;
        this.user$.next(this.user);
      }
    });
  }


  createNewUser(userDoc, mailchimpDoc: any) {
    const jsonUser = JSON.stringify(userDoc);
    const sprocInputs = [userDoc.id, jsonUser];
    this.databaseService.createNewUser(userDoc.id, sprocInputs, mailchimpDoc).subscribe(res => {
      if (res.ok) {
        this.setUser(this.formatUser(res.body.result));
      }
    });
  }

  deleteUserAccount() {
    this.databaseService.deleteUserAccount(this.user.fragment.id).subscribe(response => {
      if (response.ok) {
        this.logout();
      }
    });
  }

  public logout() {
    this.oauthService.logOut();
    this.monitoringService.clearUserId();
  }

  getBleeps(id: string, maxItems: number, continuationToken: string) {
    // tslint:disable-next-line:max-line-length
    const query = `SELECT * FROM b WHERE b.type NOT IN ('comment', 'likes', 'stats') AND b.createdById = "${id}" ORDER BY b.timestamp DESC`;
    return this.databaseService.queryDocuments(query, environment.cosmosDB.bleepsContainerId, null, { maxItems, continuationToken });
  }

  public getConnectionFragments() {
    const connectSql = this.constructConnectionsSQL(false, false);
    const query = `SELECT * FROM users u WHERE u.id IN ${connectSql} AND u.type = "fragment"`;
    this.databaseService.queryDocuments(query, 'users').subscribe(data => {
      this.connectionFragments = data.body.Documents;
      this.connectionFragments$.next(this.connectionFragments);
    });
  }

  public searchForUsers(searchTerm: string): Observable<any> {
    const query = `SELECT * FROM c WHERE INDEX_OF(LOWER(CONCAT(c.firstname, ' ', c.surname)), "${searchTerm}") > -1`;
    return this.databaseService.queryDocuments(query, 'users').pipe(
      map(res => {
        if (res.ok) {
          return res.body.Documents;
        }
      })
    );
  }

  public returnSuggestedConnections() {
    if (!this.suggestedConnections) {
      this.getSuggestedConnections();
    }
    return this.suggestedConnections$.asObservable();
  }

  public returnConnectionFragments(): Observable<any[]> {
    return this.connectionFragments$.asObservable();
  }

  public checkConnectionStatus(userId) {
    // check connection status:
    if (!!this.user.profile.connections[userId]) {
      return 'connection';
    } else if (this.user.account.connect_requests.indexOf(userId) > -1) {
      return 'requested';
    } else if (this.user.account.connect_pending.indexOf(userId) > -1) {
      return 'pending';
    } else if (userId === this.user.fragment.userId) {
      return 'self';
    } else {
      return null;
    }
  }
}
