import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { environment } from 'src/environments/environment';
import { UserService } from './user.service';
import * as uuid from 'uuid';
import { BlobUploadsViewStateService } from './blob_storage/blob-uploads-view-state.service';
import { Subject, Observable, of } from 'rxjs';
import { FeedService } from './feed.service';
import { CachingService } from './caching.service';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { NotificationsService } from './notifications.service';
import { ReportContentPage } from '../modals/report-content/report-content.page';
import { MonitoringService } from './monitoring/monitoring.service';
import { ModalController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
/**
 * Bleeps Service: for any backend interactions with individual bleeps
 */
export class BleepsService {

  private user: any;
  private newBleep: any;

  // this works by updating the relevant values when each action complete.
  // Only when both are returned as false should the bleep be considered successful.
  private isUploading: Subject<boolean> = new Subject<boolean>();

  constructor(
    private userService: UserService,
    private dataService: DatabaseService,
    private feedService: FeedService,
    private cachingService: CachingService,
    private http: HttpClient,
    private notificationService: NotificationsService,
    private modalController: ModalController,
    private monitoringService: MonitoringService
  ) {
    this.userService.returnUser().subscribe(user => {
      this.user = user;
    });

  }

  /**
   * Adds a like to the specified bleep
   * @param bleepId string: the ID of the Bleep to add a like to
   */
  public addLike(bleepId: string, createdById: string, contentType: string) {
    this.editLike(bleepId, this.user.fragment.userId, 'add', bleepId, createdById, contentType);
  }

  /**
   * Removes a like from the specified bleep
   * @param bleepId string: the ID of the Bleep to remove a like from
   */
  public removeLike(bleepId: string) {
    this.editLike(bleepId, this.user.fragment.userId, 'remove', bleepId);
  }

  /**
   * Adds or removes a like to the selected Bleep
   * @param docId string: the ID of the bleep or comment to add/remove a like to/from
   * @param userId the id of the user liking the comment
   * @param operation string: add or remove
   */
  // tslint:disable-next-line:max-line-length
  private editLike(docId: string, userId: string, operation: 'add' | 'remove', partitionKey: string, createdById?: string, contentType?: string) {
    const sprocLikeInputs = [docId, userId, operation];
    return this.dataService.callSproc(
      environment.cosmosDB.bleepsContainerId,
      partitionKey,
      'addOrRemoveLike',
      sprocLikeInputs
    ).subscribe(feedResp => {
      if (feedResp.ok) {
        if (operation === 'add' && userId !== createdById) {
          if (contentType === 'comment') {
            this.notificationService.sendLikeNotification(partitionKey, userId, createdById, contentType, Date.now(), docId);
          } else {
            this.notificationService.sendLikeNotification(docId, userId, createdById, contentType, Date.now());
          }
        }
        return feedResp.body;
      } else {
        // TODO: add UI to show error to user
        this.monitoringService.logException(new Error(`Error while adding like to ${docId}`), 2);
      }
    });
  }

  /**
   * returns comments from Cosmos DB for the given bleep ID, if given continuation token will continue continuation query.
   * TODO: add caching of current comments
   */
  public fetchComments(bleepId: string, contToken = null, epoch?: { start: number, end: number }) {

    let query;
    if (epoch) {
      const queryRange = `(c.timestamp > ${epoch.end} OR c.timestamp < ${epoch.start})`;
      query = `SELECT * FROM comments c WHERE c.type = "comment" AND c.bleep = "${bleepId}" AND ${queryRange} ORDER BY c.timestamp DESC`;
    } else {
      query = `SELECT * FROM comments c WHERE c.type = "comment" AND c.bleep = "${bleepId}" ORDER BY c.timestamp DESC`;
    }

    return this.dataService.queryDocuments(query, environment.cosmosDB.bleepsContainerId,
      null, { maxItems: 5, continuationToken: contToken }).pipe(
        map(res => {
          if (res.ok) {
            const comments = res.body.Documents;
            comments.forEach(comment => {
              this.cachingService.addToObjectCache(comment.id, 'comments', comment, bleepId);
            });
          }
          return res;
        })
      );
  }

  /**
   * Create a Bleep. bleep.type refers to the type of Bleep to send.
   * @param bleep the file to pass to the database
   */
  public createBleep(bleepFile: any) {
    this.newBleep = null;
    const randomId = uuid.v4();
    const uploadFileNames: string[] = [];
    const files = [];
    const bleep: any = {
      id: randomId,
      bleep: randomId,
      timestamp: Date.now(),
      createdById: this.user.fragment.id,
      privacy: bleepFile.privacy,
      body: bleepFile.body,
      tags: bleepFile.tags,
      type: bleepFile.type
    };

    if (bleep.type === 'image') {
      // map images into array depending on source.
      bleep.image = bleepFile.image.map(img => {
        return {
          source: img.source === 'unsplash' ? img.uri : img.guid,
          type: img.source
        };
      });

    } else if (bleep.type === 'video') {

      bleep.video = bleepFile.video.map(vid => {
        return {
          source: vid.source === 'youtube' ? vid.uri : vid.guid,
          type: vid.source
        };
      });

    } else if (bleep.type === 'document') {
      bleep.document = bleepFile.document.map(document => {
        return document = {
          id: document.guid,
          name: document.filename
        };
      });
    } else if (bleep.type === 'article') {
      bleep.articleId = bleepFile.articleId;
      // set to same id as article
      bleep.id = bleep.articleId;
      bleep.bleep = bleep.articleId;
    }

    bleep.link = bleepFile.link;

    if (bleep.type === 'share') {
      bleep.shared = { id: bleepFile.shared };
    }

    return this.dataService.createIfNotExists(bleep, environment.cosmosDB.bleepsContainerId,
      bleep.bleep, 'bleeps', 'createLikesAndStatsDocsPostTrigger').pipe(
        map(res => {
          if (res.ok) {
            this.newBleep = res.body;
            this.feedService.addBleepToFeed(this.newBleep);
            // Call sproc to update share stat
            if (bleep.type === 'share') {
              const sprocShareInputs = [bleep.shared.id, 'add'];
              this.dataService.callSproc(
                environment.cosmosDB.bleepsContainerId,
                bleep.shared.id,
                'addOrRemoveShare',
                sprocShareInputs
              ).subscribe(resp => {
                if (!resp.ok) {
                  // Log exception to App Insights
                  this.monitoringService.logException(new Error(`Error while updating share stats for ${bleep.id}`), 1);
                }
              });
            }
          } else {
            // TODO: add UI to show error to user
            this.monitoringService.logException(new Error('Unable to post bleep to db successfully: ' + res), 1);
          }
          return res;
        }));
  }

  /**
   * Update the bleep with the edits.
   * @param bleepId the bleepId to update.
   */
  public updateBleep(bleep: any, update: any) {

    // if no editing data add initial data.
    if (!bleep.edit) {
      bleep.edit = {};
      bleep.edit[bleep.timestamp] = bleep.body;
    }

    if (bleep.body !== update.body) {
      // add the current edit.
      bleep.edit[Date.now()] = update.body;
      bleep.body = update.body;
    }

    bleep.tags = update.tags;

    // update the body
    bleep.privacy = update.privacy;

    this.dataService.createOrUpdateDocument(bleep, environment.cosmosDB.bleepsContainerId, bleep.bleep, 'bleeps').subscribe(res => {
      if (res.ok) {
        this.cachingService.addToObjectCache(bleep.id, 'bleeps', res.body);
        this.feedService.addBleepToFeed(res.body);
      }
    });
  }

  /**
   * Delete a bleep. Will also delete associated stats and likes files.
   * @param bleepId the bleepId to delete.
   */
  public deleteBleep(bleep: any, editArticle = true) {
    // tslint:disable-next-line:max-line-length
    const deleteObs = this.dataService.deleteDocument(bleep.id, environment.cosmosDB.bleepsContainerId, bleep.id, 'bleeps', 'deleteLikesAndStatsDocument');
    deleteObs.subscribe(res => {
      if (res.ok) {
        this.feedService.removeBleepFromFeed([bleep.id]);

        // if the bleep deleted is of type article, then the article should now be set to draft.
        if (bleep.type === 'article' && editArticle) {
          this.dataService.callSproc('articles', bleep.articleId, 'changeArticleStage', [bleep.articleId, 'draft'])
            .subscribe(state => console.log(state));
        }
      }
    });
    return deleteObs;
  }

  /**
   * Delete a bleep. Will also delete associated stats and likes files.
   * @param comment the bleepId to delete.
   */
  public deleteComment(comment: any) {
    return this.dataService.deleteDocument(comment.id, environment.cosmosDB.bleepsContainerId, comment.bleep, null,
      'deleteCommentUpdateStatsPostTrigger').pipe(
        map(res => {
          if (res.ok) {
            this.cachingService.removeFromObjectCache(comment.id, 'comments', comment.bleep);
          }
          return res;
        })
      );
  }

  /**
   * Create a comment document of a Bleep and send the comment to CDB.
   * @param commentText string: the user's comment text
   * @param bleepId string: ID of the Bleep to link the comment to
   */
  public createComment(commentText: string, bleepId: string) {
    const comment = {
      id: uuid.v4(),
      text: commentText,
      timestamp: Date.now(),
      createdById: this.user.fragment.userId,
      bleep: bleepId,
      type: 'comment'
    };

    return this.dataService.createIfNotExists(comment, 'bleeps', comment.bleep, null, 'createCommentUpdateStatsPostTrigger');
  }

  public getLinkPreview(link): Observable<any> {
    // check for observable to avoid multiple calls to db.
    let cache = this.cachingService.checkObsCache(link, 'linkPreviews');
    if (cache) {
      return cache;
    }

    // check for object cache if searched for previously.
    cache = this.cachingService.checkObjectCache(link, 'linkPreviews');
    if (cache) {
      return of(cache);
    }

    const observable = this.http.get<any>('https://api.linkpreview.net/?key=5e35b6e5221d8ed0fea28d2f660b4a02b07af5e433fe8&q='
      + link).pipe(
        map(data => {
          this.cachingService.addToObjectCache(link, 'linkPreviews', data);
          return data;
        }));
    this.cachingService.addToObsCache(link, 'linkPreviews', observable);
    return observable;
  }

  public getBleep(bleepId): Observable<any> {

    // check if bleep is in object cache first:
    const bleep = this.cachingService.checkObjectCache(bleepId, 'bleeps');
    if (bleep) {
      return of(bleep);
    }

    // return observable if not.
    return this.dataService.getDocument(bleepId, 'bleeps', bleepId, 'bleeps').pipe(
      map(res => {
        if (res.ok) {
          this.cachingService.addToObjectCache(res.body.id, 'bleeps', res.body);
        }
        return res.body;
      })
    );
  }

  public getBleepStats(bleepId) {
    return this.dataService.getDocument('stats-' + bleepId, 'bleeps', bleepId, 'bleepStats');
  }
  public getBleepLikes(bleepId) {
    return this.dataService.getDocument('likes-' + bleepId, 'bleeps', bleepId, 'bleepLikes');
  }

  public getCommentStats(commentIds: string[], bleepId: string) {

    const query = `SELECT * FROM comments c WHERE c.type = "stats" AND c.id IN ("stats-${commentIds.join('", "stats-')}")`;
    return this.dataService.queryDocuments(query, 'bleeps', bleepId);
  }

  public getCommentLikes(commentIds: string[], bleepId: string) {
    const query = `SELECT * FROM comments c WHERE c.type = "likes" AND c.id IN ("likes-${commentIds.join('", "likes-')}")`;
    return this.dataService.queryDocuments(query, 'bleeps', bleepId);
  }

  public likeComment(comment) {
    this.editLike(comment.id, this.user.fragment.userId, 'add', comment.bleep, comment.createdById, 'comment');
  }

  public unlikeComment(comment) {
    this.editLike(comment.id, this.user.fragment.userId, 'remove', comment.bleep);
  }

  /**
   * Update Comment.
   * @param commentText string: the user's comment text
   * @param bleepId string: ID of the Bleep to link the comment to
   */
  public updateComment(comment) {
    return this.dataService.createOrUpdateDocument(comment, 'bleeps', comment.bleep);
  }

  async reportBleep(content) {
    // this.mo
    const modal = await this.modalController.create({
      component: ReportContentPage,
      componentProps: {
        content
      }
    });
    return await modal.present();
  }

  public sendBleepReport(content, report) {
    const reportDoc = {
      id: `report-${content.id}`,
      bleep: content.bleep,
      type: 'report',
      issue: report.issue,
      description: report.description
    };

    console.log(content);

    return this.dataService.createIfNotExists(reportDoc, 'bleeps', content.bleep);
  }
}
