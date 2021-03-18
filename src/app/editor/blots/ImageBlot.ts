import Quill from 'quill';

const BlockEmbed = Quill.import('blots/block/embed');

const ATTRIBUTES = ['width'];

export class ImageBlot extends BlockEmbed {

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
        node.classList.add('edit');
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
        if (!value.caption) {
            caption.classList.add('empty');
        }

        const textarea = document.createElement('textarea');
        textarea.classList.add('image-caption-text-area');
        textarea.setAttribute('rows', '1');
        textarea.setAttribute('tabindex', '-1');
        textarea.setAttribute('placeholder', 'Add Caption (optional)');
        textarea.style.overflow = 'hidden';
        textarea.style.height = '18px';
        textarea.innerHTML = value.caption;

        caption.appendChild(textarea);

        const buttonCont = document.createElement('ul');
        buttonCont.classList.add('image-button-cont');

        const buttons = ['small', 'normal', 'wide'];
        buttons.forEach(btn => {
            const liItem = document.createElement('li');
            liItem.classList.add('image-button-list');

            const button = document.createElement('button');
            button.innerHTML = btn;
            button.id = btn;
            button.classList.add('image-btn-' + btn);

            button.addEventListener('click', (ev) => {
                const buttonType = (ev.target as HTMLButtonElement).id;
                const editorWidth = (document.getElementsByClassName('ql-editor')[0] as HTMLElement).offsetWidth;

                if (buttonType === 'wide') {
                    node.style.width = '100vw';
                    image.style.width = '100vw';
                    node.style.left = `calc(-50vw + ${(editorWidth / 2) - 2}px)`;
                    node.dataset.width = 'wide';
                } else if (buttonType === 'normal') {
                    node.style.width = '100%';
                    image.style.width = '100%';
                    node.style.left = '0';
                    node.dataset.width = 'normal';
                } else if (buttonType === 'small') {
                    node.style.width = 'unset';
                    image.style.width = 'unset';
                    node.style.left = '0';
                    node.dataset.width = 'small';
                }
            });

            liItem.appendChild(button);

            buttonCont.appendChild(liItem);
        });

        node.appendChild(buttonCont);
        node.appendChild(caption);

        return node;
    }


    static value(node) {
        return {
            alt: node.getAttribute('alt'),
            url: node.dataset.data,
            caption: node.querySelector('textarea').value
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
            node.style.left = `calc(-50vw + ${(editorWidth / 2) - 2}px)`;
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
        const caption = node.querySelector('figcaption');
        const input = node.querySelector('textarea');
        caption.addEventListener('click', (ev) => {
            input.focus();
        });

        input.addEventListener('input', (ev) => {
            const text = (ev.target as HTMLTextAreaElement).value;
            if (text.length > 0) {
                caption.classList.remove('empty');
            } else {
                caption.classList.add('empty');
            }
        });

        this.domNode = node;
    }
}
