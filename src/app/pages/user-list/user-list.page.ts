import { Component, OnInit, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { UserService } from 'src/app/services/user.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Router } from '@angular/router';
// import { trigger, transition, style, animate } from '@angular/animations';


@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.page.html',
  styleUrls: ['./user-list.page.scss']
})
export class UserListPage implements OnInit {

  // optional input, if items are already selected then can be fed back to list so that they will still appear as selected
  @Input() selected: any[] = [];

  // searchable type, if all can search over both connections and bleepers.
  @Input() searchable: 'all' | 'connections' | 'bleepers' = 'all';

  // if selectable, then users can be selected and appended into a list for use cases such as starting a new conversation.
  @Input() selectable = false;

  @Input() selectMinimum = 1;
  @Input() selectMaximum = 100;

  public displayList = [];
  public searchType;
  private connections: any[];
  private bleepers: any[];
  public showSelected = false;
  private searchText: string;
  public searchHidden = false;
  public searchingBleepers = false;
  public smallScreen: boolean;

  @Input() authors: Array<any>;

  constructor(
    private modalController: ModalController,
    private userService: UserService,
    private observer: BreakpointObserver,
    private router: Router) { }

  ngOnInit() {
    this.searchType = this.searchable === 'bleepers' ? 'bleepers' : 'connections';

    if (this.searchType === 'connections') {
      this.userService.returnConnectionFragments().subscribe(con => {
        if (con) {
          this.connections = con;
          this.displayList = this.connections;
        } else {
          this.userService.getConnectionFragments();
        }
      });
    } else {
      this.displayList = this.bleepers;
    }

    this.observer.observe('(max-width: 540px)').subscribe(result => {
      this.smallScreen = result.matches;
    });
  }

  dismissModal(withData: boolean) {
    this.modalController.dismiss(withData ? this.selected : null);
  }

  authorPressed(ev, connection) {
    if (ev.detail.checked) {
      this.authors.push(connection.id);
    } else {
      const index = this.authors.indexOf(connection, 0);
      if (index > -1) {
        this.authors.splice(index, 1);
      }
    }
  }

  public userSelected(connect) {

    if (this.selectable) {
      this.addToSelected(connect);
    } else {
      this.router.navigate(['/home/profile', connect.userId]);
      this.dismissModal(false);
    }
  }

  private addToSelected(connect) {
    const index = this.selected.findIndex(e => e.id === connect.id);

    if (index === -1) {
      this.selected.push(connect);
    } else {
      this.selected.splice(index, 1);
    }

  }

  public isSelected(connect) {
    const index = this.selected.findIndex(e => e.id === connect.id);
    if (index > -1) {
      return true;
    } else {
      return false;
    }
  }

  public onClearSelected() {
    this.clearSelected();
  }

  private clearSelected() {
    this.selected = [];
  }

  public onSearchTextChange(text) {
    this.searchText = text.toLowerCase();
    if (this.searchType === 'connections') {
      this.displayList = this.searchConnections(this.searchText);
    } else if (this.searchType === 'bleepers') {
      this.searchBleepers(this.searchText);
    }

  }

  private searchConnections(text): any[] {
    if (!text) {
      return this.connections;
    }

    const searchArr: any[] = [];
    this.connections.forEach(connect => {
      const name = (connect.firstname + ' ' + connect.surname).toLowerCase();
      if (name.includes(text)) {
        searchArr.push(connect);
      }
    });
    return searchArr;
  }

  private searchBleepers(text) {
    if (text) {
      this.searchingBleepers = true;
      this.userService.searchForUsers(text).subscribe(users => {
        this.bleepers = users;
        this.displayList = this.bleepers;
        this.searchingBleepers = false;
      });
    }
  }

  public onChangeSearchType(ev) {
    this.searchType = ev.detail.value;
    if (this.searchType === 'connections') {
      this.displayList = this.connections;
      this.onSearchTextChange(this.searchText);
    } else if (this.searchType === 'bleepers') {
      this.displayList = this.bleepers;
      this.onSearchTextChange(this.searchText);
    }
  }

  public displaySelected() {
    this.showSelected = !this.showSelected;

    if (!this.showSelected) {
      if (this.searchType === 'connections') {
        this.displayList = this.connections;
      } else {
        this.displayList = this.bleepers;
      }
    } else {
      this.displayList = this.selected;
    }
  }

  onScroll(event) {
    // used a couple of "guards" to prevent unnecessary assignments if scrolling in a direction and the var is set already:
    if (event.detail.deltaY > 0 && this.searchHidden) { return; }
    if (event.detail.deltaY < 0 && !this.searchHidden) { return; }
    if (event.detail.deltaY > 0) {
      this.searchHidden = true;
    } else {
      this.searchHidden = false;
    }
  }

}
