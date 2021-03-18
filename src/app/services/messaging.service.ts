import { Injectable } from '@angular/core';
import { Plugins } from '@capacitor/core';
import { UserService } from './user.service';
import { DatabaseService } from './database.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UsersService } from './users.service';
import { Conversation, Message } from '../models/message-models';
import { SignalRService } from './signal-r.service';
import { map } from 'rxjs/operators';
import { MonitoringService } from './monitoring/monitoring.service';
import { HttpResponse } from '@angular/common/http';
import { UserFragment } from '../models/user-models';
import * as uuid from 'uuid';
import { group } from 'console';
import { AppBlobService } from './blob_storage/app-blob-service.service';

const { Storage, App, BackgroundTask } = Plugins;

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  private user: any;
  // Conversations data storing currently loaded conversations
  private conversations: Array<Conversation> = new Array<Conversation>();
  private conversations$ = new BehaviorSubject<Array<Conversation>>(this.conversations);
  // Continuation token to track which conversations have been fetched
  private conversationsContToken: string;
  // Messages map data - mapping an array of fetched messages by conversationId
  private messages: Map<string, Array<Message>> = new Map<string, Array<Message>>();
  private messages$ = new BehaviorSubject<Map<string, Array<Message>>>(this.messages);
  // Continuation token map to track which messages in which conversationIds have been fetched
  private messageContinuationTokens: Map<string, string> = new Map<string, string>();

  private selectedConversationId: string;
  private selectedConversationId$: BehaviorSubject<string> = new BehaviorSubject(this.selectedConversationId);


  constructor(
    private userService: UserService,
    private usersService: UsersService,
    private dataService: DatabaseService,
    private signalRService: SignalRService,
    private monitoringService: MonitoringService,
    private appBlobService: AppBlobService,
  ) {
    this.userService.returnUser().subscribe(usr => {
      this.user = usr;
    });
    // Open up a SignalR connection to start recieving live messages
    this.signalRService.returnMessages().subscribe(incomingMessage => {
      this.addToRecievedMessages(incomingMessage);
    });

    this.addStateChangeListener();
  }

  /**
   * Gets the user's 10 most recent conversations and uses a continuation token to fetch more with each call
   */
  public loadUserConversations() {
    // Only fetch conversations if they haven't already been fully fetched (cont token will be null if we've retrieved all docs)
    if (this.conversationsContToken !== null) {
      const query = `SELECT * FROM c WHERE ARRAY_CONTAINS(c.members, "${this.user.fragment.id}") ORDER BY c.latestMessage.timeSent DESC`;
      // Get latest 10 conversations containing user's id, with continuation token to fetch more
      this.dataService.queryDocuments(query, environment.cosmosDB.conversationsContainerId,
        null, { maxItems: 10, continuationToken: this.conversationsContToken }).subscribe(convResp => {
          if (convResp.ok) {
            // Get the continuation token from the header which we can use as a marker to fetch more
            this.conversationsContToken = convResp.headers.get('x-ms-continuation');
            const conversations: Array<Conversation> = convResp.body.Documents;
            this.addConversationsToArray(conversations);
          } else {
            // TODO: add UI to show error to user
            this.monitoringService.logException(new Error(`Error while getting conversations for ${this.user.fragment.id}`), 1);
          }
        });
    }
  }

  /**
   * Get a specific conversation, will return null if this user is not in the members for the conversation.
   * @param conversationId: the is of the conversation to request
   * @returns a conversation | null if this user is not in the members for the conversation
   */
  private loadConversation(conversationId: string) {
    return this.dataService.getDocument(conversationId, 'conversations', conversationId).pipe(
      map(res => {
        if (res.ok) {
          const conversation: Conversation = res.body;
          this.addConversationsToArray([conversation]);
          return conversation;
        } else {
          // TODO: handle couldn't get conversation.
        }
      })
    );
  }

  /**
   * Returns an observable of the conversations[] array
   * @returns Observable: Array[] containing current conversations
   */
  public returnConversations() {
    return this.conversations$.asObservable();
  }

  /**
   * Create a new Conversation in the database
   * @param conversation the conversation document to post
   * @returns Observable: the database response
   */
  public newConversation(conversation: Conversation) {
    // TODO: add continual updating of latest message display
    return this.dataService.createOrUpdateDocument(
      conversation, environment.cosmosDB.conversationsContainerId, conversation.id);
  }

  /**
   * Gets the 20 most recent messages in the specified conversation and uses a continuation token to fetch more with each call
   * @param conversationId the id of the conversation to load messages from
   */
  public loadConversationMessages(conversationId: string): Observable<HttpResponse<any>> {
    // Only fetch more messages if the continuation token is not null (Cosmos returns null token once all messages are retrieved)
    if (this.messageContinuationTokens.get(conversationId) !== null) {
      // Don't have to add WHERE clause to filter by conversationId as we're specifying it as a partition key
      const query = `SELECT * FROM m ORDER BY m.timeSent DESC`;
      // Get latest 20 messages for conversationId, with continuation token to fetch more
      return this.dataService.queryDocuments(query, environment.cosmosDB.messagesContainerId,
        conversationId, { maxItems: 20, continuationToken: this.messageContinuationTokens.get(conversationId) })
        .pipe(
          map(messagesResp => {
            if (messagesResp.ok) {
              // Get the continuation token from the header and store in a map of messages contTokens with convId as key
              this.messageContinuationTokens.set(conversationId, messagesResp.headers.get('x-ms-continuation'));
              const fetchedMessages: Array<Message> = messagesResp.body.Documents;
              fetchedMessages.reverse();
              // Add fetched messages to map of ConversationIds to Message arrays
              if (this.messages.has(conversationId)) {
                // Don't concatonate as we need reverse order, instead prepend the array to the existing messages
                this.messages.set(conversationId, [...fetchedMessages, ...this.messages.get(conversationId)]);
              } else {
                this.messages.set(conversationId, fetchedMessages);
              }
              this.messages$.next(this.messages);

              // Ensure that conversation has fragment and name, needed incase user has left group:
              this.checkConversationHasSenders(fetchedMessages);
            } else {
              // TODO: add UI to show error to user
              this.monitoringService.logException(new Error(`Error while getting messages for conversation ${conversationId}`), 2);
            }
            // Return the whole response so we can do further logic with the continuation token header as well as Ok response
            return messagesResp;
          }
          )
        );
    }
  }

  /**
   * If user has been deleted from convo then their name may not be in the conversation.
   * This function checks that the sender id mame is present for the message.
   * @param messages: the array of messages to check senderIds, all messages must be from the same conversation.
   */
  private checkConversationHasSenders(messages: Message[]) {
    // return if empty array.
    if (messages.length === 0) { return; }

    // get conversation for these messages.
    const conversation = this.returnConversation(messages[0].conversationId);

    // check to make sure names are present as object
    if (!conversation.names) {
      conversation.names = {};
    }

    // filter over each message and check conversation has the name for that user.
    messages.forEach(msg => {
      if (msg.senderId === this.user.fragment.userId) { return; }

      // TODO: why have we added names when we have fragments already?
      if (!conversation.names[msg.senderId]) {
        conversation.names[msg.senderId] = {};
        this.usersService.getUserFragment(msg.senderId).subscribe(frag => {
          const fragment = frag.body;
          conversation.names[msg.senderId] = fragment.firstname + ' ' + fragment.surname;
        });
      }
    });
  }

  /**
   * Checks for updated conversations, and if conversations updated, will get conversations.
   */
  private checkForUpdatedConversations() {
    const mostRecentTs = this.conversations[0].latestMessage.timeSent;

    // Select conversations where user is a member and latestMessage timestamp > most recent from last fetched
    const query = `SELECT * FROM c WHERE c.latestMessage.timeSent > ${mostRecentTs}` +
      ` AND ARRAY_CONTAINS(c.members, "${this.user.fragment.userId}")`;

    return this.dataService.queryDocuments(query, 'conversations').pipe(
      map(resp => {
        const updatedConversations = resp.body.Documents;
        // If any returned, add them to conversations array
        if (updatedConversations.length > 0) {
          this.addConversationsToArray(updatedConversations);
        }
      })
    );
  }

  /**
   * Adds conversations to array, takes an array of conversations.
   * @param conversations an Array of the Conversations to add
   */
  public addConversationsToArray(conversations: Conversation[]) {
    conversations.forEach(conversation => {
      // If user is not in members then should not have access to this conversation and return null.
      if (!conversation.members.includes(this.user.fragment.id)) {
        return null;
      }

      // add member fragments to conversation.
      conversation.memberFragments = new Array<UserFragment>();
      conversation.names = {};

      conversation.members.forEach((member) => {
        // Exclude the person logged in
        if (member !== this.user.fragment.id) {
          // Get the user fragment from the conversation member id and append to the conversation object
          this.usersService.getUserFragment(member).subscribe(frag => {
            const fragment = frag.body;
            conversation.memberFragments.push(fragment);
            conversation.names[member] = fragment.firstname + ' ' + fragment.surname;
          });
          conversation.names[this.user.fragment.userId] = this.user.fragment.firstname + ' ' + this.user.fragment.surname;
        }
      });

      // need to use find index for objects, includes will not work for getting indexes in arrays of objects.
      const convIndex = this.conversations.findIndex(e => e.id === conversation.id);

      // remove the conversation if already in the array and is less up to date than conversation to add
      if (convIndex > -1 && (this.conversations[convIndex].latestMessage.timeSent <= conversation.latestMessage.timeSent)) {
        this.conversations.splice(convIndex, 1);
        this.conversations.unshift(conversation);

        // if not in conversation just add conversation at start
      } else if (convIndex === -1) {
        this.conversations.unshift(conversation);

        // this only needs to be called if the function has not been seen before.
        this.checkConversationBlobExists(conversation);
      }

      // check if last message is from sender who has left the conversation.
      if (conversation.latestMessage) {
        this.checkConversationHasSenders([conversation.latestMessage]);
      }
    });

    // sort the conversation as per the most recent message:
    this.sortConversations();

    // update the conversations behaviour subject:
    this.conversations$.next(this.conversations);

  }

  /**
   * Checks if a blob exists for the conversation image.
   * @param conversation the conversation to check blob exists for
   */
  private checkConversationBlobExists(conversation: Conversation) {

    // extract filepath and container depending on type of conversation.
    let filePath: string;
    let container: string;
    if (conversation.groupName) {
      container = 'conversation-' + conversation.id;
      filePath = `media/images/group-image`;
    } else {
      container = 'profile-pictures';
      filePath = conversation.members[conversation.members.findIndex(e => e !== this.user.fragment.userId)];
    }

    // Check the blob exists and update the conversation document if it does exist.
    this.appBlobService.checkBlobExists(filePath, container).subscribe(exists => {
      if (exists) {
        conversation.blobExists = true;
      }
    });
  }

  /**
   * Sort the conversations by descending order of most recent message snippets
   */
  private sortConversations() {
    // tslint:disable-next-line:max-line-length
    this.conversations.sort((a, b) => (!a.latestMessage ? -1 : !b.latestMessage ? 1 : (a.latestMessage.timeSent > b.latestMessage.timeSent) ? -1 : 1 ));
  }

  /**
   * Returns the count of new messages since the local most recent messages sent timestamp
   * @param conversationId: the conversation Id to check new messages for.
   * @returns Observable of number respresenting new message count.
   */
  public checkForNewConversationMessages(conversationId): Observable<number> {
    // get the conversation messages
    const conversationMessages = this.messages.get(conversationId);

    // get the timestamp of the most recent message
    const mostRecentSentTs = Math.max.apply(null, conversationMessages.map(item => item.timeSent));

    // query to get messages for this conversation new since most recent locally stored messages.
    const query = `SELECT COUNT(c) as count FROM c WHERE c.conversationId = "${conversationId}" AND c.timeSent > ${mostRecentSentTs}`;

    return this.dataService.queryDocuments(query, 'messages', conversationId).pipe(
      map(resp => {
        // count of new messages
        const newMessageCount = resp.body.Documents[0].count;
        if (newMessageCount > 0) {
          // if more than 0, then delete conversation and resend request to ensure pagination works.
          // if we just added this then pagination would not work and content would not be dynamic enough for
          // effective chat. TODO: Requires thought re. caching potential.
          this.messages.delete(conversationId);
          this.messageContinuationTokens.delete(conversationId);
          this.loadConversationMessages(conversationId).subscribe();
        }

        // return the new message count to handle any UI for loading new messages.
        return newMessageCount;
      }));
  }

  /**
   * Returns an observable of the messages map
   * @returns Observable of Map<conversationId: string, messages: Array<Message>>
   */
  public returnConversationMessages() {
    return this.messages$.asObservable();
  }

  /**
   * Post a new message to the database
   * @param message: the Message to send
   * @returns the database operation response
   */
  public sendMessage(message: Message) {
    return this.dataService.createOrUpdateDocument(message, environment.cosmosDB.messagesContainerId, message.conversationId);
  }

  /**
   * Update the conversation snippet (will only update if timesent of message is equal or larger than current).
   */
  public updateConversationSnippet(conversationId: string, snippet: Message) {

    // make sure specified conversation is in conversations array:
    const convoIndex = this.conversations.findIndex(c => c.id === conversationId);
    if (convoIndex > -1) {
      const conversation = this.conversations[convoIndex];

      // check that message is the most recent (if equal is the same message and so should update the message value anyway)
      if (!conversation.latestMessage || conversation.latestMessage.timeSent <= snippet.timeSent) {
        conversation.latestMessage = snippet;

        this.sortConversations();

        this.conversations$.next(this.conversations);
      }
    }
  }

  /**
   * Add an incoming message to its appropriate array in the local Messages map
   * @param message the Message object to add
   */
  private addToRecievedMessages(message: Message) {
    if (this.messages.has(message.conversationId)) {
      const conversationMessages = this.messages.get(message.conversationId);

      // check to see if message is already in messages, if not append to messages.
      if (conversationMessages.findIndex((m) => m.id === message.id) === -1) {
        conversationMessages.push(message);

        this.messages$.next(this.messages);
      }

      // update the conversation snippet
      this.updateConversationSnippet(message.conversationId, message);

      // If conversation is in conversations but not in messages then snippet should be updated:
    } else if (this.conversations.findIndex(c => c.id === message.conversationId) > -1) {
      this.updateConversationSnippet(message.conversationId, message);

      // If not in conversations then should get the conversation:
    } else {
      this.loadConversation(message.conversationId).subscribe();
    }
  }

  /**
   * set the selected conversationId in the messaging service. Used when changing app state to ensure
   * new messages are recieved on opening app.
   * @param conversationId the id of the conversation currently open.
   */
  public setSelectedConversationId(conversationId) {
    this.selectedConversationId = conversationId;
    this.selectedConversationId$.next(this.selectedConversationId);
  }

  public leaveGroupConversation(conversationId: string) {
    const convoIndex = this.conversations.findIndex(c => c.id === conversationId);
    const conversation = this.conversations[convoIndex];

    // TODO: change this to check conversation.type as we want potential to have a group with only one person
    if (conversation.members.length <= 2) {
      return;
    }

    const leaveAction: Message = {
      id: uuid.v4(),
      conversationId,
      recipients: conversation.memberFragments.map(frag => {
        if (frag.id !== this.user.fragment.id) {
          return frag.sessionId;
        }
      }),
      recipientOIds: conversation.memberFragments.map(frag => {
        if (frag.id !== this.user.fragment.id) {
          return frag.id;
        }
      }),
      senderId: this.user.fragment.id,
      timeSent: Date.now(),
      readBy: null, // TODO: why are we setting null properties when they're redundant?
      action: 'leave',
      type: 'action'
    };

    // Call LeaveConversationSproc to remove user from the members array of the conversation document
    const sprocInputs = [conversation.id, this.user.fragment.userId];
    this.dataService.callSproc('conversations', conversation.id, 'leaveConversationSproc', sprocInputs).subscribe(res => {
      if (res.ok) {
        // Remove the conversation from local conversations
        this.conversations.splice(convoIndex, 1);
        // TODO: we don't want to do this from the client, consider moving to server-side logic
        this.dataService.createOrUpdateDocument(leaveAction, 'messages', conversationId).subscribe();
      }
    });

  }

  /**
   * Send an action message, i.e. leaving a conversation, creating a conversation.
   * @param conversationId the conversation id of the conversation of the action
   * @param action the action being performed.
   */
  public sendAction(conversation: Conversation, action: 'leave' | 'create-group') {

    const actionMessage: Message = {
      id: uuid.v4(),
      conversationId: conversation.id,
      recipients: conversation.memberFragments.map(frag => {
        if (frag.id !== this.user.fragment.id) {
          return frag.sessionId;
        }
      }),
      recipientOIds: conversation.memberFragments.map(frag => {
        if (frag.id !== this.user.fragment.id) {
          return frag.id;
        }
      }),
      senderId: this.user.fragment.id,
      timeSent: Date.now(),
      readBy: null, // TODO: why are we setting null properties when they're redundant?
      action,
      type: 'action'
    };

    return this.sendMessage(actionMessage);
  }

  /**
   * check if a conversation with the same members exists.
   * @param conversationId id of the conversation.
   */
  public checkConversationExists(membersToCheck: string[]): Observable<Conversation> {

    // First check the locally downloaded conversations
    this.conversations.forEach((conversation, index) => {
      // If the members are the same, return an observable of the matching conversation
      if (this.arraysAreEqual(membersToCheck, conversation.members)) {
        return of(this.conversations[index]);
      }
    });

    // Then check in the database for a match
    let sqlQuery = `SELECT * FROM c WHERE ARRAY_LENGTH(c.members) = ${membersToCheck.length}`;
    membersToCheck.forEach(member => {
      sqlQuery += ` AND ARRAY_CONTAINS(c.members, "${member}")`;
    });

    // Return the conversation document if there's a match or null if not
    return this.dataService.queryDocuments(sqlQuery, 'conversations').pipe(
      map(res => {
        if (res.ok && res.body.Documents.length > 0) {
          return res.body.Documents[0];
        } else {
          return null;
        }
      })
    );
  }

  /**
   * Check if conversation with the same members exists.
   *
   * @param a first array.
   * @param b second array.
   */
  // TODO: find a cleaner/built in way of doing this or move to utils
  private arraysAreEqual(a, b): boolean {
    if (a === b) { return true; }
    if (a == null || b == null) { return false; }
    if (a.length !== b.length) { return false; }

    a.sort();
    b.sort();

    for (let i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) { return false; }
    }
    return true;
  }


  /**
   * Updates the read reciepts for a particular conversation. Checks that the messages have
   * been set as read by the current user.
   * @param conversationId the id of the conversation to update.
   */
  public updateConversationReadReciepts(conversationId: string) {
    if (conversationId && this.messages.has(conversationId)) {
      // get conversation messages
      const conversationMessages = this.messages.get(conversationId);

      // check to make sure conversation messages are present
      if (conversationMessages.length === 0) {
        return;
      }

      // FOR NOW REMOVE CHECK AS THIS WILL STOP OLD MESSAGES GETTING READ RECIEPTS, BUT SHOULD USE IN FUTURE TO SAVE HARDWARE
      // check if most recent message is seen and if it is return
      // if (conversationMessages[conversationMessages.length - 1].readBy
      //   && conversationMessages[conversationMessages.length - 1].readBy[this.user.fragment.userId]) {
      //   return;
      // }

      // filter backwards through messages and check if has been read.
      const unreadMessages = [];
      // TODO: use Typescript forEach where possible (you can add an index overload)
      for (let i = conversationMessages.length - 1; i >= 0; i--) {
        const msg = conversationMessages[i];
        if ((!msg.readBy || !msg.readBy[this.user.fragment.userId]) && msg.senderId !== this.user.fragment.userId) {
          unreadMessages.push(conversationMessages[i].id);

          // catch for messages that do not have this field:
          if (!msg.readBy) {
            msg.readBy = {};
          }
          msg.readBy[this.user.fragment.userId] = Date.now();
        }
      }

      // if there are unread messages, update the read reciepts.
      if (unreadMessages.length > 0) {
        this.updateReadReceipts(conversationId, unreadMessages);
      }

      // update snippet to show conversation has been read
      const conversation = this.conversations[this.conversations.findIndex(e => e.id === conversationId)];
      if (!conversation.latestMessage.readBy) {
        conversation.latestMessage.readBy = {};
      }
      if (!conversation.latestMessage.readBy[this.user.fragment.userId]) {
        conversation.latestMessage.readBy[this.user.fragment.userId] = Date.now();
      }
    }
  }

  private updateReadReceipts(conversationId: string, messageIds: string[]) {
    const messageIdString = `'${messageIds.join(`', '`)}'`;
    const sprocInputs = [this.user.fragment.userId, messageIdString];
    // TODO: receipt is spelt wrong in sproc, needs correcting \/ \/ \/
    this.dataService.callSproc('messages', conversationId, 'addReadReciept', sprocInputs).subscribe();
  }

  // TODO: document the method | also why do we need this when we also have a getter that does the same thing?
  public returnConversation(conversationId) {
    const index = this.conversations.findIndex(c => c.id === conversationId);
    return this.conversations[index];
  }

  /**
   * Adds an app listener to check for state change and checks for new conversation items when chat is reloaded.
   */
  private async addStateChangeListener() {
    App.addListener('appStateChange', (state) => {
      if (state.isActive) {
        this.checkForUpdatedConversations().subscribe();
        if (this.selectedConversationId) {
          this.checkForNewConversationMessages(this.selectedConversationId).subscribe();
        }
      }
    });
  }
}
