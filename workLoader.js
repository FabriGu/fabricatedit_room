export class WorkCard {
    constructor(mediaUrl, data) {
        console.log("WorkCard constructor:", { mediaUrl, data }); // Add this line

        this.mediaUrl = mediaUrl;
        this.data = data;
        this.priority = data.priority;
        this.mediaType = this.getMediaType(mediaUrl);
    }

    getMediaType(url) {
        const extension = url.split('.').pop().toLowerCase();
        const videoExtensions = ['mp4', 'webm', 'ogg'];
        return videoExtensions.includes(extension) ? 'video' : 'image';
    }

    createCard() {
        console.log("Creating card:", { 
            type: this.data.type,
            mediaItems: this.data.mediaItems,
            data: this.data 
        });
        console.log("Creating card with type:", this.data.type); // Debug log
        if (this.data.type === 'row') {
            return this.createRowCard();
        }

        const card = document.createElement('div');
        card.className = 'work-card';

        // Create media container
        const mediaContainer = document.createElement('div');
        mediaContainer.className = 'work-card-image';

        // Create media element based on type
        const mediaElement = this.mediaType === 'video' 
            ? this.createVideoElement() 
            : this.createImageElement();

        // add these to the mediaelements if they are a video 
        // muted loop class="vids"
        if (this.mediaType === 'video') {

            // make controls not show up
            mediaElement.controls = false;
            mediaElement.muted = true;
            mediaElement.loop = true;
            mediaElement.className = 'vids';
        }

        // wrap text in a parent div and make it flex 
        const textContainer = document.createElement('div');
        textContainer.className = 'text-container';

        // make title text 
        const title = document.createElement('div');
        title.className = 'title fontQuaternary';
        title.textContent = this.data.title;
        title.style.display = 'none';



        // add text to pop up infornt of the img/video
        const text = document.createElement('div');
        text.className = 'text fontQuinary';
        // text.textContent = this.data.title;
        text.textContent = this.data.description;
        // make content initially hidden
        text.style.display = 'none';
        if (this.data.textCol === 'black') {
            text.style.color = '#333';
            title.style.color = '#333';
            textContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        } else if (this.data.textCol === 'white') {
            text.style.color = '#fff';
            title.style.color = '#fff';
            textContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';

        }
        textContainer.appendChild(title);
        textContainer.appendChild(text);

        const video = mediaContainer.querySelector('video');

        mediaContainer.addEventListener('mouseleave', function() {
            // textContainer.style.display = textContainer.style.display = 'none';
            title.style.display = 'none';
            text.style.display =  'none';
        });

        mediaContainer.appendChild(textContainer);

        // make it so text appears when the element is clicked on and dissapears when clicked again
        mediaContainer.addEventListener('click', function() {
            // textContainer.style.display = textContainer.style.display === 'none' ? 'flex' : 'none';
            title.style.display = title.style.display === 'none' ? 'block' : 'none';
            text.style.display = text.style.display === 'none' ? 'block' : 'none';

            // make it so the media becomes slightly opaque in the contrasting color as the text 
            // more like an opaque screen appears over the media 
            if (text.style.display === 'block') {
                // mediaElement.style.opacity = 0.5;
                if (text.style.color === '#fff') {
                    // creatan element that sits exactly over the media element and change the background of that element since changing the background of media element does not work
                    const opaque = document.createElement('div');
                    opaque.style.backgroundColor = '#333';
                    opaque.style.width = '80%';
                    opaque.style.height = '80%';
                    opaque.style.position = 'absolute';
                    opaque.style.top = '0';
                    opaque.style.left = '0';
                    opaque.style.zIndex = '10';
                    mediaElement.appendChild(opaque);


                    mediaElement.style.backgroundColor = '#fff';
                } else if (text.style.color === '#fff') {
                    mediaElement.style.backgroundColor = '#333';
                }
      
            } else {
                mediaElement.style.opacity = 1;
                mediaElement.style.backgroundColor = 'transparent';
            }

        });

        mediaContainer.appendChild(mediaElement);
        
        // // Create content container
        // const content = document.createElement('div');
        // content.className = 'work-card-content col-sm-8';
        
        // // Add title
        // const title = document.createElement('h4');
        // title.textContent = this.data.title;
        // title.className = 'fontTertiary';
        
        // // Add description
        // const description = document.createElement('p');
        // description.textContent = this.data.description;
        // description.className = 'fontQuaternary';

        // content.appendChild(title);
        
        // // Add tags if they exist
        // if (this.data.tags && this.data.tags.length > 0) {
        //     const tags = document.createElement('div');
        //     tags.className = 'work-card-tags';
        //     this.data.tags.forEach(tag => {
        //         const tagEl = document.createElement('span');
        //         tagEl.className = 'tag fontQuinary';
        //         tagEl.textContent = tag;
        //         tags.appendChild(tagEl);
        //     });
        //     content.appendChild(tags);
        // }
        
        // // Assemble card
        // content.appendChild(description);
        card.appendChild(mediaContainer);
        // card.appendChild(content);
        
        return card;
    }

    createRowCard() {
        const card = document.createElement('div');
        card.className = 'work-card row-type';
        
        const carouselWrapper = document.createElement('div');
        carouselWrapper.className = 'carousel-wrapper';
        
        const carouselTrack = document.createElement('div');
        carouselTrack.className = 'carousel-track';

        // Add scroll behavior
        carouselWrapper.style.overflowX = 'scroll';
        carouselWrapper.style.scrollSnapType = 'x mandatory';
        carouselWrapper.style.msOverflowStyle = 'none';  // Hide scrollbar for IE
        carouselWrapper.style.scrollbarWidth = 'none';   // Hide scrollbar for Firefox

        // Hide scrollbar for Chrome/Safari/Opera
        carouselWrapper.style.overflow = 'auto';
        carouselWrapper.style.webkitOverflowScrolling = 'touch';
        
        // ---- old code
        // if (this.data.mediaItems && Array.isArray(this.data.mediaItems)) {
        //     this.data.mediaItems.forEach((mediaItem) => {
        //         const item = document.createElement('div');
        //         item.className = 'carousel-item';
        //         // item.style.scrollSnapAlign = 'center';
                
        //         // Create media element with the correct URL
        //         if (mediaItem.type === 'video') {
        //             const video = this.createVideoElement();
        //             video.src = mediaItem.url; // Set the correct URL
        //             item.appendChild(video);
        //         } else {
        //             const img = this.createImageElement();
        //             img.src = mediaItem.url; // Set the correct URL
        //             item.appendChild(img);
        //         }
                
        //         carouselTrack.appendChild(item);
        //     });
            
        //     // // Clone items for infinite scroll
        //     // const items = Array.from(carouselTrack.children);
        //     // items.forEach(item => {
        //     //     const clone = item.cloneNode(true);
        //     //     // Make sure event listeners are copied for videos in clones
        //     //     if (clone.querySelector('video')) {
        //     //         const originalVideo = item.querySelector('video');
        //     //         const clonedVideo = clone.querySelector('video');
        //     //         clonedVideo.addEventListener('mouseover', () => clonedVideo.play());
        //     //         clonedVideo.addEventListener('mouseout', () => clonedVideo.pause());
        //     //     }
        //     //     clone.classList.add('clone');
        //     //     carouselTrack.appendChild(clone);
        //     // });
        // }
        //----- old code
        if (this.data.mediaItems && Array.isArray(this.data.mediaItems)) {
            this.data.mediaItems.forEach((mediaItem) => {
                const item = document.createElement('div');
                item.className = 'carousel-item';
                
                // new code
                // Modify the video creation part in createRowCard
                if (mediaItem.type === 'video') {
                    const video = document.createElement('video');
                    video.preload = "metadata";  // Start with just metadata
                    video.controls = false;
                    video.muted = true;
                    video.loop = true;
                    video.className = 'vids';
                    video.alt = this.data.title;
                
                    const videoUrl = mediaItem.url;
                    let hasGeneratedPoster = false;
                
                    // Generate poster first
                    video.addEventListener('loadedmetadata', function() {
                        if (!hasGeneratedPoster) {
                            console.log('Carousel: Loading metadata for poster');
                            this.currentTime = 0.1;
                        }
                    });
                
                    video.addEventListener('seeked', function() {
                        if (!hasGeneratedPoster) {
                            console.log('Carousel: Generating poster');
                            const canvas = document.createElement('canvas');
                            canvas.width = video.videoWidth;
                            canvas.height = video.videoHeight;
                            const ctx = canvas.getContext('2d');
                            ctx.imageSmoothingEnabled = true;
                            ctx.imageSmoothingQuality = 'high';
                            ctx.drawImage(video, 0, 0);
                            this.poster = canvas.toDataURL('image/jpeg', 1.0);
                            
                            // Clear the video data after poster is made
                            this.removeAttribute('src');
                            this.load();
                            canvas.remove();
                            hasGeneratedPoster = true;
                        }
                    });
                
                    // Initial load for poster generation
                    console.log('Carousel: Setting initial src for poster generation');
                    video.src = videoUrl + "#t=0.1";
                
                    // Lazy load actual video on hover
                    video.addEventListener('mouseover', function() {
                        console.log('Carousel: Mouse over, current src:', this.src);
                        if (!this.src) {
                            console.log('Carousel: Loading video on hover');
                            this.src = videoUrl;
                            this.load();
                        }
                        const playPromise = this.play();
                        if (playPromise !== undefined) {
                            playPromise.catch(error => {
                                console.log("Carousel: Play failed:", error);
                            });
                        }
                    });
                
                    video.addEventListener('mouseout', function() {
                        this.pause();
                    });
                    
                    item.appendChild(video);
                // new code

                // old code 030225 5:59pm
                // Create media element with the correct URL
                // if (mediaItem.type === 'video') {
                //     const video = document.createElement('video');
                //     video.preload = "metadata";
                //     video.src = mediaItem.url;  // Use the specific URL for this item
                //     video.controls = false;
                //     video.muted = true;
                //     video.loop = true;
                //     video.className = 'vids';
                //     video.alt = this.data.title;

                //     const videoUrl = mediaItem.url;  // Store specific URL

                //     if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
                //         video.requestVideoFrameCallback(() => {
                //             const canvas = document.createElement('canvas');
                //             canvas.width = video.videoWidth;
                //             canvas.height = video.videoHeight;
                //             canvas.getContext('2d').drawImage(video, 0, 0);
                //             video.poster = canvas.toDataURL();
                //             video.removeAttribute('src');
                //             canvas.remove();
                //         });
                //     }

                //     video.addEventListener('mouseover', function() {
                //         if (!this.src) {
                //             this.src = videoUrl;  // Use stored specific URL
                //             this.load();
                //         }
                //         const playPromise = this.play();
                //         if (playPromise !== undefined) {
                //             playPromise.catch(error => {
                //                 console.log("Play failed:", error);
                //             });
                //         }
                //     });

                //     video.addEventListener('mouseout', function() {
                //         this.pause();
                //     });
                    
                //     item.appendChild(video);
                // } else {
                //     const img = this.createImageElement();
                //     img.src = mediaItem.url;
                //     item.appendChild(img);
                } else {
                    // Handle images
                    const img = document.createElement('img');
                    img.src = mediaItem.url;
                    img.alt = this.data.title;
                    img.className = 'vids'; // Use same class for consistent sizing
                    item.appendChild(img);
                }
                
                carouselTrack.appendChild(item);
                // old code 030225 5:59
            });
        }
        
     // old code 0302025 7:13
       //Replace the auto-scroll part in createRowCard() with this:
       // In createRowCard(), replace the text container section with:

const textContainer = document.createElement('div');
textContainer.className = 'text-container';

const title = document.createElement('div');
title.className = 'title fontQuaternary';
title.textContent = this.data.title;
title.style.display = 'none';

const text = document.createElement('div');
text.className = 'text fontQuinary';
text.textContent = this.data.description;
text.style.display = 'none';

if (this.data.textCol === 'black') {
    text.style.color = '#333';
    title.style.color = '#333';
    textContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
} else if (this.data.textCol === 'white') {
    text.style.color = '#fff';
    title.style.color = '#fff';
    textContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
}

textContainer.appendChild(title);
textContainer.appendChild(text);
    // old code 0302025 7:13

        // Auto scroll functionality
        // let scrollPos = 0;
        // let autoScrollInterval;
        
        // const startAutoScroll = () => {
        //     autoScrollInterval = setInterval(() => {
        //         scrollPos -= 1;
        //         if (-scrollPos >= carouselTrack.scrollWidth / 2) {
        //             scrollPos = 0;
        //         }
        //         carouselTrack.style.transform = `translateX(${scrollPos}px)`;
        //     }, 30);
        // };
        // Replace just the autoscroll section in createRowCard():

        let scrollPosition = 0;
let direction = -1;  // -1 for left, 1 for right
let autoScrollInterval;

const startAutoScroll = () => {
    autoScrollInterval = setInterval(() => {
        const maxScroll = carouselTrack.scrollWidth - carouselWrapper.offsetWidth;
        
        scrollPosition += direction;

        // Change direction at either end
        if (scrollPosition <= 0 || scrollPosition >= maxScroll) {
            direction *= -1;  // Flip direction
        }

        carouselTrack.style.transform = `translateX(-${scrollPosition}px)`;
    }, 30);
};

// Mouse events for scroll
carouselWrapper.addEventListener('mouseenter', () => {
    clearInterval(autoScrollInterval);
});

carouselWrapper.addEventListener('mouseleave', () => {
    startAutoScroll();
});

// Simple text display
card.addEventListener('click', function() {
    title.style.display = title.style.display === 'none' ? 'block' : 'none';
    text.style.display = text.style.display === 'none' ? 'block' : 'none';

    // Add opaque background if text is showing
    if (text.style.display === 'block') {
        if (text.style.color === '#fff') {
            const opaque = document.createElement('div');
            opaque.style.backgroundColor = '#333';
            opaque.style.width = '100%';
            opaque.style.height = '100%';
            opaque.style.position = 'absolute';
            opaque.style.top = '0';
            opaque.style.left = '0';
            opaque.style.zIndex = '10';
            carouselWrapper.appendChild(opaque);
        }
    }
});

// create div the sits over the card element and is the exact size of the card element
// make it transparent


// Only hide text when mouse leaves the entire card
card.addEventListener('mouseleave', function() {
    title.style.display = 'none';
    text.style.display = 'none';
    // Remove any opaque overlays
    const opaque = carouselWrapper.querySelector('div[style*="position: absolute"]');
    if (opaque) opaque.remove();
});
        
        carouselWrapper.appendChild(carouselTrack);
        card.appendChild(textContainer);
        card.appendChild(carouselWrapper);
        
        // Start auto-scroll
        startAutoScroll();
        
      
        
        return card;
    }

    createCarouselItem(mediaItem) {
        const item = document.createElement('div');
        item.className = 'carousel-item';
        
        const mediaElement = mediaItem.type === 'video' 
            ? this.createVideoElement(mediaItem.url)
            : this.createImageElement(mediaItem.url);
        
        item.appendChild(mediaElement);
        return item;
    }

    // latest
    // createVideoElement() {
    //     const video = document.createElement('video');
    //     video.preload = "metadata";
    //     video.src = this.mediaUrl;  // Set initial source
    //     video.controls = false;
    //     video.muted = true;
    //     video.loop = true;
    //     video.className = 'vids';
    //     video.alt = this.data.title;
    //     // video.preload = "metadata";
    
    //     // Store the URL for later use
    //     const videoUrl = this.mediaUrl;
    
    //     if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
    //         video.requestVideoFrameCallback(() => {
    //             const canvas = document.createElement('canvas');
    //             canvas.width = video.videoWidth;
    //             canvas.height = video.videoHeight;
    //             canvas.getContext('2d').drawImage(video, 0, 0);
    //             video.poster = canvas.toDataURL();
    //             video.removeAttribute('src');  // Remove source after poster creation
    //             canvas.remove();
    //         });
    //     }
    
    //     video.addEventListener('mouseover', function() {
    //         if (!this.src) {
    //             this.src = videoUrl + "#t=0.5";  // Use stored URL
    //             // Make sure video is loaded before trying to play
    //             // this.load();
    //         }
    //         const playPromise = this.play();
    //         if (playPromise !== undefined) {
    //             playPromise.catch(error => {
    //                 console.log("Play failed:", error);
    //             });
    //         }
    //     });
    
    //     video.addEventListener('mouseout', function() {
    //         this.pause();
    //     });
    
    //     return video;
    // }
    // latest

    // newest
    createVideoElement() {
        const video = document.createElement('video');
        video.preload = "metadata";
        video.controls = false;
        video.muted = true;
        video.loop = true;
        video.className = 'vids';
        video.alt = this.data.title;
    
        const videoUrl = this.mediaUrl;
        let hasGeneratedPoster = false;
    
        // Create poster as soon as we have enough metadata
        video.addEventListener('loadedmetadata', function() {
            if (!hasGeneratedPoster) {
                this.currentTime = 0.1;
            }
        });
    
        video.addEventListener('seeked', function() {
            if (!hasGeneratedPoster) {
                // Once we've seeked to the first frame, capture it
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(video, 0, 0);
                this.poster = canvas.toDataURL('image/jpeg', 1.0); // Use maximum quality
                
                // Remove the video source after creating poster
                this.removeAttribute('src');
                this.load(); // Clear the video buffer
                canvas.remove();
                hasGeneratedPoster = true;
            }
        });
    
        // Set initial source to trigger metadata load and poster generation
        video.src = videoUrl + "#t=0.1";
    
        // Hover handling
        video.addEventListener('mouseover', function() {
            if (!this.src) {
                this.src = videoUrl;
                this.load();
            }
            const playPromise = this.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Play failed:", error);
                });
            }
        });
    
        video.addEventListener('mouseout', function() {
            this.pause();
        });
    
        return video;
    }
    // newest 

    // createVideoElement() {
    //     const video = document.createElement('video');
    //     video.src = this.mediaUrl;
    //     video.controls = false;
    //     video.muted = true;
    //     video.loop = true;
    //     video.className = 'vids';
    //     video.alt = this.data.title;
     

    //     // make it so video starts playing when hovered over and stops when no longer hovered over
    //     video.addEventListener('mouseover', function() {
    //         video.play();
            
    //     });
    //     video.addEventListener('mouseout', function() {
    //         video.pause();
            
    //     });

    //     return video;
    // }



    createImageElement() {
        const img = document.createElement('img');
        img.src = this.mediaUrl;
        img.alt = this.data.title;
        return img;
    }


}

