import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { UserService } from 'src/app/services/user.service';
import { ModalController } from '@ionic/angular';
import { AppDataService } from 'src/app/services/app-data.service';

@Component({
  selector: 'app-education-edit',
  templateUrl: './education-edit.page.html',
  styleUrls: ['./education-edit.page.scss'],
})
export class EducationEditPage implements OnInit {
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
    qualification: undefined,
    degrees: undefined,
    university: undefined
  };

  public educationForm: FormGroup;
  private educationArrayLength: number;
  public updatingUser = false;

  public dropdownLeft = '0';
  public dropdownTop = '0';
  public dropdownWidth = '0';
  public dropdownHeight = '240px';
  public dropdownItems = [];

  public focussedElement: string;

  private profile: any;

  pickerOptions = {
    cssClass: 'desktop-picker-wrapper'
  };

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private modalController: ModalController,
    private appData: AppDataService) { }

  ngOnInit() {
    this.userService.returnUser().subscribe(user => {
      this.profile = user.profile;

      if (!this.educationForm) {
        this.buildExperienceForm();
      }

      if (this.profile.education.length === this.educationArrayLength && this.updatingUser) {
        this.closeModal();
      }
    });

    this.appData.returnDegreesQualList().subscribe(deg => {
      this.searchOptions.qualification = deg;
    });
    this.appData.returnUniversitiesList().subscribe(univ => {
      this.searchOptions.university = univ;
    });
  }

  buildExperienceForm() {

    this.educationForm = this.fb.group(
      {
        university: [null, [Validators.required]],
        degree: [null, [Validators.required]],
        qualification: [null, [Validators.required]],
        grade: [null],
        start_date: [null, [Validators.required]],
        end_date: [null, [Validators.required]],
        description: [null]
      }
    );

    if (this.dataIndex != null) {
      this.educationForm.patchValue(this.profile.education[this.dataIndex]);

      if (!this.educationForm.get('end_date').value) {
        this.educationForm.controls.end_date.setValue('Current');
        this.educationForm.controls.end_date.disable();
      }
    }

    this.educationForm.controls.university.valueChanges.subscribe(univ => this.searchFormOptions('university', univ));
    this.educationForm.controls.qualification.valueChanges.subscribe(deg => this.searchFormOptions('qualification', deg));
  }

  update() {
    if (this.dataIndex != null) {
      this.profile.education[this.dataIndex] = this.educationForm.value;
    } else {
      this.profile.education.unshift(this.educationForm.value);
    }
    this.userService.updateUserProfile(this.profile).subscribe();
    this.educationArrayLength = this.profile.education.length;
    this.updatingUser = true;
  }

  delete() {
    if (this.dataIndex != null && this.dataIndex > -1) {
      this.profile.education.splice(this.dataIndex, 1);
    }
    this.userService.updateUserProfile(this.profile).subscribe();
    this.educationArrayLength = this.profile.education.length;
    this.updatingUser = true;
  }

  closeModal() {
    this.modalController.dismiss();
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

  searchFormOptions(controlName, text) {
    const searchResults = [];
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
    element = this.focussedElement;
    this.educationForm.controls[element].setValue(ev);
  }

  isCurrentStudy(ev) {
    const isChecked = ev.detail.checked;
    if (isChecked) {
      this.educationForm.controls.end_date.setValue('Current');
      this.educationForm.controls.end_date.disable();
    } else {
      this.educationForm.controls.end_date.setValue(null);
      this.educationForm.controls.end_date.enable();
    }
  }
}
