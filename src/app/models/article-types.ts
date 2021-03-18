import * as uuid from 'uuid';
// *********************************************************
// Interfaces for Article Service
// *********************************************************

// Article: Base class for articles:
export class Article {
    id: string;
    published: number;
    privacy: string;
    title: string;
    bleep: string;
    createdById: string;
    authors: Array<any>;
    images: Array<any>;
    headerImage: any;
    content: any;
    references: Array<any>;
    stage: string;
    public: boolean;
    inFeed: boolean;
    edited: number;
    tags: string[];
    feedImage: string;

    constructor(author) {
        this.id = uuid.v4();
        this.published = null;
        this.title = '';
        this.bleep = null;
        this.stage = 'draft';
        this.createdById = author.userId;
        this.authors = [ author.userId ];
        this.edited = Date.now();
        this.headerImage = { id: null, width: null };
        this.content = null;
        this.references = [];
        this.images = [];
        this.tags = [];
        this.public = false;
        this.inFeed = false;
        this.feedImage = null;
    }
}
