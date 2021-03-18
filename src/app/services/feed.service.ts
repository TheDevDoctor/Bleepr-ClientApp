import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { DatabaseService } from './database.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CachingService } from './caching.service';
import { Plugins } from '@capacitor/core';
import { MonitoringService } from './monitoring/monitoring.service';

const { App } = Plugins;

@Injectable({
  providedIn: 'root'
})
export class FeedService {
  user: any;
  // The user feed array doc containing the list of bleepIds to show on their feed
  userFeed = [];
  userFeed$ = new Subject<any[]>();
  // The bleep documents downloaded from the list specified in the feed array
  feedBleeps: any[];
  feedBleeps$ = new BehaviorSubject<any[]>(this.feedBleeps);
  // The stats documents for the downloaded bleeps
  feedBleepsStats = {};
  feedBleepsStats$ = new BehaviorSubject<{}>(null);
  // The likes documents for the downloaded bleeps
  feedBleepLikes = {};
  feedBleepLikes$ = new BehaviorSubject<{}>(null);

  refreshingFeed = new BehaviorSubject<boolean>(false);

  feedStart: number;
  feedEnd: number;
  feedIncrement = 9;
  startIndex$: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  constructor(
    private userService: UserService,
    private dataService: DatabaseService,
    private cachingService: CachingService,
    private monitoringService: MonitoringService
  ) {
    this.userService.returnUser().subscribe(usr => {
      this.user = usr;
    });
    this.addStateChangeListener();
  }

  /**
   * Gets the user feed document from the database containing an array of bleep IDs.
   * If update bleeps is set to true, then the function will also update the users
   * feedBleeps and display this in the feed UI.
   */
  private getUserFeed(updateBleeps: boolean) {
    this.refreshingFeed.next(true);
    this.dataService.loadUserFeed(this.user.fragment.userId).subscribe(feedResp => {
      if (feedResp.ok) {
        // checks to see if feed document has changed.
        if ((this.userFeed.length > 0 && feedResp.body.feed[0].id !== this.userFeed[0].id) || this.userFeed.length === 0) {
          this.userFeed = feedResp.body.feed;
          this.userFeed$.next(this.userFeed);
          if (updateBleeps && this.userFeed.length > 0) {
            this.updateBleeps();
          }
        } else {
          this.refreshingFeed.next(false);
        }

      } else {
        // TODO: add UI to show error to user
        this.monitoringService.logException(new Error(`Error while loading feed for user ${this.user.fragment.userId}`), 1);
      }
    });
  }

  /**
   * Refreshes the feed document and then updates the feed Bleeps.
   */
  public refreshFeed() {
    this.getUserFeed(true);
  }

  /**
   * Sets the users feed document.
   * @param feedDoc: the feed document to update.
   * @param updateBleeps: (boolean), if true will also update the users feedBleeps and
   * display this in the UI.
   */
  public setUserFeed(feedDoc: any, updateBleeps: boolean) {
    this.userFeed = feedDoc.feed;
    this.userFeed$.next(this.userFeed);
    if (updateBleeps) {
      this.updateBleeps();
    }
  }

  /**
   * Refreshes the feed document without updating the feed Bleeps.
   */
  private backgroundRefreshFeed() {
    this.getUserFeed(false);
  }

  /**
   * Called when a new feed document has been recieved and the bleep variables need to reset.
   */
  public updateBleeps() {
    this.resetFeedVariables();
    this.fetchBleeps();
  }

  /**
   * Resets the feed variables by first clearing the bleeps. Then sets the start index to 0.
   * Then sets the userFeed end variable which is where the fetching of bleeps should stop.
   * If the feed increment is longer that the feed document then this will reset to length
   * of feed document.
   */
  private resetFeedVariables() {
    this.feedBleeps = [];
    this.feedStart = 0;
    if ((this.userFeed.length - 1) < this.feedIncrement) {
      this.feedEnd = this.userFeed.length - 1;
    } else {
      this.feedEnd = this.feedIncrement;
    }
    this.feedBleeps$.next(this.feedBleeps);
  }

  /**
   * Fetches Bleeps from Cosmos DB using the userFeed array of bleep IDs and updates feedBleeps[].
   * Fetches the bleeps between the feedStart number and feedEnd number.
   */
  public fetchBleeps() {
    const feedSQL = this.constructINSQLQuery(this.userFeed, 'feed', { start: this.feedStart, end: this.feedEnd }, true);
    if (feedSQL !== null) {
      const query = `SELECT * FROM bleeps b WHERE b.type != "comment" AND b.id IN (${feedSQL}) ORDER BY b.timestamp DESC`;
      this.dataService.queryPostsCrossPartition(query).subscribe(response => {
        if (response.ok) {
          this.addBleepsToFeed(response.body.Documents);
        } else {
          // TODO: add UI to show error to user
          this.monitoringService.logException(new Error(`Error loading latest bleeps for user's feed, user: ${this.user.fragment.id}`), 1);
        }
      });
    } else {
      this.addBleepsToFeed([]);
    }
  }

