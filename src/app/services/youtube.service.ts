import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class YoutubeService {

  constructor() { }

  public returnYoutubeEmbedLink(link) {
    const embedUrl = this.validateYouTubeUrl(link);
    return embedUrl;
  }

  private validateYouTubeUrl(link) {
    if (link !== undefined || link !== '') {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
      const match = link.match(regExp);
      if (match && match[2].length === 11) {
        return 'https://www.youtube.com/embed/' + match[2];
      } else {
        return null;
      }
    }
  }
}
