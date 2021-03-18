import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { UserService } from 'src/app/services/user.service';
import { ModalController } from '@ionic/angular';
import { CrossrefService } from 'src/app/services/crossref.service';

@Component({
  selector: 'app-publication-edit',
  templateUrl: './publication-edit.page.html',
  styleUrls: ['./publication-edit.page.scss'],
})
export class PublicationEditPage implements OnInit {
  @Input() dataIndex: number | null;

  publicationForm: FormGroup;
  publicationArrayLength: number;
  updatingUser = false;

  private profile: any;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private modalController: ModalController,
    private crossrefService: CrossrefService) { }

  public get publicationFormAuthors() {
    return this.publicationForm.get('authors') as FormArray;
  }

  ngOnInit() {
    this.userService.returnUser().subscribe(user => {
      this.profile = user.profile;

      if (!this.publicationForm) {
        this.buildExperienceForm();
      }

      if (this.profile.publication.length === this.publicationArrayLength && this.updatingUser) {
        this.closeModal();
      }
    });
  }

  buildExperienceForm() {

    this.publicationForm = this.fb.group(
      {
        doi: [null, [Validators.required]],
        title: [null, [Validators.required]],
        publisher: [null, [Validators.required]],
        published_date: [null, [Validators.required]],
        authors: this.fb.array([this.createAuthor()]),
        url: [null],
        description: [null]
      }
    );

    if (this.dataIndex != null) {
      this.updatePublicationForm(this.profile.publication[this.dataIndex]);
    }
  }

  updatePublicationForm(data) {
    const authors = this.publicationForm.get('authors') as FormArray;
    while (authors.length) {
      authors.removeAt(0);
    }

    this.publicationForm.patchValue(data);
    data.authors.forEach(auth => authors.push(this.addAuthor(auth)));
  }

  createAuthor() {
    const author = this.fb.group({
      given: [null, [Validators.required]],
      family: [null, [Validators.required]]
    });
    return author;
  }

  addAuthor(auth) {
    const author = this.fb.group({
      given: [auth.given, [Validators.required]],
      family: [auth.family, [Validators.required]]
    });
    return author;
  }

  addNewAuthor() {
    const author = this.publicationForm.get('authors') as FormArray;
    author.push(this.createAuthor());
  }

  removeAuthor(i) {
    const author = this.publicationForm.get('authors') as FormArray;
    author.removeAt(i);
  }

  update() {
    if (this.dataIndex != null) {
      this.profile.publication[this.dataIndex] = this.publicationForm.value;
    } else {
      this.profile.publication.unshift(this.publicationForm.value);
    }
    this.userService.updateUserProfile(this.profile).subscribe();
    this.publicationArrayLength = this.profile.publication.length;
    this.updatingUser = true;
  }

  delete() {
    if (this.dataIndex != null && this.dataIndex > -1) {
      this.profile.publication.splice(this.dataIndex, 1);
    }
    this.userService.updateUserProfile(this.profile).subscribe();
    this.publicationArrayLength = this.profile.publication.length;
    this.updatingUser = true;
  }

  closeModal() {
    this.modalController.dismiss();
  }

  searchDOI() {
    const doi = this.publicationForm.controls.doi.value;
    this.crossrefService.getMetadataFromDoi(doi);
    const $meta = this.crossrefService.returnMetadata().subscribe(metadata => {
      // cannot use set value when setting arrays in form, must first clear form then patch the value:
      this.updatePublicationForm(metadata);
      $meta.unsubscribe();
    });
  }

}
