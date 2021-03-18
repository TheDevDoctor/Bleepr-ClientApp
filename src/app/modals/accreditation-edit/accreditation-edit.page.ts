import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { UserService } from 'src/app/services/user.service';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-accreditation-edit',
  templateUrl: './accreditation-edit.page.html',
  styleUrls: ['./accreditation-edit.page.scss'],
})
export class AccreditationEditPage implements OnInit {
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

  public accreditationForm: FormGroup;
  private accreditationArrayLength: number;
  public updatingUser = false;

  private profile: any;

  public pickerOptions = {
    cssClass: 'desktop-picker-wrapper'
  };

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private modalController: ModalController) { }

  ngOnInit() {
    this.userService.returnUser().subscribe(user => {
      this.profile = user.profile;

      if (!this.accreditationForm) {
        this.buildExperienceForm();
      }

      if (this.profile.accreditation.length === this.accreditationArrayLength && this.updatingUser) {
        this.closeModal();
      }
    });
  }

  buildExperienceForm() {

    this.accreditationForm = this.fb.group(
      {
        name: [null, [Validators.required]],
        organisation: [null, [Validators.required]],
        issue: [null, [Validators.required]],
        expiration: [null, [Validators.required]]
      }
    );

    if (this.dataIndex != null) {
      this.accreditationForm.patchValue(this.profile.accreditation[this.dataIndex]);

      if (!this.accreditationForm.get('expiration').value) {
        this.accreditationForm.controls.expiration.setValue('No Expiration');
        this.accreditationForm.controls.expiration.disable();
      }
    }
  }

  delete() {
    if (this.dataIndex != null && this.dataIndex > -1) {
      this.profile.accreditation.splice(this.dataIndex, 1);
    }
    this.userService.updateUserProfile(this.profile).subscribe();
    this.accreditationArrayLength = this.profile.accreditation.length;
    this.updatingUser = true;
  }

  update() {
    if (this.dataIndex != null) {
      this.profile.accreditation[this.dataIndex] = this.accreditationForm.value;
    } else {
      this.profile.accreditation.unshift(this.accreditationForm.value);
    }
    this.userService.updateUserProfile(this.profile).subscribe();
    this.accreditationArrayLength = this.profile.accreditation.length;
    this.updatingUser = true;
  }

  closeModal() {
    this.modalController.dismiss();
  }

  isNotExpire(ev) {
    const isChecked = ev.detail.checked;
    if (isChecked) {
      this.accreditationForm.controls.expiration.setValue('No Expiration');
      this.accreditationForm.controls.expiration.disable();
    } else {
      this.accreditationForm.controls.expiration.setValue(null);
      this.accreditationForm.controls.expiration.enable();
    }
  }
}

