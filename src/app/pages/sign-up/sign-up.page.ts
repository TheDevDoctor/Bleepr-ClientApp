import { Component, OnInit, ViewChild, ElementRef, TemplateRef } from '@angular/core';
import { Platform, IonSlides } from '@ionic/angular';
import { Plugins, CameraResultType } from '@capacitor/core';
import { UserService } from 'src/app/services/user.service';
import { BehaviorSubject } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { StateService } from 'src/app/services/state.service';
import { Router, NavigationExtras } from '@angular/router';
import { AppDataService } from 'src/app/services/app-data.service';
import { MonitoringService } from 'src/app/services/monitoring/monitoring.service';

const { Camera } = Plugins;

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
})
export class SignUpPage implements OnInit {

  @ViewChild('slider') slider: IonSlides;
  @ViewChild('university') tUni: TemplateRef<any>;
  @ViewChild('medschoolyear') tYear: TemplateRef<any>;
  @ViewChild('careergoal') tGoal: TemplateRef<any>;
  @ViewChild('grade') tGrade: TemplateRef<any>;
  @ViewChild('specialty') tSpecialty: TemplateRef<any>;

  public sliderOptions = {
    allowSlideNext: true
  };

  public sliderContent = [];

  public professions;

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private router: Router,
    private appData: AppDataService,
    private monitoringService: MonitoringService
  ) { }

  ngOnInit() {
    // this.userService.returnUser().subscribe(usr => this.user = usr);

    // this.appData.returnHospitalsList().subscribe(data => this.searchOptions.hospital = data);
    // this.appData.returnSpecialtyList().subscribe(data => this.searchOptions.specialty = data);
    this.appData.returnProfessionList().subscribe(data => {
      this.professions = data;
      console.log(this.professions);
    });
  }

  elementSelected(value, detail) {
    this.setNextSlide(value, detail);
  }

  nextSlide() {
    this.slider.slideNext();
  }

  prevSlide() {
    this.slider.slidePrev();
  }

  setNextSlide(value, detail) {
    value = value.toLowerCase();
    if (detail === 'profession') {
      if (value === 'medical student') {
        this.sliderContent.push( { template: this.tUni } );
      } else if (value === 'doctor') {
        this.sliderContent.push( { template: this.tGrade } );
      }
    } else if (detail === 'medical school') {
      this.sliderContent.push( { template: this.tYear } );
    } else if (detail === 'current year') {
      this.sliderContent.push( { template: this.tGoal } );
    } else if (detail === 'doctor grade') {
      this.sliderContent.push( { template: this.tSpecialty } );
    }
  }

  // Completion functions ========================================================================================

  public onCompleteSignUp() {

    // const signUpData = this.detailsForm.value;

    // const navigationExtras: NavigationExtras = {
    //   state: {
    //     user: signUpData
    //   }
    // };

    // this.router.navigate(['loading-page'], navigationExtras);
  }

}