  /**
   * sorts the Bleeps recieved from the database according to the feed document, will check in the cache if not found in
   * query response.
   */
  addBleepsToFeed(queryResponse) {
    const sortedBleeps = this.sortFeedBleeps(queryResponse);
    if (sortedBleeps.length > 0) {
      this.feedBleeps = this.feedBleeps.concat(sortedBleeps);
      this.feedBleeps$.next(this.feedBleeps);
      this.incrementReqTracker();
      this.startIndex$.next(this.feedStart);
    } else {
      // In the unlikely circumstance all the bleeps in the next segment of the feed have been deleted,
      // then should make another fetch for bleeps.
      this.incrementReqTracker();
      this.startIndex$.next(this.feedStart);
      if (this.feedStart !== null) {
        this.fetchBleeps();
      }
    }

    this.refreshingFeed.next(false);
  }

  /**
   * Sort the response according to the feed, combining the response from the database and cached responses.
   * First will check to see if the bleeps are in the response from the database, not then will get bleep
   * from cache.
   */
  sortFeedBleeps(databaseResponse) {
    const bleeps = [];
    // this for loop filters through the feed id's of those just requested. It then checks to see if they are in the response,
    // if not checks the cache as those Bleeps in the cache will have been removed from the request.
    for (let i = this.feedStart; i <= this.feedEnd; i++) {
      const id = this.userFeed[i].id;

      const databaseIndex = databaseResponse.findIndex(b => b.id === id);
      // if present in the request body then add to Bleeps and add to cache. If not present check cache.
      if (databaseIndex > -1) {
        bleeps.push(databaseResponse[databaseIndex]);
        this.cachingService.addToObjectCache(id, 'bleeps', databaseResponse[databaseIndex]);
      } else {
        const bleep = this.cachingService.checkObjectCache(id, 'bleeps');
        if (bleep) {
          bleeps.push(bleep);
        }
      }
    }
    // get metadata for the bleeps that are being added to the feed.
    this.getBleepsMetadata(bleeps);
    return bleeps;
  }

  /**
   * Gets the bleep metadata for a set of bleeps
   */
  getBleepsMetadata(bleeps) {
    this.fetchBleepStatsData(bleeps).subscribe(res => {
      if (res.ok) {
        const statsData = this.convertArrayToDict(res.body.Documents);
        this.feedBleepsStats = { ...this.feedBleepsStats, ...statsData };
        this.feedBleepsStats$.next(this.feedBleepsStats);
      } else {
        console.log('There was an error getting the stats docs for feed.');
      }
    });
    this.fetchBleepsLikesData(bleeps).subscribe(res => {
      if (res.ok) {
        const likesData = this.convertArrayToDict(res.body.Documents);
        this.feedBleepLikes = { ...this.feedBleepLikes, ...likesData };
        this.feedBleepLikes$.next(this.feedBleepLikes);
      } else {
        console.log('There was an error getting the likes docs for feed.');
      }
    });
  }

  /**
   * Increments the feed tracker values by the defined feed increment amount. If the full feed has been recieved then
   * the values are set to null.
   */
  incrementReqTracker() {
    this.feedStart += this.feedIncrement + 1;
    this.feedEnd += this.feedIncrement + 1;

    if (this.feedStart > this.userFeed.length - 1) {
      this.feedStart = null;
      this.feedEnd = null;
    } else if ((this.userFeed.length - 1) < this.feedEnd) {
      this.feedEnd = this.userFeed.length - 1;
    }
  }

  /**
   * Fetches likes for an array of Bleeps and returns the observable.
   */
  public fetchBleepsLikesData(bleeps: any[]) {
    const docsSQL = this.constructINSQLQuery(bleeps, 'likes');
    const query = `SELECT * FROM bleeps b WHERE b.id IN (${docsSQL})`;
    return this.dataService.queryDocuments(query, environment.cosmosDB.bleepsContainerId);
  }

  /**
   * Fetches stats docs for an array of Bleeps and returns the observable.
   */
  public fetchBleepStatsData(bleeps: any[]) {
    const docsSQL = this.constructINSQLQuery(bleeps, 'stats');
    const query = `SELECT * FROM bleeps b WHERE b.id IN (${docsSQL})`;
    return this.dataService.queryDocuments(query, environment.cosmosDB.bleepsContainerId);
  }

