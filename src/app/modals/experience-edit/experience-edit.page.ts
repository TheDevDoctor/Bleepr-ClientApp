import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { UserService } from 'src/app/services/user.service';
import { ModalController } from '@ionic/angular';
import { AppDataService } from 'src/app/services/app-data.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-experience-edit',
  templateUrl: './experience-edit.page.html',
  styleUrls: ['./experience-edit.page.scss'],
})
export class ExperienceEditPage implements OnInit {
  @Input() dataIndex: number | null;

  public datePickerObj: any = {
    inputDate: new Date().getDate(),
    showTodayButton: false, // default true
    clearButton: false,
    closeOnSelect: true, // default false
    mondayFirst: true, // default false
    titleLabel: 'Select a Date', // default null
    momentLocale: 'en-GB', // Default 'en-US'
  };

  searchOptions = {
    profession: undefined,
    specialty: undefined,
    grade: undefined,
    hospital: undefined,
    institution: undefined
  };

  private profile: any;
  updatingUser = false;
  // used to confirm update was succesful.
  experienceArrayLength: number;

  experienceForm: FormGroup;

  dropdownLeft = '0';
  dropdownTop = '0';
  dropdownWidth = '0';
  dropdownHeight = '240px';
  dropdownItems = [];

  focussedElement: string;

  public currentRole = false;

