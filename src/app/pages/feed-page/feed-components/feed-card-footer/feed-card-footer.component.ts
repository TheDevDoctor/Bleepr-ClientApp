import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'app-feed-card-footer',
  templateUrl: './feed-card-footer.component.html',
  styleUrls: ['./feed-card-footer.component.scss'],
})
export class FeedCardFooterComponent implements OnInit {
  @Input() bleepStats: any;
  @Input() liked: boolean;
  @Input() showComments: boolean;
  @Output() interaction: EventEmitter<string> = new EventEmitter();

  constructor() { }

  ngOnInit() {}

  interactionPressed(ev) {
    this.interaction.emit(ev);
  }

}