  /**
   * Converts an array (user feed array of bleep IDs/array of stats/likes docs) to a SQL IN string starting at a particular
   * start and end point, as specified by range obj. Also checks the cache if checkCache is true. If the obj is in the
   * cache then this id will not be included in query string. Does not check cache for likes and stats as these need to be
   * regularly updated.
   */
  private constructINSQLQuery(collection: any, type: string, range: { start: number, end: number } = null, checkCache: boolean = false) {
    let query = '';
    let start: number;
    let end: number;

    if (range) {
      start = range.start;
      end = range.end;
    } else {
      start = 0;
      end = collection.length - 1;
    }

    for (let i = start; i <= end; i++) {
      if (type === 'feed') {
        if (checkCache && this.cachingService.checkObjectCache(collection[i].id, 'bleeps', 600)) {
          continue;
        }
        query += `"${collection[i].id}"`;
      } else if (type === 'stats' || type === 'likes') {
        query += `"${type}-${collection[i].id}"`;
      }
      // Add a comma only if it isn't the last element to prevent SQL query error
      if (i <= end - 1) {
        query += ', ';
      }
    }
    // needs this check as checking the cache may result in comma at the end of query, TODO: think of better solution.
    if (query.slice(-2) === ', ') {
      query = query.substring(0, query.length - 2);
    }

    // this may happen if all the Bleeps are found in the cache and therefore don't have to be queried for.
    if (query === '') {
      return null;
    }
    return query;
  }

  /**
   * Helper method for converting array of cosmos docs to dictionary with id keys
   * @param docsArray the array of documents to process
   */
  private convertArrayToDict(docsArray) {
    // Convert the array response to a dict so we can consume in templates via stats[id] / likes[id]
    const responseDict: any = {};
    const idKey = 'id';
    for (const doc of docsArray) {
      // Take the id of the document and remove the 'stats-' or 'likes-' prefix for easy ref
      const key = doc[idKey].slice(6);
      responseDict[key] = doc;
    }
    return responseDict;
  }

  /**
   * adds user bleep to feed, should be called after successful document creation in the
   * bleeps cosmos db container
   * @param bleep: bleep to add to the user feed
   */
  public addBleepToFeed(bleep) {
    const index = this.feedBleeps.findIndex(b => b.id === bleep.id);
    if (index === -1) {
      this.feedBleeps.unshift(bleep);
    } else {
      this.feedBleeps.splice(index, 1, bleep);
    }
    this.getBleepsMetadata([bleep]);

    this.feedBleeps$.next(this.feedBleeps);
  }

  public removeBleepFromFeed(bleepIds: string[]) {
    if (bleepIds.length > 0) {
      const feedId = `feed-${this.user.fragment.userId}`;
      const sprocInputs = [feedId, JSON.stringify(bleepIds)];

      this.dataService.callSproc('feeds', feedId, 'removeFromFeedSproc', sprocInputs).subscribe(res => {
        if (res.ok) {
          // remove bleeps from caching service and bleep array locally:
          bleepIds.forEach(id => {
            this.cachingService.removeFromObjectCache(id, 'bleeps');
            const index = this.feedBleeps.findIndex(b => b.id === id);
            this.feedBleeps.splice(index, 1);
          });

          // need to edit start and end variables as have removed ids from feed array.
          if (this.feedStart) {
            this.feedStart = this.feedStart - bleepIds.length;
          }
          if (this.feedEnd) {
            this.feedEnd = this.feedEnd - bleepIds.length;
          }

          // update the feed bleeps and feed doc observables.
          this.feedBleeps$.next(this.feedBleeps);
          this.setUserFeed(res.body, false);
        }

      });
    }


  }

  /**
   * returns the bleep document from the feed, if it is present.
   * @param bleepId string: bleep id of the bleep data you want to return.
   */
  public getBleepFromFeed(bleepId) {
    const index = this.feedBleeps.findIndex(b => b.id === bleepId);
    return this.feedBleeps[index];
  }

  /**
   * Returns an observable of the feedBleeps[] array
   * @returns Observable: Array[] containing current feedBleeps
   */
  public returnBleeps() {
    return this.feedBleeps$.asObservable();
  }

  /**
   * Returns an observable of the feedBleepsStats{} object
   * @returns Observable: Array[] containing current feedBleepsStats
   */
  public returnBleepsStats() {
    return this.feedBleepsStats$.asObservable();
  }

  /**
   * Returns an observable of the feedbleepLikes doc
   * @returns Observable: Array[] containing current feedBleepsStats
   */
  public returnBleepLikes() {
    return this.feedBleepLikes$.asObservable();
  }

  public returnStartIndex() {
    return this.startIndex$.asObservable();
  }

  public returnStaticStartIndex() {
    return this.feedStart;
  }

  public isRefreshingFeed() {
    return this.refreshingFeed.asObservable();
  }


  private async addStateChangeListener() {
    App.addListener('appStateChange', (state) => {
      if (state.isActive) {
        // check to see that user document is present.
        if (this.user.fragment) {
          this.refreshFeed();
        }
      }
    });
  }
}
