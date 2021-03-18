import { UserFragment } from './user-models';
import * as uuid from 'uuid';

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    recipients: Array<string>;
    recipientOIds: Array<string>;
    text?: string;
    attachments?: Array<any>;
    timeSent: number;
    // TODO: avoid using any unneccesarily when declaring models, defeats the point of strong typing
    readBy: any;
    type?: string;
    action?: string;
}

export class Conversation {
    constructor(
        public members: Array<string>,
        public groupName?: string,
        public id: string = uuid.v4(),
        public latestMessage: Message = null,
        public memberFragments?: Array<UserFragment>,
        // TODO: what specifically is names intended to be?
        public names?: any,
        public type?: string,
        public blobExists?: boolean
    ) {}
}
