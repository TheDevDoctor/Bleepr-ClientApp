import { Component, OnInit } from '@angular/core';
import { ExperienceEditPage } from 'src/app/modals/experience-edit/experience-edit.page';
import { EducationEditPage } from 'src/app/modals/education-edit/education-edit.page';
import { AccreditationEditPage } from 'src/app/modals/accreditation-edit/accreditation-edit.page';
import { PublicationEditPage } from 'src/app/modals/publication-edit/publication-edit.page';
import { AboutEditPage } from 'src/app/modals/about-edit/about-edit.page';
import { ModalController } from '@ionic/angular';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-profile-completion',
  templateUrl: './profile-completion.component.html',
  styleUrls: ['./profile-completion.component.scss'],
})
export class ProfileCompletionComponent implements OnInit {
  private profile: any;
  public completion = 0;

  sections = {
    about: { comp: AboutEditPage, completion: null },
    experience: { comp: ExperienceEditPage, completion: null },
    education: { comp: EducationEditPage, completion: null },
    accreditation: { comp: AccreditationEditPage, completion: null },
    publication: { comp: PublicationEditPage, completion: null }
  };

  sectionHeaders = Object.keys(this.sections);

  constructor(
    private modalController: ModalController,
    private userService: UserService
  ) { }

  ngOnInit() {
    this.userService.returnUser().subscribe(usr => {
      if (usr) {
        this.profile = usr.profile;
        this.calculateProfileCompletion();
      }
    });
  }

  calculateProfileCompletion() {
    this.completion = 0;
    this.sectionHeaders.forEach(section => {
      if (section === 'about') {
        if (this.profile.about) {
          this.sections.about.completion = true;
          this.completion += (1 / this.sectionHeaders.length);
        }
      } else {
        if (this.profile[section] && this.profile[section].length > 0) {
          this.sections[section].completion = this.profile[section].length;
          this.completion += (1 / this.sectionHeaders.length);
        }
      }
    });
    // round to the nearest 0.02 to allow for dividing error.
    this.completion = Math.round(this.completion * 50) / 50;
  }

  onSectionSelect(section: string) {
    this.presentEditModal(section);
  }

  async presentEditModal(section: string) {
    const modal = await this.modalController.create({
      component: this.sections[section].comp
    });
    return await modal.present();
  }


}
