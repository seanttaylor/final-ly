/**
 * The list of feed items in the web app's home view
 */
export class UIFeed extends HTMLElement {
    connectedCallback() {
        this.innerHTML =`<span>The quick brown fox jumps over the lazy dog.</span>`;
        // MAYBE this.addEventListener(ui.components.feed.update_ready, this.onComponentUpdate.bind(this))
    }

    onComponentUpdate(data) {
        console.log('updating...', data);
    }
}