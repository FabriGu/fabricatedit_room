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

        this.room = null;
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
        // Modify the container click listener to show spheres
        this.container.addEventListener('click', (event) => {
            if (this.isVisible && !this.overlay.contains(event.target)) {
                this.hide();
                // Show all spheres when clicking outside overlay
                console.log(window.globalRoom)
                console.log(this.room)
                if (window.globalRoom) {
                    window.globalRoom.interactiveObjects.forEach(obj => {
                        console.log(obj)
                        obj.visible = true;
                        if (obj.userData.billboardText) {
                            obj.userData.billboardText.visible = true;
                        }
                    });
                }
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

    // Add method to set room reference
    setRoom(room) {
        if (!room) {
            console.error('Attempted to set null/undefined room');
            return;
        }
        console.log('Setting room:', room);
        this.room = room;
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
        
        // Show all spheres when gallery is hidden
        if (window.globalRoom) {
            window.globalRoom.interactiveObjects.forEach(obj => {
                obj.visible = true;
                if (obj.userData.billboardText) {
                    obj.userData.billboardText.visible = true;
                }
            });
        }
    
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