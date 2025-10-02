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
      const logger = sandbox.core.logger.getLoggerInstance();

        return class UIFeed extends HTMLElement {
          connectedCallback() {
            this.innerHTML =`<span></span>`;
            this.renderInitialState();
            setTimeout(() => {
              sandbox.my.Events.dispatchEvent(new SystemEvent(Events.FEED_COMPONENT_INITIALIZED, {}));
            }, 0);
          }
          
          /**
           * 
           * @param {Object[]} data - feed items pulled from the API 
           */
          onComponentUpdate(data) {
            try {
              this.innerHTML = `
                          <ion-list>
                              ${data.map(
                                  (item) => `
                                  <ion-item>
                                      <ion-card>
                                      <ion-thumbnail>
                                          <img alt="" src="${item.thumbnail.url}" style="margin-top: 15px; margin-left: 20px; box-shadow: 1px 1px 2px 1px #636469; border-radius: 3px;" />
                                      </ion-thumbnail>
                <ion-card-header>
                  <ion-card-title>${item.title}</ion-card-title>
                  <ion-card-subtitle>${item.source} | ${new Date(item.publicationDate).toLocaleString().split(",")[0]}</ion-card-subtitle>
                </ion-card-header>

                <ion-card-content>
                      ${this.truncate(item.description, 100)}
                </ion-card-content>
              </ion-card>
                                  </ion-item>
                                  `
                              )
                              .join('')}
                          </ion-list>
                          
                          `;
            } catch(ex) {
              logger.error(`INTERNAL_ERROR (UIFeed): Exception encountered while updating feed component. See details -> ${ex.message}`);
              sandbox.my.Events.dispatchEvent(new SystemEvent(Events.COMPONENT_UPDATE_FAILED, {
                component: this.nodeName,
                error: ex.message
              }));
              this.renderErrorState();
            }
          }

          renderErrorState() {
            this.innerHTML = `
              <ion-icon name="logo-ionic" size="large" color="primary"></ion-icon>
              <ion-text color="primary">
                <h4>Hmm. Looks like we're weren't able to load the feed. Try again later.</h4>
              </ion-text>
            `
          }

          renderInitialState() {
              this.innerHTML = `
              <ion-list>
                  ${Array(5).fill(0).map(() => `
                  <ion-item style="margin-bottom: 5px;">
                      <ion-thumbnail slot="start">
                      <ion-skeleton-text animated></ion-skeleton-text>
                      </ion-thumbnail>
                      <ion-label>
                      <h3>
                          <ion-skeleton-text animated style="width: 80%"></ion-skeleton-text>
                      </h3>
                      <p>
                          <ion-skeleton-text animated style="width: 60%"></ion-skeleton-text>
                      </p>
                      <p>
                          <ion-skeleton-text animated style="width: 30%"></ion-skeleton-text>
                      </p>
                      </ion-label>
                  </ion-item>
                  `).join('')}
              </ion-list>
              `;
          }

          truncate(input, length) { 
            if (input.length <= length) return input; 
            if (length < 3) return input.substring(0, length); 
            return input.substring(0, length - 3) + '...'; 
          } 
        }
    }
}


