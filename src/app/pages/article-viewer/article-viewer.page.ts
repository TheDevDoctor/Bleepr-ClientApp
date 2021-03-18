import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticleService } from 'src/app/services/article.service';
import Quill from 'quill';
import { ViewImageBlot } from 'src/app/editor/blots/ViewImageBlot';
import { ImageLoadingBlot } from 'src/app/editor/blots/imageLoadingBlot';
import { VideoBlot } from 'src/app/editor/blots/VideoBlot';
import { DividerBlot } from 'src/app/editor/blots/dividerBlot';
import { ReferenceBlot } from 'src/app/editor/blots/referenceBlot';
import { SafeUrl } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';
import { Article } from 'src/app/models/article-types';
import { SasGeneratorService } from 'src/app/services/blob_storage/sas-generator.service';
import { UserService } from 'src/app/services/user.service';
import { YoutubeVideoBlot } from 'src/app/editor/blots/youtubeVideoBlot';
import { BleepsService } from 'src/app/services/bleeps.service';
import { BleepModalPage } from '../new-bleep-modal/post.page';
import { ModalController } from '@ionic/angular';
import { CachingService } from 'src/app/services/caching.service';
import { UsersService } from 'src/app/services/users.service';
import { AppBlobService } from 'src/app/services/blob_storage/app-blob-service.service';
import { MonitoringService } from 'src/app/services/monitoring/monitoring.service';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { Observable, interval, of, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-article-viewer',
  templateUrl: './article-viewer.page.html',
  styleUrls: ['./article-viewer.page.scss'],
})
export class ArticleViewerPage implements OnInit {
  @ViewChild('commentContainer') commentContainer: ElementRef<HTMLDivElement>;
  @ViewChild('scrollContainer') scrollContainer;


  private subscriptions: any[];

  public showAllAuthors: boolean;
  public headerImage: SafeUrl;
  public sasToken: string;
  public article: Article;
  public userId: string;
  public userFragment: any;
  public bleepStats: any;
  public bleepLikes: any;
  public liked = false;

  public comments: Array<any> = [];
  private cachedComments;
  private dbComments;
  private cachedRange: { start: number, end: number };
  public commentsContToken: string;
  public isLoadingComment: boolean;

  private timer: number;
  private destroyTimer$: Subject<boolean> = new Subject<boolean>();
  private intervalTimer = interval(1000);
  private alive = true;

  constructor(
    private route: ActivatedRoute,
    private articleService: ArticleService,
    private sasGenerator: SasGeneratorService,
    private router: Router,
    private userService: UserService,
    private usersService: UsersService,
    private bleepsService: BleepsService,
    private modalController: ModalController,
    private cachingService: CachingService,
    private appBlobService: AppBlobService,
    private monitoringService: MonitoringService,
    private analyticsService: AnalyticsService
  ) { }

  public modules = {
    syntax: true
  };

  ngOnInit() {
    this.sasGenerator.getSasToken().subscribe(req => {
      this.sasToken = req.storageAccessToken;
    });

    Quill.register(ViewImageBlot);
    Quill.register(ImageLoadingBlot);
    Quill.register(VideoBlot);
    Quill.register(DividerBlot);
    Quill.register(ReferenceBlot);
    Quill.register(YoutubeVideoBlot);
  }

