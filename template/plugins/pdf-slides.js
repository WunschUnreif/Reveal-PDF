var RevealPDF = window.RevealPDF || {
    id: 'reveal-pdf',
    init: (pre) => RevealPDF_Init(pre),
    destroy: () => { },
}

function RevealPDF_Init(pre) {
    const shouldProcess = (el) => {
        return new Set(el.className.split(' ')).has('pdf');
    }

    const getFilePath = (el) => {
        return el.getAttribute('data-file');
    }

    const process = (slide) => {
        slide.style.height = '100%';
        slide.style.top = '6px';

        let path = getFilePath(slide);

        let iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.maxWidth = '100%';
        iframe.style.maxHeight = '100%';
        iframe.style.border = 'none';
        iframe.src = path;

        slide.appendChild(iframe);
    }

    for (const slide of pre.getSlides()) {
        if (shouldProcess(slide)) {
            process(slide);
        }
        slide.setAttribute('data-transition-speed', 'fast');
    }

    pre.on('slidechanged', (event) => {
        let currentLabel = event.currentSlide.getAttribute('data-label');
        let previousLabel = event.previousSlide.getAttribute('data-label');

        if (currentLabel == previousLabel) {
            event.currentSlide.setAttribute('data-transition', 'none');
            event.previousSlide.setAttribute('data-transition', 'none');
        } else {
            event.currentSlide.setAttribute('data-transition', 'slide');
            event.previousSlide.setAttribute('data-transition', 'slide');
        }
    })
}