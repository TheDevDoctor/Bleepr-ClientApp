import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, Form } from '@angular/forms';
import { UserService } from 'src/app/services/user.service';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-info-edit',
  templateUrl: './info-edit.page.html',
  styleUrls: ['./info-edit.page.scss'],
})
export class InfoEditPage implements OnInit {
  public fragmentValues: FormGroup;
  public profileValues: FormGroup;
  public updatingFragment: boolean;
  public updatingProfile: boolean;

  private fragment: any;
  private profile: any;

  constructor(
    private userService: UserService,
    public modalController: ModalController,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.buildFragmentForm();
    this.buildProfileForm();

    this.userService.returnUser().subscribe(user => {
      if (user) {
        this.fragment = user.fragment;
        this.profile = user.profile;
        this.patchFragmentForm(this.fragment);
        this.patchProfileForm(this.profile);
      }
    });
  }

  private buildFragmentForm() {
    this.fragmentValues = this.fb.group(
      {
        firstname: [null, [Validators.required]],
        surname: [null, [Validators.required]],
        profession: [null, [Validators.required]],
        grade: [null, [Validators.required]],
        specialty: [null, [Validators.required]],
      }
    );
  }

  private buildProfileForm() {
    this.profileValues = this.fb.group(
      {
        primary_hospital: [null],
        primary_location: [null]
      }
    );
  }

  private patchFragmentForm(data) {
    this.fragmentValues.patchValue(data);
  }
  private patchProfileForm(data) {
    this.profileValues.patchValue(data);
  }

  update() {
    const fragDiff = this.checkFormChanged(this.fragmentValues.value, 'fragment');
    const profDiff = this.checkFormChanged(this.profileValues.value, 'profile');

    // update fragment if changed
    if (fragDiff.length > 0) {
      this.updatingFragment = true;
      fragDiff.forEach(key => {
        this.fragment[key] = this.fragmentValues.value[key];
        this.closeModal();
      });
      this.userService.updateUserFragment(this.fragment).subscribe(res => {
        if (res.ok) {
          this.updatingFragment = false;

          if (!this.updatingProfile) {
            this.closeModal();
          }
        }
      });
    }

    if (profDiff.length > 0) {
      this.updatingProfile = true;
      profDiff.forEach(key => {
        this.profile[key] = this.profileValues.value[key];
      });
      this.userService.updateUserProfile(this.profile).subscribe(res => {
        if (res.ok) {
          this.updatingProfile = false;

          if (!this.updatingFragment) {
            this.closeModal();
          }
        }
      });
    }

    if (!this.updatingProfile && !this.updatingFragment) {
      this.closeModal();
    }
  }

  checkFormChanged(formVal: any, type: string): string[] {
    const diff = [];
    for (const key of Object.keys(formVal)) {
      if (type === 'fragment') {
        if (this.fragment[key] && this.fragment[key] !== formVal[key]) {
          diff.push(key);
        }
      } else if (type === 'profile') {
        if (this.profile[key] && this.profile[key] !== formVal[key]) {
          diff.push(key);
        }
      }
    }

    return diff;
  }

  closeModal() {
    this.modalController.dismiss();
  }

}
