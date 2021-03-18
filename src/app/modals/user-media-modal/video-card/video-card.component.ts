import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-video-card',
  templateUrl: './video-card.component.html',
  styleUrls: ['./video-card.component.scss'],
})
export class VideoCardComponent implements OnInit {
  @Input() source: string;
  @Output() selected: EventEmitter<boolean> = new EventEmitter();

  constructor() { }

  ngOnInit() {}

  public videoSelected() {
    this.selected.emit(true);
  }

}
