import { Injectable } from '@angular/core';
import { Observable, of, EMPTY, observable, partition } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { CachingService } from './caching.service';
import { MonitoringService } from './monitoring/monitoring.service';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  private cache = {};

  constructor(
    private http: HttpClient,
    private cachingService: CachingService,
    private monitoringService: MonitoringService
  ) { }

  /**
   * Get a document from cosmosDB.
   * @param id string: the ID of the document to get
   * @param container string: the cosmosDB container to get document from
   * @param partitionKey string: the partition key associated with the document.
   * @param cacheContainer string: cacheContainer to check, if none provided then will not check cache for observable
   * or update cache with response.
   */
  public getDocument(id: string, container: string, partitionKey: string, cacheContainer: string = null): Observable<any> {
    let obs: Observable<any>;

    // check for cached response:
    if (cacheContainer) {
      obs = this.cachingService.checkObsCache(id, cacheContainer);
      if (obs) {
        return obs;
      }
    }

    // if no cached response get document from DB:
    // tslint:disable-next-line:max-line-length
    obs = this.http.get<any>(`${environment.apiBaseURL}Database/GetDocument/${container}/${id}/${partitionKey}`, { observe: 'response' })
      .pipe(
        shareReplay(1),
        catchError(err => {
          // if error delete from cache:
          if (cacheContainer) {
            this.cachingService.removeFromObsCache(id, cacheContainer);
          }
          this.handleError<any>(`Error getting document from Cosmos DB: ${err}`);
          return EMPTY;
        })
      );

    // if cacheContainer then add response to cache.
    if (cacheContainer) {
      return this.cachingService.addToObsCache(id, cacheContainer, obs);
    } else {
      return obs;
    }
  }

  /**
   * Create a document in cosmosDB.
   * @param document any: the document in upload or update in database
   * @param container string: the cosmosDB container to add/update the document
   * @param partitionKey stirng: the partition key of the document
   * @param cacheContainer string: cacheContainer to upload the response to if cacheResponse is true
   */
  public createIfNotExists(document, container, partitionKey, cacheContainer: string = null, postTrigger: string = null): Observable<any> {

    let uri = `${environment.apiBaseURL}Database/CreateIfNotExists/${container}/${partitionKey}`;
    if (postTrigger) {
      uri += `/${postTrigger}`;
    }

    const obs = this.http.post<any>(uri, document, { observe: 'response' })
      .pipe(
        shareReplay(1),
        catchError(err => {
          // if error delete from cache:
          if (cacheContainer) {
            this.cachingService.removeFromObsCache(document.id, cacheContainer);
          }
          this.handleError<any>(`Error creating document in Cosmos DB: ${err}`);
          return EMPTY;
        })
      );

    if (cacheContainer) {
      return this.cachingService.addToObsCache(document.id, cacheContainer, obs);
    } else {
      return obs;
    }
  }

  /**
   * Create or update document in cosmosDB.
   * @param document any: the document in upload or update in database
   * @param container string: the cosmosDB container to add/update the document
   * @param partitionKey stirng: the partition key of the document
   * @param cacheContainer string: cacheContainer to upload the response to if cacheResponse is true
   */
  // tslint:disable-next-line:max-line-length
  public createOrUpdateDocument(document, container, partitionKey, cacheContainer: string = null, postTrigger: string = null): Observable<any> {

    let uri = `${environment.apiBaseURL}Database/CreateOrUpdateDocument/${container}/${partitionKey}`;
    if (postTrigger) {
      uri += `/${postTrigger}`;
    }

    const obs = this.http.post<any>(uri, document, { observe: 'response' })
      .pipe(
        shareReplay(1),
        catchError(err => {
          // if error delete from cache:
          if (cacheContainer) {
            this.cachingService.removeFromObsCache(document.id, cacheContainer);
          }
          this.handleError<any>(`Error creating/updating document in Cosmos DB: ${err}`);
          return EMPTY;
        })
      );

    if (cacheContainer) {
      return this.cachingService.addToObsCache(document.id, cacheContainer, obs);
    } else {
      return obs;
    }
  }

  /**
   * Query collection or cross partition in cosmosDB.
   * @param query string: the query string to query the database
   * @param container string: the cosmosDB container to add/update the document
   * @param partitionKey string (optional): if partition key is not given then query will be made across partition
   * @param continuationData object (optional): if pagination is being used, then need to supply maxItems (number)
   * and continuationToken (string). If this is the first call then set the continuationToken to null.
   */
  // tslint:disable-next-line:max-line-length
  public queryDocuments(query, container, partitionKey: string = null, continuationData: { maxItems: number, continuationToken: string } = null) {
    let uri: string;
    let headers = new HttpHeaders();

    // Add max items and continuation token to headers if any for pagination of response
    if (continuationData) {
      if (continuationData.maxItems) {
        headers = headers.append('x-ms-max-item-count', `${continuationData.maxItems}`);
      }
      if (continuationData.continuationToken) {
        headers = headers.append('x-ms-continuation', `${continuationData.continuationToken}`);
      }
    }

    uri = environment.apiBaseURL + 'Database/QueryDocuments/' +
      container + '/' + query;

    // Add a partition key if supplied to reduce RU cost
    if (partitionKey) {
      uri += '/' + partitionKey;
    }

    return this.http.get<any>(uri, { observe: 'response', headers })
      .pipe(
        catchError(err => (this.handleError<any>(`Error querying documents in Cosmos DB: ${err}`)))
      );
  }

  /**
   * Delete a document from cosmosDB.
   * @param id string: the ID of the document to get
   * @param container string: the cosmosDB container to get document from
   * @param partitionKey string: the partition key associated with the document.
   * @param cacheContainer string: cacheContainer to delete document from, if none provided then cache item will persist till reload.
   */
  public deleteDocument(id: string, container: string, partitionKey: string, cacheContainer: string = null, postTrigger: string = null) {
    let obs: Observable<any>;
    let uri = `${environment.apiBaseURL}Database/DeleteDocument/${container}/${id}/${partitionKey}`;
    if (partitionKey) {
      uri += `/${postTrigger}`;
    }

    obs = this.http.delete<any>(uri, { observe: 'response' })
      .pipe(
        shareReplay(1),
        catchError(err => {
          this.handleError<any>(`Error deleting document from Cosmos DB: ${err}`);
          return EMPTY;
        })
      );

    // if cacheContainer then add response to cache.
    if (cacheContainer) {
      this.cachingService.removeFromObsCache(id, cacheContainer);
    }
    return obs;
  }

  /**
   * Create new user, this function will create the user files and feed document.
   * @param id string: the user id
   * @param sprocInputs string[]: inputs to pass to the user doc creation sproc
   */
  public createNewUser(id, sprocInputs: string[], mailchimpDoc: any) {

    // first add user to mailchimp audience if not there.
    // tslint:disable-next-line:max-line-length
    this.http.post<any>('https://prod-05.uksouth.logic.azure.com:443/workflows/26c60f7ae95b433493ac6d1659fa084f/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=p_W5qBJLnt_jAgP-ZI4I-8p2why3sQRjmGVQmau7SKc',
      mailchimpDoc).pipe(
        catchError(err => (this.handleError<any>(`Error adding user to mailchimp: ${err}`)))
      ).subscribe(data => console.log(data));

    // then create the user.
    return this.http.post<any>(environment.apiBaseURL + 'User/CreateNewUser/' +
      id, sprocInputs, { observe: 'response' })
      .pipe(
        catchError(err => (this.handleError<any>(`Error creating new user: ${err}`)))
      );
  }

  /**
   * Accept a connection request - removing the ids from the user account docs and copying each other's
   * bleeps to their respective feeds
   * @param id string: the user id
   * @param connectId string: the connection user id
   */
  public acceptConnectRequest(id, connectId) {
    return this.http.get<any>(`${environment.apiBaseURL}User/AcceptConnectRequest/${id}/${connectId}`, { observe: 'response' })
      .pipe(
        catchError(err => (this.handleError<any>(`Error accepting connect request: ${err}`)))
      );
  }

  /**
   * Delete a user account along with all of their bleeps, comments, articles, files and messages
   * @param id string: the user id
   */
  public deleteUserAccount(id) {
    return this.http.delete<any>(`${environment.apiBaseURL}User/DeleteUserAccount/${id}`, { observe: 'response' })
      .pipe(
        catchError(err => (this.handleError<any>(`Error deleting user account: ${err}`)))
      );
  }

  /**
   * call sproc in cosmosDB.
   * @param partitionKey string: partition key to call sproc
   * @param container string: the cosmosDB container to call the sproc from
   * @param sprocName string: the cosmosDB sproc to activate
   * @param sprocInputs string[]: the inputs to pass to the cosmosDB sproc
   */
  public callSproc(container: string, partitionKey: string, sprocName: string, sprocInputs: Array<string>) {
    return this.http.post<any>(environment.apiBaseURL + 'Database/CallSproc/' +
      container + '/' + sprocName + '/' + partitionKey, sprocInputs, { observe: 'response' })
      .pipe(
        catchError(err => (this.handleError<any>(`Error calling sproc: ${err}`)))
      );
  }

  // tslint:disable-next-line:max-line-length
  public sendPushNotification(fromUserId: string, toUserId: string, message: string, type: string, template: 'messageTemplate' | 'interactionTemplate', notificationData: any) {
    const jsonNotification = JSON.stringify(notificationData);
    const messageData = {
      message,
      template,
      type,
      contentData: jsonNotification
    };

    // tslint:disable-next-line:max-line-length
    return this.http.post(environment.apiBaseURL + `PushNotification/SendPushNotification/${fromUserId}/${toUserId}`, messageData, { observe: 'response' })
      .pipe(
        catchError(err => (this.handleError<any>(`Error calling sproc: ${err}`)))
      );
  }



  loadUserFeed(userId: string) {
    return this.http.get<any>(environment.apiBaseURL + 'Database/GetDocument/' +
      environment.cosmosDB.feedsContainerId + '/feed-' + userId + '/feed-' + userId, { observe: 'response' })
      .pipe(
        catchError(this.handleError<any>(`Error fetching user feed`))
      );
  }

  updateUser(user) {
    // tslint:disable-next-line:max-line-length
    return this.http.post<any>(`${environment.apiBaseURL}Database/CreateOrUpdateDocument/${environment.cosmosDB.usersContainerId}/${user.userId}`,
      user, { observe: 'response' })
      .pipe(
        catchError(this.handleError<any>(`Error saving article: ${user.fragment.userId}`))
      );
  }

  // FEED FUNCTIONS =====================================================================================

  queryPostsCrossPartition(query: string) {
    return this.http.get<any>(environment.apiBaseURL + 'Database/QueryDocuments/' +
      environment.cosmosDB.bleepsContainerId + '/' + query, { observe: 'response' })
      .pipe(
        catchError(this.handleError<any>(`Error fetching feed: q=${query}`))
      );
  }

  getPost(postId: string) {
    return this.http.get<any>(environment.apiBaseURL + 'Database/GetDocument/' +
      environment.cosmosDB.bleepsContainerId + '/' + postId + '/' + postId)
      .pipe(
        catchError(this.handleError<any>(`Error fetching feed: q=${postId}`))
      );
  }

  // Article FUNCTIONS =====================================================================================

  queryArticlesCrossPartition(query: string) {
    return this.http.get<any>(environment.apiBaseURL + 'Database/QueryDocuments/' +
      environment.cosmosDB.articlesContainerId + '/' + query, { observe: 'response' })
      .pipe(
        catchError(this.handleError<any>(`Error fetching feed: q=${query}`))
      );
  }

  getArticlePreview(id: string) {

    if (this.cache[`articlePrev-${id}`]) {
      return this.cache[`articlePrev-${id}`];
    }

    const query = `SELECT a.title, a.authors, a.feedImage, a.images, a.published, a.createdById FROM a WHERE a.id = "${id}"`;
    return this.cache[`articlePrev-${id}`] = this.http.get<any>(environment.apiBaseURL + 'Database/QueryDocuments/' +
      environment.cosmosDB.articlesContainerId + '/' + query + '/' + id, { observe: 'response' })
      .pipe(
        shareReplay(1),
        catchError(err => {
          delete this.cache[`articlePrev-${id}`];
          this.handleError<any>(`Error fetching article preview: ${id}`);
          return EMPTY;
        })
      );
  }

  // HANDLING AND LOGGING =====================================================================================

  /*
* Handle Http operation that failed.
 * Let the app continue.
 * @param operation - name of the operation that failed
 * @param result - optional value to return as the observable result
 */
  public handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<any> => {
      // Log to App Insights
      this.monitoringService.logException(error);
      // Let the app keep running by returning an empty result.
      return of(error);
    };
  }


}
