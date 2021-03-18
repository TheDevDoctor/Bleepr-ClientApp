import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UnsplashService {

  constructor(private http: HttpClient) { }

  public queryUnsplash(query: string, page: number): Observable<any> {
    return this.http.get<any>(`https://api.unsplash.com/search/photos?page=${page}&query=${query}&per_page=20`,
      { headers: { Authorization: 'Client-ID *********************************' } });
  }
}
