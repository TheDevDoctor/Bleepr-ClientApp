import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CachingService } from './caching.service';
import { environment } from 'src/environments/environment';
import { Observable, BehaviorSubject } from 'rxjs';
import { SasGeneratorService } from './blob_storage/sas-generator.service';
import { shareReplay, retry } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AppDataService {
  private sasToken: string;

  private appData: any = {};
  private appData$: BehaviorSubject<any> = new BehaviorSubject<any>(this.appData);
  private specialtiesArray: any;
  private professionsArray: any;

  private specialties: string[];
  private specialties$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>(this.specialties);
  private professions: string[] = [];
  private professions$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>(this.professions);
  private hospitals: string[];
  private hospitals$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>(this.professions);
  private institutions: string[];
  private institutions$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>(this.professions);
  private degrees: string[];
  private degrees$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>(this.professions);
  private degreesQual: string[];
  private degreesQual$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>(this.professions);
  private medicalSchools: string[] = [];
  private medicalSchools$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>(this.professions);
  private universities: string[];
  private universities$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>(this.professions);


  constructor(
    private http: HttpClient,
    private cachingService: CachingService,
    private sasGenerator: SasGeneratorService
  ) {
    this.sasGenerator.getSasToken().subscribe(req => {
      this.sasToken = req.storageAccessToken;
      this.getDataFiles();
    });
  }

  private getAppDataFile(file): Observable<any> {

    let obs = this.cachingService.checkObsCache(file, 'appData', 86400);
    if (obs) {
      return obs;
    }

    obs = this.http.get<any>(`${environment.blobStorage.storageUri}app-data/${file}.json?${this.sasToken}`).pipe(
      shareReplay(1));

    this.cachingService.addToObsCache(file, 'appData', obs);
    return obs;
  }

  private getDataFiles() {
    const dataFiles = ['specialties', 'professions', 'hospitals', 'institutions', 'degrees', 'universities'];
    dataFiles.forEach(file => {
      this.getAppDataFile(file).subscribe(data => {
        this.appData[file] = data;
        this.sortArrays(file);
      });
    });
  }

  private sortArrays(type) {
    if (type === 'specialties') {
      this.specialties = [];
      Object.keys(this.appData[type]).forEach(spec => this.specialties.push(this.appData.specialties[spec].name));
      this.specialties.sort();
      this.specialties$.next(this.specialties);
    } else if (type === 'professions') {
      Object.keys(this.appData[type]).forEach(prof => this.professions.push(this.appData.professions[prof].name));
      this.professions.sort();
      this.professions$.next(this.professions);
    } else if (type === 'hospitals') {
      this.hospitals = [];
      Object.keys(this.appData.hospitals).forEach(hosp => this.hospitals.push(this.appData.hospitals[hosp].name));
      this.hospitals.sort();
      this.hospitals$.next(this.hospitals);
    } else if (type === 'institutions') {
      this.institutions = [];
      Object.keys(this.appData.institutions).forEach(inst => this.institutions.push(this.appData.institutions[inst].name));
      this.institutions.sort();
      this.institutions$.next(this.institutions);
    } else if (type === 'degrees') {
      this.degreesQual = Object.keys(this.appData.degrees).map(deg => deg = this.appData.degrees[deg].abr);
      this.degreesQual.sort();
      this.degreesQual$.next(this.degreesQual);
    } else if (type === 'universities') {
      this.universities = Object.keys(this.appData.universities).map(univ => {
        if (this.appData.universities[univ].med_school) {
          this.medicalSchools.push(this.appData.universities[univ].med_school);
        }
        univ = this.appData.universities[univ].name;
        return univ;
      });
      this.universities.sort();
      this.medicalSchools.sort();
      this.universities$.next(this.universities);
      this.medicalSchools$.next(this.medicalSchools);
    }
  }

  public returnAppData() {
    return this.appData$.asObservable();
  }
  public returnSpecialtyList() {
    return this.specialties$.asObservable();
  }
  public returnProfessionList() {
    return this.professions$.asObservable();
  }
  public returnHospitalsList() {
    return this.hospitals$.asObservable();
  }
  public returnInstitutionList() {
    return this.institutions$.asObservable();
  }
  public returnUniversitiesList() {
    return this.universities$.asObservable();
  }
  public returnDegreesQualList() {
    return this.degreesQual$.asObservable();
  }

  public getProfessionGrades(prof: string) {
    const profession = prof.toLowerCase().trim().replace(' ', '_');
    if (this.appData.professions[profession]) {
      return this.appData.professions[profession].grades;
    } else {
      return null;
    }
  }

  public getProfessionSpecialties(prof: string) {
    const profession = prof.toLowerCase().trim().replace(' ', '_');
    if (this.appData.professions[profession]) {
      if (this.appData.professions[profession].specialty) {
        if (Array.isArray(this.appData.professions[profession].specialty)) {
          return this.appData.professions[profession].specialty;
        } else {
          return this.specialties;
        }
      }
    }
    return null;
  }

  public getHospitalLocation(hosp: string) {
    const hospital = hosp.toLowerCase().trim().replace(/-/g, ' ').replace(/'/g, '').replace(/ /g, '_');
    if (this.appData.hospitals[hospital]) {
      return this.appData.hospitals[hospital].location;
    } else {
      return null;
    }
  }
}
