import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from 'src/environments/environment';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CrossrefService {
  doiMetadataResponse: Subject<any> = new Subject<any>();

  constructor(private http: HttpClient) {

  }

  returnMetadata() {
    return this.doiMetadataResponse.asObservable();
  }

  getMetadataFromDoi(doi) {

    this.http.get(`https://api.crossref.org/works/${doi}`, { observe: 'response' }).subscribe(res => {
      if (res.ok) {
        console.log(res);
        // tslint:disable-next-line:no-string-literal
        const message: any = res.body['message'];
        // tslint:disable-next-line:max-line-length
        const dateArray = message['published-online'] ? message['published-online']['date-parts'][0] : message['published-print']['date-parts'][0];
        let date;
        if (dateArray.length > 0) {
          // tslint:disable-next-line:max-line-length
          date = dateArray.length === 3 ? new Date(dateArray[0], dateArray[1], dateArray[2]) : dateArray.length === 2 ?  new Date(dateArray[0], dateArray[1]) :  new Date(dateArray[0]);
        }
        const response = {
          title: message.title[0],
          publisher: message['container-title'][0],
          published_date: date.toISOString(),
          authors: [],
          url: message.URL,
          doi: message.DOI,
          description: null
        };

        message.author.forEach(author => {
          response.authors.push({ given: author.given, family: author.family });
        });

        this.doiMetadataResponse.next(response);
      } else {
        console.log(`There was an error getting doi data from: ${doi}`);
      }
    });
  }

}