  pickerOptions = {
    cssClass: 'desktop-picker-wrapper'
  };

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private modalController: ModalController,
    private appData: AppDataService) { }


  public get experienceFormRotations() {
    return this.experienceForm.get('rotations') as FormArray;
  }

  ngOnInit() {
    this.appData.returnProfessionList().subscribe(prof => {
      this.searchOptions.profession = prof;
    });
    this.appData.returnHospitalsList().subscribe(hosp => {
      this.searchOptions.hospital = hosp;
    });
    this.appData.returnInstitutionList().subscribe(inst => {
      this.searchOptions.institution = inst;
    });

    this.userService.returnUser().subscribe(user => {
      this.profile = user.profile;

      if (!this.experienceForm) {
        this.buildExperienceForm();
      }

      if (this.profile.experience.length === this.experienceArrayLength && this.updatingUser) {
        this.closeModal();
      }
    });
  }

  addNewRotation(rot?) {
    const rotation = this.experienceForm.get('rotations') as FormArray;
    rotation.push(this.createRotation(rot));
  }

  removeRotation(i) {
    const rotation = this.experienceForm.get('rotations') as FormArray;
    rotation.removeAt(i);
  }

  onFocus(ev) {
    this.focussedElement = ev.target.parentElement.id;

    this.dropdownTop = ev.target.parentElement.offsetTop + ev.target.parentElement.offsetHeight + 4 + 'px';
    this.dropdownLeft = ev.target.parentElement.offsetLeft + 'px';
    this.dropdownWidth = ev.target.parentElement.offsetWidth + 'px';
    this.dropdownItems = [];
  }

  onBlur(ev) {
    if (this.focussedElement === ev.target.parentElement.id) {
      this.focussedElement = null;
    }
  }

  buildExperienceForm() {
    this.experienceForm = this.fb.group(
      {
        role: [null, [Validators.required]],
        grade: [null],
        institution: [null, [Validators.required]],
        hospital: [null],
        location: [null],
        start_date: [null, [Validators.required]],
        end_date: [null, [Validators.required]],
        rotations: this.fb.array([]),
        description: [null]
      }
    );

    // subscribe to changes in role field and if changed to doctor or nurse set validation on grade field.
    const $changes = this.experienceForm.controls.role.valueChanges;
    $changes
      .pipe(
        debounceTime(200),
        distinctUntilChanged()
      ).subscribe(role => {
        this.getGradeAndSpecData(role);
        this.searchFormOptions('profession', role);
      });

    // if editing current experience patch the form with the value.
    if (this.dataIndex != null) {
      const rotations = this.experienceForm.get('rotations') as FormArray;
      while (rotations.length) {
        rotations.removeAt(0);
      }

      this.profile.experience[this.dataIndex].rotations.forEach(rot => this.addNewRotation(rot));
      this.experienceForm.patchValue(this.profile.experience[this.dataIndex]);
      if (!this.experienceForm.get('end_date').value) {
        this.experienceForm.controls.end_date.setValue('Current');
        this.experienceForm.controls.end_date.disable();
      }
    }

    this.experienceForm.controls.grade.valueChanges.subscribe(grade => this.searchFormOptions('grade', grade));
    this.experienceForm.controls.institution.valueChanges.subscribe(inst => this.searchFormOptions('institution', inst));

    this.experienceForm.controls.hospital.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged()
    ).subscribe(hosp => {
      this.searchFormOptions('hospital', hosp);
      const location = this.appData.getHospitalLocation(hosp);
      if (location) {
        this.experienceForm.controls.location.setValue(location);
      }
    });
  }

  getGradeAndSpecData(role) {
    this.searchOptions.grade = this.appData.getProfessionGrades(role);
    this.searchOptions.specialty = this.appData.getProfessionSpecialties(role);
  }

  createRotation(data?) {
    let rotation;
    if (data) {
      rotation = this.fb.group({
        specialty: [data.specialty],
        start: [data.start],
        end: [data.end]
      });
    } else {
      rotation = this.fb.group({
        specialty: [null],
        start: [null],
        end: [null]
      });
    }

    rotation.controls.specialty.valueChanges.subscribe(spec => this.searchFormOptions('specialty', spec));
    if (data && !data.end) {
      rotation.controls.end.setValue('Current');
      rotation.controls.end.disable();
    }

    return rotation;
  }

  searchFormOptions(controlName, text) {
    const searchResults = [];

    if (!this.searchOptions[controlName]) {
      return;
    }

    if (text.length > 0) {
      this.searchOptions[controlName].forEach(option => {
        if (option.toLowerCase().indexOf(text.toLowerCase()) === 0) {
          searchResults.push(option);
        }
      });
    }
    searchResults.sort();
    this.dropdownItems = searchResults;
  }

  onDropdownItemSelected(ev) {
    let element: string;
    // handler for if specialty is the current selection option.
    if (this.focussedElement.indexOf('specialty') === 0) {
      element = this.focussedElement.split('-')[1];
      const rotations = this.getControls();
      // tslint:disable-next-line:no-string-literal
      rotations[element].controls.specialty.setValue(ev);

    } else {
      element = this.focussedElement;
      this.experienceForm.controls[element].setValue(ev);
    }
  }

  // this is the work around for odd way angular parses formarrays. Don't change as will not work in single function.
  getControls() {
    return (this.experienceForm.get('rotations') as FormArray).controls;
  }

  update() {
    if (this.dataIndex != null) {
      this.profile.experience[this.dataIndex] = this.experienceForm.value;
    } else {
      this.profile.experience.unshift(this.experienceForm.value);
    }
    this.userService.updateUserProfile(this.profile).subscribe();
    this.experienceArrayLength = this.profile.experience.length;
    this.updatingUser = true;
  }

  delete() {
    if (this.dataIndex != null && this.dataIndex > -1) {
      this.profile.experience.splice(this.dataIndex, 1);
    }
    this.userService.updateUserProfile(this.profile).subscribe();
    this.experienceArrayLength = this.profile.experience.length;
    this.updatingUser = true;
  }

  closeModal() {
    this.modalController.dismiss();
  }

  isCurrentExperience(ev) {
    const isChecked = ev.detail.checked;
    if (isChecked) {
      this.experienceForm.controls.end_date.setValue('Current');
      this.experienceForm.controls.end_date.disable();
    } else {
      this.experienceForm.controls.end_date.setValue(null);
      this.experienceForm.controls.end_date.enable();
    }
  }

  isCurrentRotation(ev, i) {
    const isChecked = ev.detail.checked;
    const rot = this.experienceFormRotations.at(i) as FormGroup;
    if (isChecked) {
      rot.controls.end.setValue('Current');
      rot.controls.end.disable();
    } else {
      rot.controls.end.setValue(null);
      rot.controls.end.enable();
    }
  }

}
