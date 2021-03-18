import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-input-dropdown',
  templateUrl: './input-dropdown.component.html',
  styleUrls: ['./input-dropdown.component.scss'],
})
export class InputDropdownComponent implements OnInit {

  @Input() dropdownTop: string;
  @Input() dropdownLeft: string;
  @Input() dropdownWidth: string;
  @Input() dropdownHeight: string;

  @Input() items: any[];
  @Input() searching: any[];

  @Output() itemSelected: EventEmitter<any> = new EventEmitter<any>();

  constructor() { }

  ngOnInit() {}

  onItemSelected(item) {
    this.itemSelected.emit(item);
  }

}
