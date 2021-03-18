import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-image-card',
  templateUrl: './image-card.component.html',
  styleUrls: ['./image-card.component.scss'],
})
export class ImageCardComponent implements OnInit {
  @Input() source: string;
  @Output() selected: EventEmitter<boolean> = new EventEmitter();

  constructor() { }

  ngOnInit() { }

  public imageSelected() {
    this.selected.emit(true);
  }

}
