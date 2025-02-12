import { WorkLoader } from './workLoader.js';
import { WorkCard } from './workLoader.js';  // Make sure to import WorkCard too

export class GalleryOverlay {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.containerType = this.container.id.substring(this.container.id.length-6)
        // console.log(this.container.id.substring(this.container.id.length-6));
        this.isVisible = false;
        this.setupOverlay();
        // Create the workLoader with our works-container
        this.workLoader = new WorkLoader('gallery-overlay' +`${this.container.id.substring(this.container.id.length-6)}`);
        this.worksLoader = false;
    }

    setupOverlay() {
        // const overlay = document.createElement('div');
        // overlay.className = 'gallery-overlay';
        const overlay = document.querySelector('#gallery-overlay' + this.containerType);
        overlay.style.display = 'none';
        // const container = document.getElementById('gallery-container');
        this.container.style.display = 'none';
        
        // Create close button
        // const closeBtn = document.createElement('button');
        // closeBtn.className = 'gallery-close fontQuaternary';  // Using your font class
        // closeBtn.innerHTML = '×';
        // closeBtn.onclick = () => this.hide();


        
        // // Create container for WorkLoader
        // this.worksContainer = document.createElement('div');
        // this.worksContainer.id = 'works-container';
        // this.worksContainer.className = 'works-container';
        
        // overlay.appendChild(closeBtn);
        // overlay.appendChild(this.worksContainer);
        this.container.appendChild(overlay);
        this.overlay = overlay;


        // Add click listener to the container (the parent element)
        this.container.addEventListener('click', (event) => {
            if (this.isVisible && !this.overlay.contains(event.target)) {
                this.hide();
                if (this.onClose) {
                    this.onClose();
                }
            }
        });

        // Prevent clicks on the works container from triggering the close
        this.overlay.addEventListener('click', (event) => {
            event.stopPropagation();
        });
    }

    async show() {
        // First load the works if they haven't been loaded
        if (!this.worksLoader) {
            await this.workLoader.loadWorks();
        }
        // Show the container
        this.container.style.display = 'flex';
        this.container.classList.add('visible');


        // Then show overlay
        this.overlay.style.display = 'flex';
        this.isVisible = true;
        requestAnimationFrame(() => this.overlay.classList.add('visible'));

        this.worksLoader = true;
    }

    hide() {
        this.overlay.classList.remove('visible');
        this.container.classList.remove('visible');
        this.isVisible = false;
        setTimeout(() => {
            this.overlay.style.display = 'none';
            this.container.style.display = 'none';
        }, 300);
    }


    // Add method to set the close callback
    setCloseCallback(callback) {
        this.onClose = callback;
    }
}