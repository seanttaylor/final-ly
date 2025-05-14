/******** INTERFACES ********/

/* eslint-disable no-unused-vars */

import { ISandbox, IEvent } from '../../interfaces.js';

/* eslint-enable no-unused-vars */

import { SystemEvent, Events } from '../../types/system-event.js';

/**
 * The list of feed items in the web app's home feed view
 */
export const UIFeed = {
    /**
     * @param {ISandbox} sandbox
     * @returns {HTMLElement}
     */
    getComponent(sandbox) {
        return class UIFeed extends HTMLElement {
            connectedCallback() {
                this.innerHTML =`<span></span>`;
                sandbox.my.Events.dispatchEvent(new SystemEvent(Events.FEED_COMPONENT_INITIALIZED, {}));
                // MAYBE this.addEventListener(ui.components.feed.update_ready, this.onComponentUpdate.bind(this))
            }
        
            onComponentUpdate(data) {
                console.log('updating...', data);
            }
        }
    }
}


