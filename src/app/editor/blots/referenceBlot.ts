import Quill from 'quill';

const Inline = Quill.import('blots/inline');

export class ReferenceBlot extends Inline {

    public static blotName = 'reference';
    public static tagName = 'a';
    public static className = 'reference';

    static create(value) {
        const node = super.create();
        // Sanitize url value if desired
        node.setAttribute('href', value.reference.title);
        node.setAttribute('id', value.id);
        node.dataset.dataid = value.id;
        node.dataset.doi = value.reference.doi;
        node.dataset.index = value.index;
        node.dataset.indexstr = `[${value.index}]`;
        // Okay to set other non-format related attributes
        // These are invisible to Parchment so must be static
        node.setAttribute('target', '_blank');
        return node;
    }

    static formats(node) {
        const formats = {
            reference: {
                title: node.getAttribute('href'),
                doi: node.dataset.doi,
            },
            index: node.dataset.index,
            id: node.dataset.dataid
        };
        return formats;
    }

    // static value(node) {
    //     return node.dataset.datanum;
    // }
}
