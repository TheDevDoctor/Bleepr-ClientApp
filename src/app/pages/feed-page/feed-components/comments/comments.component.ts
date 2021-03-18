import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { environment } from 'src/environments/environment';
import { UserService } from '../../../../services/user.service';
import { UsersService } from '../../../../services/users.service';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { SasGeneratorService } from 'src/app/services/blob_storage/sas-generator.service';
import { OptionsPopoverComponent } from '../options-popover/options-popover.component';
import { PopoverController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-comments',
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.scss'],
})
export class CommentsComponent implements OnInit {
  @Input() comments: Array<any>;
  @Input() hasAllComments: boolean;
  @Input() loadingComments: boolean;

  // will set the comment text to null once comment sending is complete.
  @Input() set isSendingComment(val: boolean) {
    if (!val && this._isSendingComment) {
      this.newCommentInput = '';
    }
    this._isSendingComment = val;
  }

  get isSendingComment() {
    return this._isSendingComment;
  }

  // tslint:disable-next-line:variable-name
  private _isSendingComment: boolean;

  @Output() sendComment: EventEmitter<string> = new EventEmitter();
  @Output() updateComment: EventEmitter<any> = new EventEmitter();
  @Output() deleteComment: EventEmitter<string> = new EventEmitter();
  @Output() likeComment: EventEmitter<any> = new EventEmitter();
  @Output() loadMore: EventEmitter<boolean> = new EventEmitter();

  public newCommentInput: string;
  public baseUri: string;
  public user: any;
  public sasToken: string;
  public profilePic = 'assets/blank_user.svg';

  constructor(
    private userService: UserService,
    private sasGenerator: SasGeneratorService,
    public popoverController: PopoverController,
    private authService: AuthService,
  ) { }

  ngOnInit() {
    this.sasGenerator.getSasToken().subscribe(req => {
      this.sasToken = req.storageAccessToken;
    });

    this.baseUri = environment.blobStorage.storageUri;
    this.userService.returnUser().subscribe(user => {
      this.user = user;
      if (user && user.profilePic) {
        this.profilePic = user.profilePic + '?' + this.sasToken;
      }
    });
  }

  postComment() {
    this.sendComment.emit(this.newCommentInput);
  }

  loadMoreComments() {
    this.loadMore.emit(true);
  }

  async presentPopover(ev: any, index: number) {
    const popover = await this.popoverController.create({
      component: OptionsPopoverComponent,
      componentProps: {
        comment: this.comments[index]
      },
      event: ev,
      translucent: true
    });

    popover.onDidDismiss().then(data => {
      if (data.data) {
        const actionData = data.data;
        if (actionData.action === 'delete') {
          this.deleteComment.emit(actionData.id);
        } else if (actionData.action === 'edit') {
          const idx = this.comments.findIndex((e) => e.id === actionData.id);
          this.comments[idx].meta.editText = this.comments[idx].text;
          this.comments[idx].meta.isEditing = true;
        }
      }
    });

    return await popover.present();
  }

  cancelEditing(idx) {
    this.comments[idx].meta.isEditing = false;
    delete this.comments[idx].meta.editText;
  }

  updateBleep(idx) {
    this.updateComment.emit({ id: this.comments[idx].id, text: this.comments[idx].meta.editText });
  }

  trackByFn(index, item) {
    return item.id; // or item.id
  }

  onLikeComment(comment) {
    comment.meta.isLiked = !comment.meta.isLiked;
    if (comment.meta.isLiked) {
      comment.meta.stats.likes++;
    } else {
      comment.meta.stats.likes--;
    }

    this.likeComment.emit({ comment, isLiked: comment.meta.isLiked });
  }

  public logIn() {
    this.authService.login();
  }

  public signUp() {
    this.authService.login();
  }
}
