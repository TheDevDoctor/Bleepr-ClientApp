import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { UserService } from './user.service';
import { BehaviorSubject } from 'rxjs';
import { CachingService } from './caching.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  user: any;

  suggestedConnection: Array<any> = [];
  suggestedConnection$: BehaviorSubject<Array<any>> = new BehaviorSubject<Array<any>>(this.suggestedConnection);


  constructor(
    private databaseService: DatabaseService,
    private userService: UserService
  ) {
    this.userService.returnUser().subscribe(user => {
      this.user = user;
    });
  }

  getUserFragment(id) {
    return this.databaseService.getDocument(id, environment.cosmosDB.usersContainerId, id, 'userFragments');
  }

  getUserProfile(id) {
    return this.databaseService.getDocument(`profile-${id}`, environment.cosmosDB.usersContainerId, id, 'userProfiles');
  }

  getUsersBleeps(id) {
    let query: string;
    if (id in this.user.profile.connections) {
      // tslint:disable-next-line:max-line-length
      query = `SELECT * FROM b WHERE b.type NOT IN ('comment', 'likes', 'stats') AND b.createdById = "${id}" AND (b.privacy = "public" OR b.privacy = "private") ORDER BY b.timestamp DESC`;
    } else {
      // tslint:disable-next-line:max-line-length
      query = `SELECT * FROM b WHERE b.type NOT IN ('comment', 'likes', 'stats') AND b.createdById = "${id}" AND b.privacy = "public" ORDER BY b.timestamp DESC`;
    }
    return this.databaseService.queryDocuments(query, environment.cosmosDB.bleepsContainerId);
  }

  removeSuggestedConnection(connection) {
    const index = this.suggestedConnection.findIndex((e) => e.id === connection.id);
    if (index > -1) {
      this.suggestedConnection.splice(index, 1);
    }
    this.suggestedConnection$.next(this.suggestedConnection);
  }



  returnSuggestedConnections() {
    return this.suggestedConnection$.asObservable();
  }
}
