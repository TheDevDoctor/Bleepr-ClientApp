import { Component, OnInit, Input } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-filter-popover',
  templateUrl: './filter-popover.component.html',
  styleUrls: ['./filter-popover.component.scss'],
})
export class FilterPopoverComponent implements OnInit {
  @Input() filterOptions: { draft: boolean, review: boolean, published: boolean };

  constructor(private popoverController: PopoverController) { }

  ngOnInit() {}

  dismissPopover() {
    this.popoverController.dismiss(this.filterOptions);
  }

}
