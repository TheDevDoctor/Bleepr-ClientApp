import {
  Component, OnInit, ViewChild, ElementRef, AfterViewInit, ViewChildren, QueryList
} from '@angular/core';
import { StateService } from '../../services/state.service';
import { UserService } from 'src/app/services/user.service';
import { SasGeneratorService } from 'src/app/services/blob_storage/sas-generator.service';
import { environment } from 'src/environments/environment';
import { Message, Conversation } from 'src/app/models/message-models';
import * as uuid from 'uuid';
import { IonContent, IonInfiniteScroll, ModalController, MenuController, IonHeader } from '@ionic/angular';
import { MessagingService } from 'src/app/services/messaging.service';
import { MonitoringService } from 'src/app/services/monitoring/monitoring.service';
import { UserListPage } from '../user-list/user-list.page';
import { NavigationExtras, Route, Router, Scroll } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { NotificationsService } from 'src/app/services/notifications.service';
import { UsersService } from 'src/app/services/users.service';
import { ManageGroupChatModal } from './manage-group-chat/manage-group-chat.modal';
import { UserFragment } from 'src/app/models/user-models';

@Component({
  selector: 'app-messaging',
  templateUrl: 'messaging.page.html',
  styleUrls: ['messaging.page.scss']
})
export class MessagingPage implements OnInit, AfterViewInit {

  // Conversations data
  public conversations: Array<Conversation>;
  // tslint:disable-next-line:max-line-length
  // TODO: why do we now have both a selected conversationId and selectedConversation (and we use a getter to get the selected conversation)?
  public selectedConversationId: string;
  public selectedConversation: Conversation;
  public selectedConversationMessages: Array<Message>;
  // Messages data
  public messages: Map<string, Array<Message>>;
  public newMessageInput: string;
  public moreMessagesToFetch = true;
  // Parameters for resolving/displaying users
  public baseUri: string;
  public sasToken: string;
  public currentPlatform: string;
  public user: any;

  public showSkeletons = false;
  public headerHidden = false;
  public chatBottomMargin = 52;
  public chatHeaderMargin = 52;

  // ion-scroll variables for setting scroll position:
  private previousScrollHeight: number;
  private scrollElement: any;
  private previousScrollHeightMinusTop: number;
  private readyFor: string;
  private toReset = false;


  // Content area and infinite scroller for the messages
  @ViewChild('messagesContent') messagesContent: IonContent;
  @ViewChild('newMessageContainer') newMessageContainer: ElementRef;
  @ViewChild('chatHeader', { read: ElementRef }) chatHeader: ElementRef;
  @ViewChild(IonInfiniteScroll) messagesInfiniteScroll: IonInfiniteScroll;

  // TODO: what are taskCards?
  @ViewChildren('msg') taskCards: QueryList<ElementRef>;

  constructor(
    private stateService: StateService,
    private userService: UserService,
    private usersService: UsersService,
    private sasGenerator: SasGeneratorService,
    private messagingService: MessagingService,
    private modalController: ModalController,
    private menuController: MenuController,
    private monitoringService: MonitoringService,
    private notificationsService: NotificationsService,
    private router: Router,
    private breakpointObserver: BreakpointObserver
  ) {
    this.stateService.getCurrentPlatform().subscribe(plat => this.currentPlatform = plat);
    this.userService.returnUser().subscribe(user => {
      this.user = user.fragment;
    });
  }

