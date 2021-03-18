import Quill from 'quill';

const Embed = Quill.import('blots/embed');

export class ReferenceSuperBlot extends Embed {

    public static blotName = 'referenceSuper';
    public static tagName = 'sup';
    public static className = 'reference-super';

    static create(value) {
        const node = super.create();
        node.innerHTML = `[${value.integer}]`;
        node.setAttribute('id', value.id);
        node.dataset.datanum = String(value.integer);
        node.dataset.dataid = value.id;
        node.setAttribute('contenteditable', false);
        return node;
    }

    static formats(node) {
        const formats = {
            id: node.dataset.dataid
        };
        return formats;
    }

    static value(node) {
        return {
            integer: node.dataset.datanum,
            id: node.dataset.dataid,
        };
    }
}
