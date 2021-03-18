import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-text-input-dropdown',
  templateUrl: './text-input-dropdown.component.html',
  styleUrls: ['./text-input-dropdown.component.scss'],
})
export class TextInputDropdownComponent implements OnInit {

  @Input() dropdownTop: string;
  @Input() dropdownLeft: string;
  @Input() dropdownWidth: string;
  @Input() dropdownHeight = '200px';

  @Input() items: any[];
  @Input() searching: any[];

  @Output() itemSelected: EventEmitter<any> = new EventEmitter<any>();

  constructor() { }

  ngOnInit() {}

  onItemSelected(item) {
    this.itemSelected.emit(item);
  }

}
