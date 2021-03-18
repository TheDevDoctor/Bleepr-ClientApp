import { Component, OnInit } from '@angular/core';
import { FeedService } from '../../services/feed.service';
import { StateService } from '../../services/state.service';
import { UserService } from 'src/app/services/user.service';
import { distinct, distinctUntilChanged, first } from 'rxjs/operators';
import { UserListPage } from '../user-list/user-list.page';
import { ModalController } from '@ionic/angular';
import { BreakpointObserver } from '@angular/cdk/layout';
import { NavigationExtras, Router } from '@angular/router';
import { MonitoringService } from 'src/app/services/monitoring/monitoring.service';

@Component({
  selector: 'feed-page',
  templateUrl: 'feed.page.html',
  styleUrls: ['feed.page.scss']
})
export class FeedPage implements OnInit {
  public bleeps: any[];
  public bleepStats: {};
  public bleepLikes: {};

  public currentPlatform: string;
  public user: any;
  public isRefreshing: boolean;
  public smallScreen: boolean;
  public headerHidden: boolean;

  public isInfiniteScroll: boolean;

  slideOpts = {
    spaceBetween: -96
  };

  constructor(
    private feedService: FeedService,
    private stateService: StateService,
    private userService: UserService,
    private observer: BreakpointObserver,
    private router: Router,
    private monitoringService: MonitoringService
  ) {
    this.stateService.getCurrentPlatform().subscribe(plat => this.currentPlatform = plat);
  }

  ngOnInit() {
    this.observer.observe('(max-width: 540px)').subscribe(result => {
      this.smallScreen = result.matches;

      // if changes screen size need to enforce showing of header:
      if (this.smallScreen === false) {
        this.headerHidden = false;
      }
    });

    this.userService.returnUser().pipe(
      first(user => user.fragment !== undefined)
    ).subscribe(user => {
      this.user = user;
      this.refreshFeed();
    });

    this.isInfiniteScroll = true;

    this.feedService.returnBleeps().subscribe(bleeps => {
      this.bleeps = bleeps;
      this.isInfiniteScroll = true;
    });

    this.feedService.returnBleepsStats().subscribe(bleepsStats => {
      this.bleepStats = bleepsStats;
    });
    this.feedService.returnBleepLikes().subscribe(bleepLikes => {
      this.bleepLikes = bleepLikes;
    });
  }

  loadData(event) {
    // if at the end of the feed then set infinite scroll false;
    if (this.feedService.returnStaticStartIndex() === null) {
      event.target.complete();
      this.isInfiniteScroll = false;
      this.monitoringService.logEvent('scrolled-feed-reachedEnd');
      return;
    } else {
      this.monitoringService.logEvent('scrolled-feed-loadMore');
    }

    this.feedService.fetchBleeps();
    this.feedService.returnStartIndex().subscribe(index => {
      event.target.complete();
    });
  }

  doRefresh(event = null) {
    this.monitoringService.logEvent('refreshFeed');
    this.refreshFeed();

    const subs = this.feedService.isRefreshingFeed().subscribe(isRefreshing => {
      this.isRefreshing = isRefreshing;
      if (!isRefreshing) {
        if (event) {
          event.target.complete();
        }
        subs.unsubscribe();
      }
    });
  }

  refreshFeed() {
    this.isInfiniteScroll = true;
    this.feedService.refreshFeed();
  }

  trackByFn(index, item) {
    if (item._ts) {
      return item.id + item._ts;
    }
    return item.id; // or item.id
  }

  onScroll(event) {
    // used a couple of "guards" to prevent unnecessary assignments if scrolling in a direction and the var is set already:
    if (event.detail.deltaY > 0 && this.headerHidden) { return; }
    if (event.detail.deltaY < 0 && !this.headerHidden) { return; }
    if (event.detail.deltaY > 0) {
      this.headerHidden = true;
    } else {
      this.headerHidden = false;
    }
  }

  onHeaderSearch(ev) {
    if (ev) {
      const searchText = ev;
      const navigationExtras: NavigationExtras = { state: { search: searchText } };
      this.router.navigate(['/home/search'], navigationExtras);
    }
  }
}
