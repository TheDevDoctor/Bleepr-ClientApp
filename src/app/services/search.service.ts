import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { UserService } from './user.service';
import { BehaviorSubject } from 'rxjs';
import { Router, NavigationExtras } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  public user: any;
  public searchText: string;
  public searchText$: BehaviorSubject<string> = new BehaviorSubject<string>(this.searchText);

  constructor(
    private databaseService: DatabaseService,
    private userService: UserService,
    private router: Router
  ) {
    this.userService.returnUser().subscribe(usr => {
      this.user = usr;
    });
  }

  public searchBleeps(searchTerm: string, maxItems: number, continuationToken: string) {

    // tslint:disable-next-line:max-line-length
    const query = `SELECT * FROM b WHERE b.privacy = "public" AND b.type != "article" AND (EXISTS(SELECT VALUE child FROM child IN b.tags WHERE CONTAINS(LOWER(child), "${searchTerm}")) OR CONTAINS(LOWER(b.body), "${searchTerm}")) ORDER BY b._ts DESC`;
    return this.databaseService.queryDocuments(query, 'bleeps', null, { maxItems, continuationToken });
  }

  public searchArticles(searchTerm: string, maxItems: number, continuationToken: string) {
    // tslint:disable-next-line:max-line-length
    const query = `SELECT * FROM b WHERE b.privacy = "public" AND b.type = "article" AND (EXISTS(SELECT VALUE child FROM child IN b.tags WHERE CONTAINS(LOWER(child), "${searchTerm}")) OR CONTAINS(LOWER(b.body), "${searchTerm}")) ORDER BY b._ts DESC`;
    return this.databaseService.queryDocuments(query, 'bleeps', null, { maxItems, continuationToken });
  }

  public searchUsers(searchTerm: string, maxItems: number, continuationToken: string) {
    // tslint:disable-next-line:max-line-length
    const query = `SELECT * FROM u WHERE u.type = "fragment" AND (CONTAINS(LOWER(CONCAT(u.firstname, " ", u.surname)), "${searchTerm}") OR CONTAINS(LOWER(u.specialty), "${searchTerm}") OR CONTAINS(LOWER(u.grade), "${searchTerm}")) ORDER BY u._ts DESC`;
    return this.databaseService.queryDocuments(query, 'users', null, { maxItems, continuationToken });
  }

  public setSearchText(text) {
    this.searchText = text.toLowerCase();
    this.searchText$.next(this.searchText);
  }

  public getSearchText() {
    return this.searchText$.asObservable();
  }

  public goToSearchPage() {
    if (this.router.url !== '/home/search') {
      this.router.navigate(['/home/search']);
    }
  }
}


