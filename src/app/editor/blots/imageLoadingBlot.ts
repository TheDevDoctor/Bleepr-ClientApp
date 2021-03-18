import Quill from 'quill';

const BlockEmbed = Quill.import('blots/block/embed');

export class ImageLoadingBlot extends BlockEmbed {

    public static blotName = 'image-loading';
    public static tagName = 'figure';
    public static className = 'editor-image';

    static create(value) {
        const node = super.create();
        node.setAttribute('contenteditable', false);
        node.classList.add('editor-image-node');
        node.dataset.data = value;
        node.dataset.width = 'normal';
        // node.style.fontSize = '0';

        const image = document.createElement('img');
        image.setAttribute('src', value);
        image.classList.add('editor-image-blur');
        node.appendChild(image);

        const loading = document.createElement('ion-progress-bar');
        loading.setAttribute('type', 'indeterminate');
        loading.setAttribute('color', 'secondary');
        node.appendChild(loading);

        return node;
    }

}
