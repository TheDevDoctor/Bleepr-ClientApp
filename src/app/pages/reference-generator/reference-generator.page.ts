import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-reference-generator',
  templateUrl: './reference-generator.page.html',
  styleUrls: ['./reference-generator.page.scss'],
})
export class ReferenceGeneratorPage implements OnInit {
  public referenceForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private modalController: ModalController
    ) { }

  ngOnInit() {
    this.referenceForm = this.fb.group(
      {
        authors: this.fb.array([ this.createAuthor() ]),
        title: [null, [Validators.required]],
        yearPublished: [null, [Validators.required]],
        journal: [null, [Validators.required]],
        volume: [null, [Validators.required]],
        issue: [null, [Validators.required]],
        pages: [null, [Validators.required]],
        doi: [null, [Validators.required]]
      }
    );
  }

  /**
   * Getter for referenceForm Authors property to resolve AoT build errors
   * @see https://github.com/angular/angular-cli/issues/6099
   */
  public get referenceFormAuthors() {
    return this.referenceForm.get('authors') as FormArray;
  }

  public createAuthor() {
    return this.fb.group({
      firstname: [null, [Validators.required]],
      surname: [null, [Validators.required]]
    });
  }

  public addNewAuthor() {
    const authors = this.referenceForm.get('authors') as FormArray;
    authors.push(this.createAuthor());
  }

  public addReference() {
    this.modalController.dismiss(this.referenceForm.value);
  }

}