  public ionViewWillEnter() {
    const id = this.route.snapshot.paramMap.get('id');

    this.articleService.getArticle(id);

    const userSubs = this.userService.returnUser().subscribe(user => {
      if (user) {
        this.userId = user.fragment.userId;
        this.userFragment = user.fragment;
      }
    });

    // send view event for timer;
    this.analyticsService.sendEvent('article_view', this.userId ? this.userId : null, id);

    // set timer to zero and begin timing article read time.
    this.timer = 0;
    this.intervalTimer.pipe(takeUntil(this.destroyTimer$)).subscribe(() => {
      this.timer++;
    });

    this.alive = false;


    const artSubs = this.articleService.returnCurrentArticle().subscribe(article => {
      this.article = article;
      if (this.article) {
        if (this.article.headerImage) {
          if (this.article.headerImage.source === 'unsplash') {
            this.headerImage = this.article.headerImage.id;
          } else {
            // tslint:disable-next-line:max-line-length
            this.headerImage = `${environment.blobStorage.storageUri + this.article.createdById}/media/images/${this.article.headerImage.id}?${this.sasToken}`;
          }
        }

        this.bleepsService.getBleepStats(this.article.bleep).subscribe(res => {
          if (res.ok) {
            this.bleepStats = res.body;
          }
        });

        this.bleepsService.getBleepLikes(this.article.bleep).subscribe(res => {
          if (res.ok) {
            this.bleepLikes = res.body;
            if (this.userId && this.userId in this.bleepLikes.likes) {
              this.liked = true;
            }
          }
        });
        this.getCachedComments();
        this.getComments();
      }
    });
    this.subscriptions = [userSubs, artSubs];
  }

  public expandAuthors() {
    // Log the interaction as an event
    this.monitoringService.logEvent('clicked-article-expandAuthors');
    this.showAllAuthors = !this.showAllAuthors;
  }

  public createAuthorString(reference) {
    let authStr = '';
    reference.authors.forEach((author, index) => {
      const initial = author.firstname.split(/\s/).reduce((response, word) => response += word.slice(0, 1), '');
      authStr += author.surname + ' ' + initial;
      if (index === reference.authors.length - 1) {
        authStr += '. ';
      } else {
        authStr += ', ';
      }
    });

    return authStr;
  }

  public interactionPressed($ev) {
    // Log the interaction as an event
    this.monitoringService.logEvent('clicked-article-' + $ev, { articleId: this.article.id });
    // TODO: switch case?
    if ($ev === 'like') {
      if (this.liked === false) {
        this.addLike();
      } else if (this.liked === true) {
        this.removeLike();
      }
    } else if ($ev === 'share') {
      this.getArticleBleep();
    } else if ($ev === 'comment') {
      const commentPos = this.commentContainer.nativeElement.getBoundingClientRect().top;
      this.scrollContainer.scrollByPoint(0, commentPos, 1000);
    }
  }

  /**
   * Calls the bleepService addLike() method to add a like to the bleep
   */
  public addLike() {
    if (!this.liked) {
      this.bleepsService.addLike(this.article.bleep, this.article.createdById, 'article');
      this.liked = true;
      this.bleepStats.likes++;
    }
  }

  /**
   * Calls the bleepService removeLike() method to remove a like from the bleep
   */
  public removeLike() {
    if (this.liked) {
      this.bleepsService.removeLike(this.article.bleep);
      this.liked = false;
      this.bleepStats.likes--;
    }
  }

  private getArticleBleep() {
    this.bleepsService.getBleep(this.article.bleep).subscribe(bleep => {
      this.presentShareBleep(bleep);
    });
  }

  async presentShareBleep(bleep) {
    const modal = await this.modalController.create({
      component: BleepModalPage,
      componentProps: {
        sharedBleep: bleep
      }
    });
    return await modal.present();
  }

  public editArticle() {
    this.articleService.editPublishedArticle();
    this.router.navigate(['article-editor', this.article.id]);
  }

  public ionViewWillLeave() {
    // stop timer and send read time event.
    this.destroyTimer$.next(true);
    this.analyticsService.sendEvent('article_read_time', this.userId ? this.userId : null, this.article.id, this.timer);

    // set article to null
    this.article = null;
    this.articleService.setCurrentArticle(this.article);

    // unsubscribe (TODO: This can all be done with the destroy logic and takeUntil() now you understand it)
    this.subscriptions.forEach(subs => subs.unsubscribe());
  }


  // TODO: commenting functions, would be nice if we can put this all in one comment component for both:
  /**
   * Get the comments that are cached for this bleep.
   */
  private getCachedComments() {
    this.cachedComments = this.cachingService.getSortedList('comments', undefined, this.article.bleep);
    if (this.cachedComments.length > 0) {
      this.cachedRange = this.cachingService.returnDocumentsEpoch('comments', undefined, this.article.bleep);
    }
  }

