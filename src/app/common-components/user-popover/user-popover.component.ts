import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { PopoverController, ModalController } from '@ionic/angular';
import { ArticlesModalPage } from 'src/app/modals/articles-modal/articles-modal.page';
import { environment } from 'src/environments/environment';
import { SasGeneratorService } from 'src/app/services/blob_storage/sas-generator.service';
import { AuthService } from 'src/app/services/auth.service';
import { SettingsPage } from 'src/app/modals/settings/settings.page';

@Component({
  selector: 'app-user-popover',
  templateUrl: './user-popover.component.html',
  styleUrls: ['./user-popover.component.scss'],
})
export class UserPopoverComponent implements OnInit {
  public fragment: any;
  public position: string;
  public hospital: string;
  private baseUri: string;
  private sasToken: string;
  public profilePic = 'assets/blank_user.svg';

  constructor(
    private userService: UserService,
    public popoverController: PopoverController,
    public modalController: ModalController,
    private sasGenerator: SasGeneratorService,
    private authService: AuthService,
  ) { }

  ngOnInit() {
    this.sasGenerator.getSasToken().subscribe(req => {
      this.sasToken = req.storageAccessToken;
    });

    this.userService.returnUser().subscribe(user => {
      this.fragment = user.fragment;
      if (user.profilePic) {
        this.profilePic = user.profilePic + '?' + this.sasToken;
      }
      // this.fragment = this.fragment.firstname + ' ' + this.fragment.surname;
      if (this.fragment.specialty && this.fragment.grade) {
        this.position = this.fragment.specialty + ' ' + this.fragment.grade;
      } else {
        this.position = this.fragment.profession;
      }

      if (user.profile.primary_hospital && user.profile.primary_location) {
        this.hospital = user.profile.primary_hospital + ', ' + user.profile.primary_location;
      }
    });
    this.baseUri = environment.blobStorage.storageUri;
  }

  dismissPopover() {
    this.popoverController.dismiss();
  }

  async presentArticlesModal(tab) {
    const modal = await this.modalController.create({
      component: ArticlesModalPage,
      componentProps: {
        currentTab: tab
      }
    });

    this.dismissPopover();
    return await modal.present();
  }

  logout() {
    this.authService.logout();
    this.dismissPopover();
  }

  openSettings() {
    this.presentSettingsModal();
  }

  async presentSettingsModal() {
    const modal = await this.modalController.create({
      component: SettingsPage
    });

    this.dismissPopover();
    return await modal.present();
  }

}
