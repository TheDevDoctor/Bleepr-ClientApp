import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { BleepModalPage } from 'src/app/pages/new-bleep-modal/post.page';
import { BleepsService } from 'src/app/services/bleeps.service';
import { UsersService } from '../../../../services/users.service';
import { CachingService } from 'src/app/services/caching.service';
import { AppBlobService } from 'src/app/services/blob_storage/app-blob-service.service';
import { environment } from 'src/environments/environment';
import { MonitoringService } from 'src/app/services/monitoring/monitoring.service';
import { AnalyticsService } from 'src/app/services/analytics.service';

@Component({
  selector: 'app-feed-card',
  templateUrl: './feed-card.component.html',
  styleUrls: ['./feed-card.component.scss'],
})
export class FeedCardComponent implements OnChanges {
  @Input() bleep: any;
  @Input() stats: any;
  @Input() userFragment: any;

  @Input() showComments = false;

  public likes: any;
  public sendingComment: boolean;

  @Input()
  set setLikes(val: any) {
    this.likes = val;
    if (this.likes && (this.userFragment.userId in this.likes.likes)) {
      this.liked = true;
    }
  }

  public comments: Array<any> = [];
  private cachedComments;
  private dbComments;
  private cachedRange: { start: number, end: number };
  public commentsContToken: string;
  public isLoadingComment = false;
  public liked = false;

  constructor(
    private bleepsService: BleepsService,
    private modalController: ModalController,
    private usersService: UsersService,
    private cachingService: CachingService,
    private appBlobService: AppBlobService,
    private monitoringService: MonitoringService,
    private analyticsService: AnalyticsService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.bleep) {
      if (changes.bleep.currentValue !== changes.bleep.previousValue) {
        this.commentsContToken = undefined;
        this.comments = [];
        this.getCachedComments();
        if (this.showComments) {
          this.getComments();
        }
      }
    }
  }

  /**
   * Calls the bleepService addLike() method to add a like to the bleep
   */
  public addLike() {
    if (!this.liked) {
      this.bleepsService.addLike(this.bleep.id, this.bleep.createdById, this.bleep.type);
      this.liked = true;
      this.stats.likes++;
    }
  }

  /**
   * Calls the bleepService removeLike() method to remove a like from the bleep
   */
  public removeLike() {
    if (this.liked) {
      this.bleepsService.removeLike(this.bleep.id);
      this.liked = false;
      this.stats.likes--;
    }
  }

  /**
   * Get the comments that are cached for this bleep.
   */
  private getCachedComments() {
    this.cachedComments = this.cachingService.getSortedList('comments', undefined, this.bleep.id);
    if (this.cachedComments.length > 0) {
      this.cachedRange = this.cachingService.returnDocumentsEpoch('comments', undefined, this.bleep.id);
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

      this.bleepsService.fetchComments(this.bleep.id, this.commentsContToken, this.cachedRange).subscribe(commentsResp => {
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
          this.bleepsService.getCommentStats(comments.map(comment => comment.id), this.bleep.id).subscribe(data => {
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
          this.bleepsService.getCommentLikes(comments.map(comment => comment.id), this.bleep.id).subscribe(data => {
            const likesDocs = data.body.Documents;
            likesDocs.forEach(doc => {
              const commentId = doc.id.substr(doc.id.indexOf('-') + 1);
              const index = comments.findIndex(e => e.id === commentId);
              comments[index].meta.likes = doc.likes;

              if (this.userFragment.userId in doc.likes) {
                comments[index].meta.isLiked = true;
              }
            });
          });

          // add the comments at the begginging of the array.
          this.comments = comments.concat(this.comments);

          this.isLoadingComment = false;
        } else {
          // TODO: add UI to show error to user
          this.monitoringService.logException(new Error(`Error while getting comments for ${this.bleep.id}`), 2);
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
    // Log the interaction as an event
    this.monitoringService.logEvent('clicked-likeComment');
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
    // Log the interaction as an event
    this.monitoringService.logEvent('clicked-deleteComment', { bleepId: this.bleep.id, commentId });
    // Delete the comment
    const idx = this.comments.findIndex((e) => e.id === commentId);
    this.comments.splice(idx, 1);
    this.stats.comments = this.stats.comments - 1;
  }

  /**
   * Calls the bleepService createBleepComment() method to add a comment to the bleep
   */
  public sendComment(commentText) {
    this.sendingComment = true;
    // Log the interaction as an event
    this.monitoringService.logEvent('submitted-comment', { bleepId: this.bleep.id });
    // Create the comment
    this.bleepsService.createComment(commentText, this.bleep.id).subscribe(response => {
      if (response.ok) {
        this.sendingComment = false;
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
        comment.meta.profilePic = 'assets/blank_user.svg';
        this.appBlobService.checkBlobExists(this.userFragment.userId, 'profile-pictures').subscribe(exists => {
          if (exists) {
            comment.meta.profilePic = environment.blobStorage.storageUri + 'profile-pictures/' + this.userFragment.userId;
          }
        });
        this.comments.push(comment);

        // add the new comment to the object cache.
        this.cachingService.addToObjectCache(comment.id, 'comments', comment, comment.bleep);

        // Then increment the comments number by 1
        this.stats.comments++;
      } else {
        // TODO: add some alert on the UI that the comment was unable to be added
        console.error('Unable to add comment');
      }
    });
  }

  public interactionPressed($ev) {
    // Log the interaction as an event
    this.monitoringService.logEvent('clicked-' + $ev, { bleepId: this.bleep.id });
    // TODO: switch case?
    if ($ev === 'like') {
      if (this.liked === false) {
        this.addLike();
      } else if (this.liked === true) {
        this.removeLike();
      }
    } else if ($ev === 'comment') {
      if (this.showComments === false) {
        this.getComments();
        this.showComments = true;
      } else {
        this.showComments = false;
      }
    } else if ($ev === 'share') {
      this.presentShareBleep();
    }
  }

  presentShareBleep() {
    if (this.bleep.type === 'share') {
      this.bleepsService.getBleep(this.bleep.shared.id).subscribe(bleep => {
        this.presentBleepModal(bleep);
      });
    } else {
      this.presentBleepModal(this.bleep);
    }
  }

  async presentBleepModal(bleep) {
    const modal = await this.modalController.create({
      component: BleepModalPage,
      componentProps: {
        sharedBleep: bleep
      }
    });
    return await modal.present();
  }

  /**
   * Called when bleep scroll into viewport.
   */
  public onIntersection(ev) {
    if (ev.visible) {
      this.analyticsService.sendEvent('bleep_view', this.userFragment.id, this.bleep.id);
    }
  }

}

