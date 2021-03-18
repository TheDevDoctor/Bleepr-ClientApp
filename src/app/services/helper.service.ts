import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HelperService {

  constructor() { }

  /**
   * Helper method for converting array of cosmos docs to dictionary with id keys
   * @param docsArray the array of documents to process
   */
  public convertArrayToDict(docsArray) {
    // Convert the array response to a dict so we can consume in templates via stats[id] / likes[id]
    const responseDict: any = {};
    const idKey = 'id';
    for (const doc of docsArray) {
      // Take the id of the document and remove the 'stats-' or 'likes-' prefix for easy ref
      const key = doc[idKey].slice(6);
      responseDict[key] = doc;
    }
    return responseDict;
  }
}