export class WorkLoader {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.works = [];
        this.pendingCarouselItems = new Map(); // Store items to load later
        this.containerType = this.container.id.substring(this.container.id.length-5);
        console.log(this.containerType);
    }

    async loadWorks() {
       // create title 
       if (this.containerType === 'works') {
        const title = document.createElement("h3");
        title.textContent = "Work";
        title.classList.add("fontSecondary");
        console.log('Creating title');
        this.container.appendChild(title);
        
       }
       // loading work data
       console.log('Loading works data');


       try {
           const response = await fetch(`../${this.containerType}/index.json`);
           const worksIndex = await response.json();
           
           // Load works data first
           for (const work of worksIndex.works) {
               const dataResponse = await fetch(`../${this.containerType}/data/${work.dataFile}`);
               const workData = await dataResponse.json();
               
               if (Array.isArray(work.imageFile)) {
                   // For carousel items, only prepare first 3 items initially
                   const initialItems = work.imageFile.slice(0, 3);
                   const remainingItems = work.imageFile.slice(3);
                   
                   workData.mediaItems = initialItems.map(file => ({
                       url: `../${this.containerType}/images/${file}`,
                       type: this.getMediaType(file)
                   }));
                   
                   // Store remaining items for later loading
                   if (remainingItems.length > 0) {
                       this.pendingCarouselItems.set(workData.title, {
                           items: remainingItems,
                           workData: workData
                       });
                   }
                   
                   const mediaUrl = `../${this.containerType}/images/${work.imageFile[0]}`;
                   const workCard = new WorkCard(mediaUrl, workData);
                   this.works.push(workCard);
               } else {
                   const mediaUrl = `../${this.containerType}/images/${work.imageFile}`;
                   const workCard = new WorkCard(mediaUrl, workData);
                   this.works.push(workCard);
               }
           }
           
           this.works.sort((a, b) => b.priority - a.priority);
           this.renderWorks();
           
           // Start loading remaining carousel items after initial render
           this.loadRemainingCarouselItems();
       } catch (error) {
           console.error('Error loading works:', error);
       }
        
        
    }

    async loadRemainingCarouselItems() {
        for (const [title, { items, workData }] of this.pendingCarouselItems) {
            // Load items progressively with a small delay
            for (const file of items) {
                await new Promise(resolve => setTimeout(resolve, 200)); // Small delay between items

                let newItem = {
                    url: `../${this.containerType}/images/${file}`,
                    type: this.getMediaType(file)
                };
                
                // Find the carousel track for this work
                const carousel = document.querySelector(`[data-title="${title}"] .carousel-track`);
                if (carousel) {
                    // Create and append the new item
                    const item = document.createElement('div');
                    item.className = 'carousel-item';
                    
                    if (newItem.type === 'video') {
                        const video = document.createElement('video');
                        video.preload = "metadata";
                        video.controls = false;
                        video.muted = true;
                        video.loop = true;
                        video.className = 'vids';
                        video.alt = title;
                        
                        // Apply the same lazy loading logic as before
                        this.setupVideoElement(video, newItem.url);
                        item.appendChild(video);
                    } else {
                        const img = document.createElement('img');
                        img.src = newItem.url;
                        img.alt = title;
                        item.appendChild(img);
                    }
                    
                    carousel.appendChild(item);
                }
            }
        }
    }

    setupVideoElement(video, videoUrl) {
        let hasGeneratedPoster = false;

        video.addEventListener('loadedmetadata', function() {
            if (!hasGeneratedPoster) {
                this.currentTime = 0.1;
            }
        });

        video.addEventListener('seeked', function() {
            if (!hasGeneratedPoster) {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(video, 0, 0);
                this.poster = canvas.toDataURL('image/jpeg', 1.0);
                
                this.removeAttribute('src');
                this.load();
                canvas.remove();
                hasGeneratedPoster = true;
            }
        });

        video.src = videoUrl + "#t=0.1";

        video.addEventListener('mouseover', function() {
            if (!this.src) {
                this.src = videoUrl;
                this.load();
            }
            const playPromise = this.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Play failed:", error);
                });
            }
        });

        video.addEventListener('mouseout', function() {
            this.pause();
        });
    }

    renderWorks() {
        this.container.innerHTML = '';
        this.works.forEach(work => {
            const card = work.createCard();
            if (work.data.type === 'row') {
                card.setAttribute('data-title', work.data.title);
            }
            this.container.appendChild(card);
        });
    }

    getMediaType(url) {
        const extension = url.split('.').pop().toLowerCase();
        const videoExtensions = ['mp4', 'webm', 'ogg', 'mov'];
        return videoExtensions.includes(extension) ? 'video' : 'image';
    }
}