['left', 'right'].forEach((orientation) => {
    const button = document.getElementById(`${orientation}Arrow`);
    if (button) {
        button.addEventListener('click', () => scrollX('whyHemaCarousel', orientation));
    }
});

function scrollX(id, orientation) {
    console.log('f', orientation);
    const element = document.getElementById(id);
    const scrollSize = window.innerWidth;
    if (element) {
        element.scrollTo({
            behavior: "smooth",
            [orientation === 'left' ? 'right' : 'left']: 200
        });
    }
}
