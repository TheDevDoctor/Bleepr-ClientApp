import Quill from 'quill';

export interface Config {
    container: string;
    unit: 'word' | 'char';
    refs: any;
}

export interface QuillInstance {
    on: any;
    getText: any;
    setContents: any;
}

export default class Deletion {
    quill: any;
    options: Config;

    constructor(quill, options) {
        this.quill = quill;
        this.options = options;

        // const container = document.querySelector(this.options.container);

    }

    hasProp(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
    }
}
