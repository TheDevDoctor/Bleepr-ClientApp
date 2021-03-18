import { Component, OnInit, ViewChild } from '@angular/core';
import { IonSearchbar, IonInfiniteScroll } from '@ionic/angular';
import { SearchService } from 'src/app/services/search.service';
import { UserService } from 'src/app/services/user.service';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { FeedService } from 'src/app/services/feed.service';
import { HelperService } from 'src/app/services/helper.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Plugins } from '@capacitor/core';

const { Keyboard } = Plugins;

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page implements OnInit {
  @ViewChild(IonSearchbar) searchbar;
  @ViewChild(IonInfiniteScroll) infiniteScroll: IonInfiniteScroll;

  slideOpts = {
    initialSlide: 0,
    slidesPerView: 1.5,
    spaceBetween: -16
  };

  searchOptions = {
    articles: true,
    bleeps: true,
    users: true,
  };

  continuationToken = {
    articles: undefined,
    bleeps: undefined,
    users: undefined,
  };

  public searchText: string;
  public smallScreen: boolean;
  public headerHidden: boolean;
  public userFragment: any;

  private bleepsContToken: string;
  private articlesContToken: string;
  private usersContToken: string;
  public searchToRecieve = 0;

  private databaseResponse = [];
  public contentResults;
  public userResults;

  public bleepLikes;
  public bleepStats;

  private subscriptions: Subscription[] = [];

  constructor(
    private searchService: SearchService,
    private userService: UserService,
    private feedService: FeedService,
    private helper: HelperService,
    private observer: BreakpointObserver,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  public optionPressed(option) {
    this.searchOptions[option] = !this.searchOptions[option];
  }

  ngOnInit() {
    this.userService.returnUser().subscribe(user => {
      this.userFragment = user.fragment;
    });

    this.observer.observe('(max-width: 540px)').subscribe(result => {
      this.smallScreen = result.matches;

      // if changes screen size need to enforce showing of header:
      if (this.smallScreen === false) {
        this.slideOpts.slidesPerView = 2.5;
        this.headerHidden = false;
      }
    });


    // this.route.queryParams.subscribe(params => {
    //   console.log(params);
    //   if (this.router.getCurrentNavigation().extras.state) {
    //     this.searchText = this.router.getCurrentNavigation().extras.state.search;
    //     this.search(true);
    //   }
    // });
  }

  ionViewWillEnter() {
    const subs = this.searchService.getSearchText().subscribe(text => {
      this.searchText = text;
    });

    if (this.searchText) {
      this.onSearchPressed(this.searchText);
    }

    this.subscriptions.push(subs);
  }

  ionViewWillLeave() {
    this.subscriptions.forEach(subs => {
      subs.unsubscribe();
    });
    this.subscriptions = [];
  }

  onSearchPressed(text?) {
    this.searchText = text ? text.toLowerCase() : this.searchbar.el.value.toLowerCase();
    this.contentResults = [];
    this.userResults = [];
    this.databaseResponse = [];

    this.searchToRecieve = 0;

    this.continuationToken = {
      articles: undefined,
      bleeps: undefined,
      users: undefined,
    };

    this.search(true);
  }

  private search(includeUsers = false) {
    for (const key of Object.keys(this.searchOptions)) {
      if (this.searchOptions[key] && this.continuationToken[key] !== null) {

        if (key === 'bleeps') {
          this.searchToRecieve++;
          this.searchBleeps(this.searchText);
        } else if (key === 'articles') {
          this.searchToRecieve++;
          this.searchArticles(this.searchText);
        } else if (key === 'users' && includeUsers) {
          this.searchToRecieve++;
          this.searchUsers(this.searchText);
        }
      }
    }
  }

  onHeaderSearch(text) {
    if (text !== '') {
      this.onSearchPressed(text);
    }
  }

  private searchBleeps(text) {
    this.searchService.searchBleeps(text, 5, this.continuationToken.bleeps).subscribe(res => {
      this.searchToRecieve--;
      if (res.ok) {
        this.continuationToken.bleeps = res.headers.get('x-ms-continuation');

        const docs = res.body.Documents.map(doc => {
          doc.searchType = 'bleep';
          return doc;
        });
        this.addToContentResponse(docs);
      }
    });
  }

  private searchArticles(text) {
    this.searchService.searchArticles(text, 5, this.continuationToken.articles).subscribe(res => {
      this.searchToRecieve--;
      if (res.ok) {
        this.continuationToken.articles = res.headers.get('x-ms-continuation');

        const docs = res.body.Documents.map(doc => {
          doc.searchType = 'article';
          return doc;
        });
        this.addToContentResponse(docs);
      }
    });
  }

  private searchUsers(text) {
    this.searchService.searchUsers(text, 20, this.continuationToken.users).subscribe(res => {
      this.searchToRecieve--;
      if (res.ok) {
        const docs = res.body.Documents.map(doc => {
          doc.connectStatus = this.userService.checkConnectionStatus(doc.id);
          return doc;
        });
        this.addToUserResponse(docs);
      }
    });
  }

  private addToContentResponse(docs) {
    this.databaseResponse = this.databaseResponse.concat(docs);

    this.getBleepMetadata(this.databaseResponse);

    if (!this.contentResults) {
      this.contentResults = [];
    }

    this.contentResults = this.contentResults.concat(this.databaseResponse);
    this.contentResults.sort((a, b) => b.timestamp - a.timestamp);
    this.databaseResponse = [];

    if (this.searchToRecieve === 0) {
      this.infiniteScroll.complete();
    }

  }

  private addToUserResponse(docs) {
    this.userResults = docs;
  }

  private getBleepMetadata(bleeps) {
    this.feedService.fetchBleepsLikesData(bleeps).subscribe(data => {
      const databaseLikes = this.helper.convertArrayToDict(data.body.Documents);
      this.bleepLikes = { ...this.bleepLikes, ...databaseLikes };
    });
    this.feedService.fetchBleepStatsData(bleeps).subscribe(data => {
      const databaseStats = this.helper.convertArrayToDict(data.body.Documents);
      this.bleepStats = { ...this.bleepStats, ...databaseStats };
    });
  }

  checkForCompletion() {
    let complete = true;
    for (const key of Object.keys(this.searchOptions)) {
      if (this.continuationToken[key] && this.searchOptions[key]) {
        complete = false;
      }
    }
    if (complete) {
      this.infiniteScroll.disabled = true;
      this.infiniteScroll.complete();
      return true;
    }
  }

  public onInfiniteScroll(event) {
    if (this.checkForCompletion()) {
      return;
    }

    this.search();
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

  searchInputOccured(keycode) {

    // if keycodde is enter:
    if (keycode === 13) {
      this.onSearchPressed();
      Keyboard.hide();
    }
  }
}
