import Quill from 'quill';

const BlockEmbed = Quill.import('blots/block/embed');

export class VideoBlot extends BlockEmbed {

    public static blotName = 'video';
    public static tagName = 'div';
    public static className = 'editor-video-cont';


    static create(value) {
        // Allow the parent create function to give us a DOM Node
        // The DOM Node will be based on the provided tagName and className.
        // E.G. the Node is currently <code class="editor-image">{initialValue}</code>
        const node = super.create();
        node.dataset.dataurl = value.url;

        const video = document.createElement('video');
        video.setAttribute('preload', 'auto');
        video.setAttribute('crossorigin', 'true');
        video.setAttribute('controls', 'true');
        video.setAttribute('width', '100%');

        const source = document.createElement('source');
        source.setAttribute('src', value.url);

        video.appendChild(source);
        node.appendChild(video);

        return node;
    }

    constructor(node) {
        super(node);
    }

    static value(node) {
        return {
            url: node.dataset.dataurl
        };
    }
}
