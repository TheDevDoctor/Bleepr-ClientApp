import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { UserService } from 'src/app/services/user.service';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
  settings;

  canDeleteAccount = false;

  settingsForm: FormGroup;
  user: any;
  formEqual: boolean;

  privacyText = {
    public: `In public mode anybody can view your profile. We recommend this setting as it allows for more effective networking.
    Your bleeps privacy is set for each bleep so you can still post private bleeps while your account is public.`,
    private: `In private mode only your connections can see your full profile. In private mode users that are not your connections
    can see your name, profession, grade and specialty`,
    hidden: `If your profile is hidden only your connections can see you. You will not appear in searches or as peoples suggested
    contacts. You cannot request connections in this mode.`,
  };

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private modalController: ModalController) { }

  ngOnInit() {
    this.userService.returnUser().subscribe(user => {
      this.user = user;
      this.settings = this.user.account.settings;
      this.buildSettingsForm();
    });
  }

  buildSettingsForm() {
    this.settingsForm = this.fb.group(
      {
        privacy: ['public', [Validators.required]]
      }
    );

    if (this.settings) {
      this.settingsForm.patchValue(this.settings);
    }

    this.settingsForm.valueChanges.subscribe(form => this.checkForEquality(form));

    // this.settingsForm.controls.privacy.valueChanges.subscribe(privacy => this.privacyChanged(privacy));
  }

  dismissModal() {
    this.modalController.dismiss();
  }

  onDeleteAccount() {
    this.canDeleteAccount = !this.canDeleteAccount;
  }

  onConfirmDeleteAccount() {
    this.userService.deleteUserAccount();
  }

  updateUserSettings() {
    const formValue = this.settingsForm.value;
    if (this.checkForEquality(formValue)) {
      this.dismissModal();
      return;
    } else {
      // TODO: create trigger to update user settings if privacy changed. Could actually do it with trigger to update privacy.
      // don't have to call trigger if privacy is the same.
      this.user.account.settings = formValue;
      this.userService.updateUserAccount(this.user.account);
    }

    this.dismissModal();
  }

  checkForEquality(form) {
    return JSON.stringify(form) === JSON.stringify(this.settings);
  }

}
