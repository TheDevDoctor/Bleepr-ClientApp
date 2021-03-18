import Quill from 'quill';

const BlockEmbed = Quill.import('blots/block/embed');

export class DividerBlot extends BlockEmbed {

    public static blotName = 'divider';
    public static tagName = 'hr';


    static create(value) {
        const node = super.create();
        node.setAttribute('contenteditable', false);
        return node;
    }

}