  /**
   * Calls the bleepService getComments() method to load comments for this bleep. Gets the comments from the database that are
   * outside of the timestamps for the most recent and oldest comment. Cached comments are inserted at the appropriate timestamp.
   */
  public getComments() {
    // if the commentsContToken is null then that means there are no more comments to get from the database for this bleep.
    if (this.commentsContToken !== null) {
      this.isLoadingComment = true;

      this.bleepsService.fetchComments(this.article.bleep, this.commentsContToken, this.cachedRange).subscribe(commentsResp => {
        if (commentsResp.ok) {
          // Reverse the comment order to display in the correct orientation.
          const comments = commentsResp.body.Documents.reverse();

          // Get the continuation token for the query, if no more it will equal null.
          this.commentsContToken = commentsResp.headers.get('x-ms-continuation');

          // if cached comments in array then check if the cached comments need to be inserted at this point. This is done based
          // on timestamp.
          if (this.cachedComments.length > 0) {
            const cacheIndex = this.checkInCachedRange(comments);
            if (cacheIndex !== undefined) {
              comments.splice(cacheIndex, 0, ...this.cachedComments);
              this.cachedComments = [];
            }
          }

          // add user fragment data to comment and append the relevant data to the comment for displaying.
          comments.forEach((comment, index) => {
            this.usersService.getUserFragment(comment.createdById).subscribe(frag => {
              const fragment = frag.body;
              comments[index].meta = {};
              comments[index].meta.creatorName = fragment.firstname + ' ' + fragment.surname;
              if (fragment.specialty && fragment.grade) {
                comments[index].meta.creatorPosition = fragment.specialty + ' ' + fragment.grade;
              } else {
                comments[index].meta.creatorPosition = fragment.profession;
              }

              // used to track if the comment is being edited currently.
              comments[index].meta.isEditing = false;

              // get the profile pic if exists ortherwise set placeholder image.
              comments[index].meta.profilePic = 'assets/blank_user.svg';
              this.appBlobService.checkBlobExists(fragment.userId, 'profile-pictures').subscribe(exists => {
                if (exists) {
                  comments[index].meta.profilePic = environment.blobStorage.storageUri + 'profile-pictures/' + fragment.userId;
                }
              });
            });
          });

          // get stats for the comments:
          this.bleepsService.getCommentStats(comments.map(comment => comment.id), this.article.bleep).subscribe(data => {
            const statsDocs = data.body.Documents;
            statsDocs.forEach(doc => {
              const commentId = doc.id.substr(doc.id.indexOf('-') + 1);
              const index = comments.findIndex(e => e.id === commentId);
              comments[index].meta.stats = {
                likes: doc.likes
              };
            });
          });

          // get likes for the comments:
          this.bleepsService.getCommentLikes(comments.map(comment => comment.id), this.article.bleep).subscribe(data => {
            const likesDocs = data.body.Documents;
            likesDocs.forEach(doc => {
              const commentId = doc.id.substr(doc.id.indexOf('-') + 1);
              const index = comments.findIndex(e => e.id === commentId);
              comments[index].meta.likes = doc.likes;

              if (this.userFragment && this.userFragment.userId in doc.likes) {
                comments[index].meta.isLiked = true;
              }
            });
          });

          // add the comments at the begginging of the array.
          this.comments = comments.concat(this.comments);
          this.isLoadingComment = false;
        } else {
          // TODO: add UI to show error to user
          this.monitoringService.logException(new Error(`Error while getting comments for article ${this.article.id}`), 2);
        }
      });
      // if cached comments are still in the array then these need to be appended to the comments as they must be after all comments
      // returned from the database.
    } else if (this.cachedComments.length > 0) {
      this.comments = this.cachedComments.concat(this.comments);
      this.cachedComments = [];
    }
  }

