import Quill from 'quill';

const BlockEmbed = Quill.import('blots/block/embed');

const ATTRIBUTES = ['width'];

export class ViewImageBlot extends BlockEmbed {

    public static blotName = 'image';
    public static tagName = 'figure';
    public static className = 'editor-image';

    private domNode;

    static create(value) {
        // Allow the parent create function to give us a DOM Node
        // The DOM Node will be based on the provided tagName and className.
        // E.G. the Node is currently <code class="editor-image">{initialValue}</code>
        const node = super.create();
        node.setAttribute('contenteditable', false);
        node.classList.add('editor-image-node');
        node.dataset.data = value.url;
        // node.style.fontSize = '0';

        const image = document.createElement('img');
        image.setAttribute('src', value.url);
        node.appendChild(image);

        // set base value to normal for size.
        node.style.width = '100%';
        image.style.width = '100%';
        node.style.left = '0';
        node.dataset.width = 'normal';

        const caption = document.createElement('figcaption');
        caption.dataset.placeholder = 'Add Caption (optional)';
        caption.classList.add('editor-image-caption');
        caption.innerHTML = value.caption;
        node.appendChild(caption);

        return node;
    }


    static value(node) {
        return {
            alt: node.getAttribute('alt'),
            url: node.dataset.data,
            caption: node.querySelector('figcaption').innerHTML
        };
    }

    static formats(node) {
        // We still need to report unregistered embed formats
        const format = { width: node.dataset.width };
        return format;
    }

    format(name, value) {
        if (ATTRIBUTES.indexOf(name) > -1) {
            if (value) {
                if (name === 'width') {
                    this.setImageWidth(value, this.domNode);
                } else {
                    this.domNode.setAttribute(name, value);
                }
            } else {
                this.domNode.removeAttribute(name);
            }
        } else {
            super.format(name, value);
        }
    }

    private setImageWidth(width, node) {
        const editorWidth = (document.getElementsByClassName('ql-editor')[0] as HTMLElement).offsetWidth;
        if (width === 'wide') {
            node.style.width = '100vw';
            node.style.left = `calc(-50vw + ${editorWidth / 2}px)`;
            node.dataset.width = 'wide';
        } else if (width === 'normal') {
            node.style.width = '100%';
            node.style.left = '0';
            node.dataset.width = 'normal';
        } else if (width === 'small') {
            node.style.width = 'unset';
            node.style.left = '0';
            node.dataset.width = 'small';
        }
    }

    constructor(node) {
        super(node);

        this.domNode = node;
    }
}
