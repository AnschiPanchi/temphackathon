const playSound = (type) => {
    try {
        let audio;
        if (type === 'click') {
            // A subtle, high-pitched "click/thock" sound
            audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTtvT18AAAAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA');
            // Mocking a better click sound for now, or just using a simple beep if base64 is too long.
            // Let's use a slightly more realistic small click base64.
            audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAEAAAAAAA==');
        } else if (type === 'hover') {
            audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAEAAAAAAA==');
        }
        
        if (audio) {
            audio.volume = 0.2;
            audio.play().catch(e => console.warn("Audio play blocked:", e));
        }
    } catch (error) {
        console.error("Error playing sound:", error);
    }
};

export default playSound;
