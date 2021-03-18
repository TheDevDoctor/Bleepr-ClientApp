import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BlobStorageRequest } from '../../models/azure-storage';
import { CachingService } from '../caching.service';
import { map, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SasGeneratorService {
  constructor(
    private http: HttpClient,
    private cachingService: CachingService
  ) { }

  getSasToken(): Observable<BlobStorageRequest> {
    let obs = this.cachingService.checkObsCache('blobSas', 'sas', 79200);
    if (obs) {
      return obs;
    }

    obs = this.http.get<any>(
      `${environment.apiBaseURL}BlobAccess/GetToken`
    ).pipe(
      shareReplay(1),
      map(response => {
        const blobStorageReq: BlobStorageRequest = {
          storageUri: environment.blobStorage.storageUri,
          storageAccessToken: response
        };
        return blobStorageReq;
      })
    );
    this.cachingService.addToObsCache('blobSas', 'sas', obs);
    return obs;
  }
  // getSasToken(): Observable<BlobStorageRequest> {
  //   return this.http.get<BlobStorageRequest>(
  //     `${environment.sasGeneratorUrl}/api/GenerateSasToken`
  //   );
  // }
}
