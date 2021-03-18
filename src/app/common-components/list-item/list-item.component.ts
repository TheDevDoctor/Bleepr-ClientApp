import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, NavController } from '@ionic/angular';

@Component({
  selector: 'app-list-item',
  templateUrl: './list-item.component.html',
  styleUrls: ['./list-item.component.scss'],
})
export class ListItemComponent implements OnInit {
  @Output() selected: EventEmitter<any> = new EventEmitter();
  @Input() data: any;
  currentFile: any;

  constructor() { }

  ngOnInit() {}

  fileSelected() {

    this.selected.emit(this.data);

  }
}
