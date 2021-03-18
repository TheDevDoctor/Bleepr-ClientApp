import Quill from 'quill';

const BlockEmbed = Quill.import('blots/block/embed');

export class YoutubeVideoBlot extends BlockEmbed {

    public static blotName = 'youtubeVideo';
    public static tagName = 'div';
    public static className = 'youtube-video-container';


    static create(value) {
        // Allow the parent create function to give us a DOM Node
        // The DOM Node will be based on the provided tagName and className.
        // E.G. the Node is currently <code class="editor-image">{initialValue}</code>
        const node = super.create();
        node.dataset.dataurl = value.url;

        const iframe = document.createElement('iframe');

        iframe.setAttribute('src', value.url);
        iframe.setAttribute('allow', value.url);
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allow', 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture');
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.setAttribute('width', '560');
        iframe.setAttribute('height', '315');

        node.appendChild(iframe);


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
