import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, UrlTree, RouterStateSnapshot, NavigationExtras } from '@angular/router';
import { UserService } from '../services/user.service';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class IsUserGuardService implements CanActivate {
  user: any;

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | boolean | UrlTree {

    return this.userService.returnUser().pipe(
      take(1),
      map(user => {
        if (user) {
          return true;
        } else {
          // returning UrlTree is now preferred method for preferential redirection.
          const navigationExtras: NavigationExtras = { queryParams: { returnUrl: state.url }, state: { returnUrl: state.url } };
          return this.router.createUrlTree(['loading-page'], navigationExtras);
        }
      })
    );
  }
}