  ngOnInit() {
    // Get blob access token for image links
    this.baseUri = environment.blobStorage.storageUri;
    this.sasGenerator.getSasToken().subscribe(req => {
      this.sasToken = req.storageAccessToken;
    });
    // Get user's most recent historic conversations from the database
    this.messagingService.loadUserConversations();
    this.messagingService.returnConversations().subscribe(conversations => {
      this.conversations = conversations;
    });

    // Adapt messaging interface to screen-size
    // TODO: we should move this to a centralised layout handler for the header instead of hiding the header manually in every page
    this.breakpointObserver.observe('(max-width: 576px)').subscribe(result => {
      const smallScreen = result.matches;

      // if changes screen size need to enforce showing of header:
      if (smallScreen === false) {
        this.headerHidden = false;
      } else {
        this.headerHidden = true;
      }
    });

    // Subscribe to the currently loaded Messages map
    this.messagingService.returnConversationMessages().subscribe(messages => {
      // prepare the scroll before items added to message list:
      this.prepareScroll('up');

      this.messages = messages;

      this.messagingService.updateConversationReadReciepts(this.selectedConversationId);
      this.selectedConversationMessages = this.messages.get(this.selectedConversationId);
    });

    // TODO: what does this do?
    this.notificationsService.getCurrentNotificationConversationId().subscribe(conversationId => {
      if (conversationId) {
        this.switchConversation(conversationId);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initScroll();

    // TODO: what is this for?
    const sub = this.taskCards.changes.subscribe(data => {
      if (this.scrollElement) {
        this.restoreScroll();
      }
    });
  }

  /**
   * When IonView enters, automatically open conversationMenu if conversation not selected
   */
  ionViewDidEnter() {
    // Open the menu if a conversation is not already open.
    this.menuController.isOpen('conversationsMenu').then(isOpen => {
      if (!isOpen && !this.selectedConversationId) {
        this.menuController.open('conversationsMenu');
      }
    });
  }

  /**
   * Get the scroll element from ion scroll at set the initial scroll variables.
   */
  async initScroll() {
    this.scrollElement = await this.messagesContent.getScrollElement();
    this.previousScrollHeightMinusTop = 0;
    this.readyFor = 'up';
  }

  // TODO: what does this do?
  scrollReset() {
    this.previousScrollHeightMinusTop = 0;
    this.readyFor = 'up';
    this.messagesContent.scrollToBottom();
  }

  /**
   * Restore the scroll position after items added to the top of the container.
   */
  restoreScroll() {
    if (this.toReset) {
      if (this.readyFor === 'up') {
        this.scrollElement.scrollTop = this.scrollElement.scrollHeight - this.previousScrollHeightMinusTop;
      }
      this.toReset = false;
    }
  }

  /**
   * Prepare scroll ahead of items being added to the list.
   */
  prepareScroll(direction) {
    if (this.scrollElement) {
      this.toReset = true;
      this.readyFor = direction || 'up';
      this.previousScrollHeightMinusTop = this.scrollElement.scrollHeight - this.scrollElement.scrollTop;
    }
  }

  // Manage conversations ================================================================================

  /**
   * Switch the current conversation to specified conversation
   * @param conversationId the conversationId of the conversation to switch to
   */
  public switchConversation(conversationId: string) {
    this.selectedConversationId = conversationId;
    this.selectedConversation = this.messagingService.returnConversation(conversationId);
    this.messagingService.setSelectedConversationId(this.selectedConversationId);

    // change header height
    this.chatHeaderMargin = this.chatHeader.nativeElement.offsetHeight;

    // mark read receipts as read when switching to conversation
    this.messagingService.updateConversationReadReciepts(conversationId);

    // set disabled otherwise is fired and we ask for messages twice.
    if (this.messagesInfiniteScroll) {
      this.messagesInfiniteScroll.disabled = true;
    }

    this.selectedConversationMessages = this.messages.get(this.selectedConversationId);

    // Check if any messages have previously been loaded for the selected conversation
    if (!this.messages.has(conversationId)) {
      this.messagingService.loadConversationMessages(conversationId).subscribe(response => {
        if (response.ok) {
          this.scrollReset();

          // disable and complete infinite scroll
          if (response.headers.get('x-ms-continuation') === null) {
            this.messagesInfiniteScroll.complete();
            this.messagesInfiniteScroll.disabled = true;
          } else {
            // reactivate infinite scroll
            if (this.messagesInfiniteScroll) {
              this.messagesInfiniteScroll.disabled = false;
            }
          }
        } else {
          // TODO: UI for conversation messages failed to load
        }
      });
    } else {
      this.checkForNewMessages(conversationId);
      this.scrollReset();
    }

    this.menuController.close('conversationsMenu');
  }

  /**
   * Getter for current selected conversation
   * @returns Conversation object correlated to current selectedConversationId
   */
  public get currentConversation() {
    return this.conversations.find(conv => conv.id === this.selectedConversationId);
  }

  // tslint:disable-next-line:max-line-length
  // TODO: add method documentation | also why are we setting selectedConversation to null when they may leave the group with a different conversation selected?
  public leaveConversation(conversationId: string) {
    this.messagingService.leaveGroupConversation(conversationId);
    this.selectedConversationId = null;
    this.selectedConversation = null;
    this.messagingService.setSelectedConversationId(null);
  }

  // Manage messages =====================================================================================

  /**
   * Send a message using the current newMessageInput
   */
  public sendMessage() {
    if (this.newMessageInput.length > 0) {
      // Create the message object
      const newMessage: Message = {
        id: uuid.v4(),
        conversationId: this.selectedConversationId,
        recipients: this.currentConversation.memberFragments.map(frag => {
          if (frag.id !== this.user.id) {
            return frag.sessionId;
          }
        }),
        recipientOIds: this.currentConversation.memberFragments.map(frag => {
          if (frag.id !== this.user.id) {
            return frag.id;
          }
        }),
        senderId: this.user.id,
        text: this.newMessageInput,
        timeSent: Date.now(),
        readBy: null,
        type: 'message'
      };

      this.newMessageInput = '';

      // If no latestMessage is in the conversation and it contains 2 members, it is
      // a draft 1:1 conversation, so create new conv doc in the db before posting message
      if (!this.currentConversation.latestMessage && this.currentConversation.members.length === 2) {
        // Strip out the member fragments & add latestMessage property before posting to the database
        const newConversation = new Conversation(this.currentConversation.members, undefined, this.currentConversation.id);
        newConversation.latestMessage = newMessage;
        // Post to db
        this.messagingService.newConversation(newConversation).subscribe(response => {
          if (response.ok) {
            // If the conversation doc is created successfully, send the message
            this.postMessageToDatabase(newMessage);
          } else {
            // TODO: add UI to show error to user
            this.monitoringService.logException(new Error(
              `Error while creating conversation ${response}`), 2);
          }
        });
      } else {
        this.postMessageToDatabase(newMessage);
      }
    }
  }

  /**
   * Persist a message to the database
   * @param message the Message to post
   */
  private postMessageToDatabase(message: Message) {
    // Send to Cosmos DB, which will then trigger SignalR to send directly if recipients are online
    this.messagingService.sendMessage(message).subscribe(response => {
      if (response.ok) {
        // TODO: move following two lines to the messaging service as a pipe operation
        this.messagingService.updateConversationSnippet(message.conversationId, message);
        // If we were able to send the message, add it locally
        this.messages.get(message.conversationId).push(message);
        // Scroll down to reveal sent message
        this.messagesContent.scrollToBottom();
      } else {
        // TODO: add UI to show error to user
        this.monitoringService.logException(new Error(
          `Error while sending new message to conversation ${message.conversationId}`), 2);
      }
    });
  }

  /**
   * Infinite scroll - get more messages as the user scrolls up
   * @param event the InfiniteScroll event
   */
  public loadMoreMessages() {
    this.showSkeletons = true;

    // if messages does not have conversation id then should not be loading more, this fixes double loading error.
    if (this.messages.has(this.selectedConversationId) === false) {
      this.messagesInfiniteScroll.complete();
      return;
    }

    this.messagingService.loadConversationMessages(this.selectedConversationId).subscribe(response => {
      if (response.ok) {
        this.showSkeletons = false;
        this.messagesInfiniteScroll.complete();
        const contToken = response.headers.get('x-ms-continuation');

        // If continuation token is null means no more messages to fetch, so disable infinite scroll
        if (contToken === null) {
          this.messagesInfiniteScroll.disabled = true;
        }

      } else {
        // TODO: add failed to load UI
      }
    });
  }

  /**
   * Check for new messages for specified conversationId. See messaging service for function.
   * @param conversationId Id of the conversation to check
   */
  private checkForNewMessages(conversationId: string) {
    this.messagingService.checkForNewConversationMessages(conversationId).subscribe();
  }

  /**
   * New conversation popup - open modal to start a new chat
   */
  public async newConversationPopup() {
    const modal = await this.modalController.create({
      component: UserListPage,
      componentProps: {
        selectable: true
      }
    });

    // when modal is closed get the connection(s) specified
    modal.onDidDismiss()
      .then(modalOutput => {
        const selectedUsers: Array<any> = modalOutput.data;
        // If the chat will be 1 to 1, open up as a draft conversation
        if (selectedUsers.length === 1) {
          this.openDraftConversation(selectedUsers);
          // If chat is a group, open up the Manage Group modal to assign a nickname
        } else if (selectedUsers.length > 1) {
          this.newManageGroupPopup(selectedUsers);
        }
      });

    return await modal.present();
  }

  /**
   * Manage group popup - open modal to manage a group conversation
   * @param members Array of UserFragments for members of the conversation
   * @param conversation The conversation document for the group conversation (optional: if not provided,
   * treated as new conversation)
   */
  public async newManageGroupPopup(members: Array<UserFragment>, conversation: Conversation = null) {
    const modal = await this.modalController.create({
      component: ManageGroupChatModal,
      componentProps: {
        groupMembers: members,
        conversation
      }
    });

    // when modal is closed get the connection(s) specified
    modal.onDidDismiss()
      .then(modalOutput => {
        if (modalOutput.data) {
          const postedConversation = modalOutput.data;
          // If the conversation is new and not present locally, add it locally and switch to it
          if (!this.conversations.find(conv => conv.id === postedConversation.id)) {
            // changed to service method for adding conversations, should not be added locally as would affect logic
            this.messagingService.addConversationsToArray([postedConversation]);
            this.switchConversation(postedConversation.id);
          }
        }
      });

    return await modal.present();
  }

  /**
   * Opens a new conversation window to start a chat before the conversation doc has been created in DB
   * (conversation shouldn't be persisted until the user has sent an initial message for one to one conversations)
   * @param users an array of user IDs to start the conversation with
   */
  private openDraftConversation(users: Array<any>) {
    // TODO: add a check if a chat with the selected participant(s) already exists, in which case just switch to that
    // Construct a conv members array with the selected users and the signed-in user
    const convMembers = users.map(user => user.id);
    convMembers.push(this.user.id);

    // check if conversation exists:
    this.messagingService.checkConversationExists(convMembers).subscribe(conv => {
      // If it doesn't
      if (!conv) {
        // Then create the conversation object
        const conversation = new Conversation(convMembers);
        conversation.memberFragments = users;
        // Add the draft conversation to the conversation list for display
        this.messagingService.addConversationsToArray([conversation]);
        // Switch the conversation (and close the menu if on mobile)
        this.switchConversation(conversation.id);
        this.menuController.close('conversationsMenu');
        // If it does, switch to it
      } else {
        this.switchConversation(conv.id);
      }
    });

  }

  // TODO: unneccesary duplication and shouldn't be in subcomponents - refactor header system
  onHeaderSearch(ev) {
    if (ev) {
      const searchText = ev;
      const navigationExtras: NavigationExtras = { state: { search: searchText } };
      this.router.navigate(['/home/search'], navigationExtras);
    }
  }


  // TODO: what is this doing?
  newMessageTextChanged($event) {
    if (this.chatBottomMargin !== this.newMessageContainer.nativeElement.clientHeight) {
      this.chatBottomMargin = this.newMessageContainer.nativeElement.clientHeight;
      this.messagesContent.scrollToBottom();
    }
  }

  // TODO: what is this doing?
  trackByFn(index, item) {
    return item.id; // or item.id
  }

  returnSnippetText(conversation: Conversation) {
    if (conversation.latestMessage.text !== null) {
      return conversation.names[conversation.latestMessage.senderId] + ': ' + conversation.latestMessage.text;
    } else if (conversation.latestMessage.type && conversation.latestMessage.type === 'action') {
      let name;
      if (this.user.userId === conversation.latestMessage.senderId) {
        name = this.user.firstname + ' ' + this.user.surname;
      } else {
        name = conversation.names[conversation.latestMessage.senderId];
      }

      if (name) {
        if (conversation.latestMessage.action === 'leave') {
          return `${name} has left the conversation`;
        } else if (conversation.latestMessage.action === 'create-group') {
          return `${name} has created a group named ${conversation.groupName}`;
        }
      }
    }
  }

  // TODO: please comment this, and can we avoid hard coding time sent values (60000), classes and types (make them parameters)
  public returnMessageClasses(i) {
    const message = this.selectedConversationMessages[i];

    let classString = '';

    if (message.senderId !== this.user.id) {
      classString += 'received';
    } else if (message.senderId === this.user.id) {
      classString += 'sent';
    }

    if ((i === 0
      || (message.senderId !== this.selectedConversationMessages[i - 1].senderId
        || (message.timeSent - this.selectedConversationMessages[i - 1].timeSent) > 600000))
      && i !== this.selectedConversationMessages.length - 1
      && (this.selectedConversationMessages[i + 1].timeSent - message.timeSent) < 600000
      && (!this.selectedConversationMessages[i + 1].type || this.selectedConversationMessages[i + 1].type === 'message')
      && this.selectedConversationMessages[i + 1].senderId === message.senderId) {
      classString += ' first';
    } else if (i !== 0
      && message.senderId === this.selectedConversationMessages[i - 1].senderId
      && (message.timeSent - this.selectedConversationMessages[i - 1].timeSent) < 600000
      && (!this.selectedConversationMessages[i - 1].type || this.selectedConversationMessages[i - 1].type === 'message')
      && (i === this.selectedConversationMessages.length - 1
        || message.senderId !== this.selectedConversationMessages[i + 1].senderId
        || (this.selectedConversationMessages[i + 1].timeSent - message.timeSent) > 600000
        || (this.selectedConversationMessages[i + 1].type && this.selectedConversationMessages[i + 1].type !== 'message'))) {
      classString += ' end';
    } else if (i !== (this.selectedConversationMessages.length - 1) && i !== 0
      && (message.timeSent - this.selectedConversationMessages[i - 1].timeSent) < 600000
      && (this.selectedConversationMessages[i + 1].timeSent - message.timeSent) < 600000
      && message.senderId === this.selectedConversationMessages[i + 1].senderId
      && message.senderId === this.selectedConversationMessages[i - 1].senderId
      && (!this.selectedConversationMessages[i + 1].type || this.selectedConversationMessages[i + 1].type === 'message')) {
      classString += ' middle';
    } else {
      classString += ' single';
    }

    return classString;
  }
}