  private checkInCachedRange(dbComments) {

    // the only time dbComment will be 0 is if there are no new comments before, or older comments after, the comments already
    // in the cache. Therefore returns 0 to splice the comments in at the start index.
    if (dbComments.length === 0) {
      return 0;
    }

    // if the first element in the dbComments timestamp is greater than, and therefore done after the first element in the cached
    // comments, we know the cached comments are not inserted here.
    if (dbComments[0].timestamp > this.cachedComments[0].timestamp) {
      if (dbComments.length < 5) {
        return 0;
      } else {
        return;
      }
    }

    // if in the range of these comments, then find the index at which the comments should be inserted.
    for (let i = dbComments.length - 1; i >= 0; i = i - 1) {
      if (dbComments[i].timestamp < this.cachedComments[0].timestamp) {
        return i + 1;
      }
    }
  }

  public onLikeComment(event) {
    if (event.isLiked) {
      this.likeComment(event.comment);
    } else {
      this.unlikeComment(event.comment);
    }
  }

  /**
   * Likes a comment.
   * @param comment: the comment to like
   */
  private likeComment(comment) {
    this.bleepsService.likeComment(comment);
  }

  /**
   * Unlikes a comment.
   * @param comment: the comment to unlike
   */
  private unlikeComment(comment) {
    this.bleepsService.unlikeComment(comment);
  }


  /**
   * updates the comment with the new comment info. Will store all edits in the edit field of the comment.
   * @param commentData: the id and updated text of the updated comment.
   */
  updateComment(commentData: { id: string, text: string }) {
    // get the index of the updated bleep.
    const idx = this.comments.findIndex((e) => e.id === commentData.id);

    // make sure the text is actually different.
    if (this.comments[idx].text !== commentData.text) {

      // remove the metadata from the comment as this should not be stored in db.
      const { meta, ...editedComment } = this.comments[idx];

      // add the edited field if not present.
      if (!editedComment.edit) {
        editedComment.edit = {};
        editedComment.edit[editedComment.timestamp] = editedComment.text;
      }

      // add the current edit and it's timestamp.
      editedComment.edit[Date.now()] = commentData.text;

      // update the text in the bleep.
      editedComment.text = commentData.text;

      // update the comment. When succesfully updated update the comment in the comments.
      this.bleepsService.updateComment(editedComment).subscribe(res => {
        if (res.ok) {
          const ix = this.comments.findIndex((e) => e.id === commentData.id);
          const comment = this.comments[ix];
          comment.text = commentData.text;
          comment.edit = editedComment.edit;
          comment.meta.isEditing = false;
          this.cachingService.addToObjectCache(comment.id, 'comments', comment, comment.bleep);
        }
      });
    }
  }

  /**
   * Delete the comment with the specified comment Id
   * @param commentId: the id of the comment to delete.
   */
  deleteComment(commentId) {
    const idx = this.comments.findIndex((e) => e.id === commentId);
    this.comments.splice(idx, 1);
    this.bleepStats.comments = this.bleepStats.comments - 1;
  }

  /**
   * Calls the bleepService createBleepComment() method to add a comment to the bleep
   */
  public sendComment(commentText) {
    this.bleepsService.createComment(commentText, this.article.bleep).subscribe(response => {
      if (response.ok) {
        // If we were able to add the comment to the DB, add it locally
        const comment = response.body;
        comment.meta = {};
        comment.meta.creatorName = this.userFragment.firstname + ' ' + this.userFragment.surname;
        if (this.userFragment.specialty && this.userFragment.grade) {
          comment.meta.creatorPosition = this.userFragment.specialty + ' ' + this.userFragment.grade;
        } else {
          comment.meta.creatorPosition = this.userFragment.profession;
        }
        comment.meta.isEditing = false;
        this.appBlobService.checkBlobExists(this.userFragment.userId, 'profile-pictures').subscribe(exists => {
          if (exists) {
            comment.meta.profilePic = environment.blobStorage.storageUri + 'profile-pictures/' + this.userFragment.userId;
          }
        });
        this.comments.push(comment);

        // add the new comment to the object cache.
        this.cachingService.addToObjectCache(comment.id, 'comments', comment, comment.bleep);

        // Then increment the comments number by 1
        this.bleepStats.comments++;
      } else {
        // TODO: add some alert on the UI that the comment was unable to be added
      }
    });
  }

}
