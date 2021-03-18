import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-document-card',
  templateUrl: './document-card.component.html',
  styleUrls: ['./document-card.component.scss'],
})
export class DocumentCardComponent implements OnInit {
  @Input() filename: string;
  @Input() guid: string;
  @Output() selected: EventEmitter<boolean> = new EventEmitter();

  constructor() { }

  ngOnInit() { }

  public fileSelected() {
    this.selected.emit(true);
  }

}
