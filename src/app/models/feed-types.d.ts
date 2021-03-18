export interface FeedItem {
  id?: string;
  timestamp: number;
  body: string;
  type: string;
  createdById: string;
}

export interface ImageFeedItem extends FeedItem {
  image: string[];
}

export interface VideoFeedItem extends FeedItem {
  video: any;
}

export interface LinkFeedItem extends FeedItem {
  link: any;
}
