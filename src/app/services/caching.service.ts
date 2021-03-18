import { Injectable, HostListener } from '@angular/core';
import { Observable, Subject, from } from 'rxjs';
import { Plugins } from '@capacitor/core';
import { debounceTime, distinctUntilChanged, timestamp } from 'rxjs/operators';

const { Storage, App, BackgroundTask } = Plugins;


@Injectable({
  providedIn: 'root'
})
export class CachingService {

  private observabeCache = {
    userFragments: {},
    userProfiles: {},
    articles: {},
    bleeps: {},
    sas: {},
    appData: {},
  };


  objectCache: any = {
    bleeps: {},
    comments: {}
  };
  objectCache$: Subject<any> = new Subject();

  constructor() {
    // get the cached objects
    const objCache = this.getCache('objectCache');
    objCache.then(data => {
      if (data) {
        this.objectCache = data;
        this.objectCache$.next(this.objectCache);
      }
    });

    // subscribe to object changes with debounce to stop frequent saves on iterations:
    this.objectCache$.asObservable().pipe(
      debounceTime(500),
    ).subscribe(val => this.saveCacheObject('objectCache', val));
  }

  public checkObsCache(id, type, timeout: number = null): Observable<any> {
    if (!this.observabeCache[type]) {
      this.observabeCache[type] = {};
    }

    if (this.observabeCache[type][id]) {
      if (timeout) {
        const cacheTime = this.observabeCache[type][id].ts;

        if ((Math.floor((Date.now() / 1000)) - cacheTime) < timeout) {
          return this.observabeCache[type][id].obs;
        } else {
          this.removeFromObsCache(id, type);
          return null;
        }
      } else {
        return this.observabeCache[type][id].obs;
      }
    } else {
      return null;
    }
  }

  public addToObsCache(id, type, observable) {
    this.observabeCache[type][id] = { obs: observable, ts: Math.floor((Date.now() / 1000)) };
    return observable;
  }

  public removeFromObsCache(id, type) {
    if (this.observabeCache[type][id]) {
      this.observabeCache[type][id] = false;
    }
  }

  /**
   * Gets the object that is being asked for from the cache. If the object is not present will return undefined.
   */
  private getObject(id: string, type: string, nestedKey?: string) {
    if (!this.objectCache[type]) {
      this.objectCache[type] = {};
    }
    if (nestedKey && !this.objectCache[type][nestedKey]) {
      this.objectCache[type][nestedKey] = {};
    }

    return nestedKey ? this.objectCache[type][nestedKey][id] : this.objectCache[type][id];
  }

  /**
   * Check if an object exists in the object cache, if the object exists will return the object, if not will return null.
   * @param id: the is that will be associate with the document. For anyy cosmos document should be its unique ID.
   * @param type: the type of document you are storing. re. messages, comments, bleeps, articles.
   * @param timeout: (optional) the time in seconds before the object should timeout.
   * @param nestedKey: (optional) the nested value under which the object resides, e.g. conversation Id / bleepId in the case
   * of messages / comments respectively.
   */
  public checkObjectCache(id: string, type: string, timeout?: number, nestedKey?: string): any {
    const object = this.getObject(id, type, nestedKey);

    if (object) {
      if (timeout) {
        const cacheTime = object.ts;

        if ((Math.floor((Date.now() / 1000)) - cacheTime) < timeout) {
          return object.obj;
        } else {
          // if timed out the object should be removed from the cache to avoid displaying error when object has been deleted in Db.
          this.removeFromObjectCache(id, type, nestedKey);
        }
      } else {
        return object.obj;
      }
    }
    return null;
  }

  /**
   * Adds an object to the object cache.
   * @param id: the is that will be associate with the document. For anyy cosmos document should be its unique ID.
   * @param type: the type of document you are storing. re. messages, comments, bleeps, articles.
   * @param obj: the object you with to store in the cache
   * @param nestedKey: (optional) for cached document such as messages and comments you want to cache them under the converationId of
   * bleepId for ease of access. By providing this as the nested value the objects will be nested within this id.
   */
  public addToObjectCache(id, type, obj, nestedKey?) {
    let object = this.getObject(id, type, nestedKey);
    const newObject = { obj, ts: Math.floor((Date.now() / 1000)) };

    if (object) {
      object = newObject;
    } else {
      nestedKey ? this.objectCache[type][nestedKey][id] = newObject : this.objectCache[type][id] = newObject;
    }

    this.objectCache$.next(this.objectCache);
    return obj;
  }

  /**
   * Check if an object exists in the object cache, if the object exists will return the object, if not will return null.
   * @param id: the is that will be associate with the document. For anyy cosmos document should be its unique ID.
   * @param type: the type of document you are storing. re. messages, comments, bleeps, articles.
   * @param nestedKey: (optional) the nested value under which the object resides, e.g. conversation Id / bleepId in the case
   * of messages / comments respectively.
   */
  public removeFromObjectCache(id, type, nestedKey?) {
    const path = nestedKey ? this.objectCache[type][nestedKey] : this.objectCache[type];

    if (path[id]) {
      delete path[id];
    }

    this.objectCache$.next(this.objectCache);
  }


  /**
   * Returns the timestamp of the earliest and latest timestamp in an object collection. Useful for comments when you want to make a
   * query for messages outside of the cached messages.
   * @param type: the type of document you are storing. re. messages, comments, bleeps, articles.
   * @param timeout: (optional) the time in seconds before the object should timeout.
   * @param nestedKey: (optional) the nested value under which the object resides, e.g. conversation Id / bleepId in the case
   * of messages / comments respectively.
   */
  public returnDocumentsEpoch(type, timeout?, nestedKey?) {
    const objectDict = nestedKey ? this.objectCache[type][nestedKey] : this.objectCache[type];

    const ts = Object.keys(objectDict).map(key => {
      if (objectDict[key].obj.timestamp) {
        if (timeout && !this.hasTimedOut(objectDict[key].obj, timeout)) {
          return objectDict[key].obj.timestamp;
        } else {
          return objectDict[key].obj.timestamp;
        }
      }
    });

    const max = Math.max(...ts);
    const min = Math.min(...ts);
    return { start: min, end: max };
  }

  public getSortedList(type, timeout?, nestedKey?) {
    const objectDict = nestedKey ? this.objectCache[type][nestedKey] : this.objectCache[type];

    const list = [];
    if (objectDict) {
      Object.keys(objectDict).map(key => {
        list.push(objectDict[key].obj);
      });
    }
    return list.sort((a, b) =>  a.timestamp - b.timestamp);
  }

  private hasTimedOut(object, timeout) {
    if ((Math.floor((Date.now() / 1000)) - object.ts) < timeout) {
      return false;
    }
    return true;
  }


  // Storing object cache locally:
  public async saveCacheObject(key, object) {
    await Storage.set({
      key,
      value: JSON.stringify(object)
    });
  }

  async getCache(key) {
    const ret = await Storage.get({ key });
    return JSON.parse(ret.value);
  }

  async clearLocalStorage() {
    await Storage.clear();
  }

  private async addStateChangeListener() {
    App.addListener('appStateChange', (state) => {

      if (!state.isActive) {
        const taskId = BackgroundTask.beforeExit(async () => {
          this.saveCacheObject('objectCache', this.objectCache);
          // store object cache.
          BackgroundTask.finish({
            taskId
          });
        });
      }
    });
  }
}



