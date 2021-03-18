import { Component, OnInit, Input } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { ModalController } from '@ionic/angular';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-about-edit',
  templateUrl: './about-edit.page.html',
  styleUrls: ['./about-edit.page.scss'],
})
export class AboutEditPage implements OnInit {
  public aboutText: string;
  private profile: any;
  public updatingUser = false;

  public infoForm: FormGroup;

  constructor(
    private userService: UserService,
    public modalController: ModalController,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.buildInfoForm();

    this.userService.returnUser().subscribe(user => {
      this.profile = user.profile;

      const aboutItems = {
        about: this.profile.about
      };
      this.patchForm(aboutItems);
    });
  }

  private buildInfoForm() {
    this.infoForm = this.fb.group(
      {
        about: [null]
      }
    );
  }

  private patchForm(data) {
    this.infoForm.patchValue(data);
  }

  update() {
    const formValue = this.infoForm.value;

    this.profile.about = formValue.about;

    this.updatingUser = true;

    this.userService.updateUserProfile(this.profile).subscribe(res => {
      if (res.ok) {
        this.updatingUser = false;
        this.modalController.dismiss();
      }
    });
  }

  closeModal() {
    this.modalController.dismiss();
  }
}
