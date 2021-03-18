import { Component, OnInit, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { UserService } from 'src/app/services/user.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Router } from '@angular/router';
import { UserFragment } from 'src/app/models/user-models';
import { Conversation } from 'src/app/models/message-models';
import { UserListPage } from '../../user-list/user-list.page';
import { UserMediaModalPage } from 'src/app/modals/user-media-modal/user-media-modal.page';
import { SasGeneratorService } from 'src/app/services/blob_storage/sas-generator.service';
import { environment } from 'src/environments/environment';
import { AppBlobService } from 'src/app/services/blob_storage/app-blob-service.service';
import { MessagingService } from 'src/app/services/messaging.service';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Message } from '@angular/compiler/src/i18n/i18n_ast';

@Component({
  selector: 'app-manage-groupchat',
  templateUrl: './manage-group-chat.modal.html',
  styleUrls: ['./manage-group-chat.modal.scss']
})
/**
 * Modal for creating and managing group chats (including modifying group name, icon and members)
 * @param groupMembers Input: An array of UserFragments that constitute the members of the group
 * @param conversation Input: Conversation document for the group chat (null if creating a new group convo)
 */
// tslint:disable-next-line:component-class-suffix
export class ManageGroupChatModal implements OnInit {

  @Input() public groupMembers: Array<UserFragment>;
  @Input() public conversation: Conversation;

  public smallScreen: boolean;
  public newGroup: boolean;
  public groupImageUri: string;
  private groupImageGuid: string;
  private groupImageFile: File;
  private groupImageToBeUploaded: boolean;
  private sasToken: string;
  private userId: string;

  constructor(
    private modalController: ModalController,
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    private sasGenerator: SasGeneratorService,
    private blobService: AppBlobService,
    private userService: UserService,
    private messagingService: MessagingService) {}

  ngOnInit() {
    // TODO: remove the need for a breakpointObserver in multiple components
    this.breakpointObserver.observe('(max-width: 540px)').subscribe(result => {
      this.smallScreen = result.matches;
    });
    this.userService.returnUser().subscribe(user => {
      this.userId = user.fragment.id;
    });

    // If a Conversation document is not passed as input, create one
    if (!this.conversation) {
      this.newGroup = true;
      this.conversation = new Conversation(this.groupMembers.map(member => member.id));
      // TODO: create a more elegant way of managing members without having to manually add signed in user
      this.conversation.members.push(this.userId);
      this.conversation.memberFragments = this.groupMembers;
      this.groupImageUri = 'assets/images/placeholder_camera.png';
    } else {
      this.newGroup = false;
    }

    // Get a sasToken for getting images from blob storage
    this.sasGenerator.getSasToken().subscribe(sas => {
      this.sasToken = sas.storageAccessToken;
      // If this is not a new conversation, get the group image
      if (!this.newGroup) {
        this.groupImageUri = environment.blobStorage.storageUri + 'conversation-' +
          this.conversation.id + '/group-image' + '?' + this.sasToken;
      }
    });
    // Ensure that there are member fragments in the Conversation document
    if (!this.conversation.memberFragments) {
      this.conversation.memberFragments = this.groupMembers;
    }
  }

  public async addOrModifyMembers() {
    const modal = await this.modalController.create({
      component: UserListPage,
      componentProps: {
        selectable: true,
        selected: this.conversation.memberFragments,
        selectMinimum: 2
      }
    });

    // when modal is closed get the connection(s) specified
    modal.onDidDismiss()
      .then(modalOutput => {
        const selectedUsers: Array<UserFragment> = modalOutput.data;
        // Add any selected users to the group
        if (selectedUsers && selectedUsers.length > 0) {
          this.conversation.members = selectedUsers.map(member => member.id);
          this.conversation.memberFragments = selectedUsers;
        }
      });

    return await modal.present();
  }

  /**
   * Dismiss the modal with or without data
   * @param withData Set to true if data is to be returned in the modal output
   */
  public dismissModal(withData: boolean) {
    this.modalController.dismiss(withData ? this.conversation : null);
  }

  public async selectGroupImageModal() {
    const modal = await this.modalController.create({
      component: UserMediaModalPage,
      // Only allow images, and don't auto-upload to blob until we're ready
      componentProps: {
        fileType: 'image',
        autoUpload: false,
        unsplash: false
      }
    });
    modal.onDidDismiss()
      .then((media) => {
        if (media.data) {

          const groupImage = media.data;

          if (groupImage.type === 'image') {
            // Set group image
            switch (groupImage.source) {
              case 'blob':
                // TODO: set locally and then do remote update as part of exiting the modal (currently not possible with user media modal)
                this.groupImageUri = groupImage.uri + '?' + this.sasToken;
                this.groupImageToBeUploaded = false;
                this.groupImageGuid = groupImage.guid;
                break;
              case 'local':
                this.groupImageUri = groupImage.uri;
                this.groupImageFile = groupImage.file;
                this.groupImageToBeUploaded = true;
                break;
              default:
                break;
            }
          }
        }
      });
    return await modal.present();
  }

  public async postGroupConversation() {
    let blobSubscription;

    // If groupImage file to be uploaded, grab the file and upload it
    if (this.groupImageToBeUploaded) {
      blobSubscription = await this.blobService.uploadBlob('conversation-' + this.conversation.id,
        this.groupImageFile, 'image', 'group-image');

      blobSubscription.subscribe(blobOperation => {
        // If the uri is returned, this indicates completion of upload
        if (blobOperation.uri) {
          // Once blob operation completed, proceed with creating/updating the convo doc
          this.createOrUpdateConversation();
        }
      });
    // If groupImageToBeUploaded set to false, an image in the user's blob container has been selected, so copy it over to convo
    } else if (this.groupImageToBeUploaded === false) {
      // Copy the image from the user's container to the conversation container
      blobSubscription = await this.blobService.copyBlobToContainer('media/images/' + this.groupImageGuid, this.userId,
        'group-image', 'conversation-' + this.conversation.id, 'image');

      blobSubscription.subscribe(blobOperation => {
        // If the uri is returned, this indicates completion of upload
        if (blobOperation.uri) {
          // Once blob operation completed, proceed with creating/updating the convo doc
          this.createOrUpdateConversation();
        }
      });
    // If undefined, user hasn't updated the image
    } else {
      this.createOrUpdateConversation();
    }
    // TODO: return modalOutput -> conversation, changed / notChanged
  }

  private createOrUpdateConversation() {
    const conversation = new Conversation(this.conversation.members, this.conversation.groupName, this.conversation.id,
      this.conversation.latestMessage);

    this.messagingService.newConversation(conversation).subscribe(response => {
      if (response.ok) {
        if (!conversation.latestMessage) {
          // if the conversation has been added should send action message so there is a latest message.
          // Otherwise fetch query will fail without latest message in conversation.
          this.messagingService.sendAction(this.conversation, 'create-group').subscribe(res => {
            if (res.ok) {
              // if latest message created, set the latest message of the conversation.
              this.conversation.latestMessage = res.body;
              // dismiss the modal
              this.dismissModal(true);

              // TODO: Loading indicator for creating a new message
            }
          });
        }
      } else {
        // TODO: add UI to show error to user
      }
    });
  }

}
