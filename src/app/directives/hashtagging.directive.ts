import { Directive, ElementRef, Renderer2, OnInit, Input, OnChanges } from '@angular/core';
import { IonTextarea } from '@ionic/angular';
import { SearchService } from '../services/search.service';

@Directive({
  selector: '[appHashtagging]'
})
export class HashtaggingDirective implements OnChanges {
  private innerHTML: string;
  @Input() bleep: any;

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private searchService: SearchService) { }

  ngOnChanges(): void {

    this.presentHashtags();
    // const hashtags = this.text.match(this.hashtagRegex);
  }

  presentHashtags() {
    this.innerHTML = this.bleep.body;
    if (this.bleep.tags && this.bleep.tags.length > 0) {
      this.bleep.tags.forEach(tag => {
        this.replaceWithFormattedHashtag(`#${tag}`);
      });
    }

    this.renderer.setProperty(this.elementRef.nativeElement, 'innerHTML', this.innerHTML);
    this.renderer.listen(this.elementRef.nativeElement, 'click', (event) => {
      if (event.srcElement.classList.contains('bleep-hashtag')) {
        event.stopPropagation();
        event.preventDefault();
        const hashtag = event.target.innerText;
        const text = hashtag.substr(1);
        this.searchService.setSearchText(text);
        this.searchService.goToSearchPage();
      }
    });
  }

  replaceWithFormattedHashtag(searchStr) {
    this.innerHTML = this.innerHTML.replace(searchStr, `<a class="bleep-hashtag">${searchStr}</a>`);
  }
}
