class SplitFlapAnimation {
    constructor() {
        this.container = document.getElementById('splitFlap');
        this.chars = this.container.querySelectorAll('.flap-char');
        this.characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
        this.isAnimating = false;
        this.targetWord = 'L3V3';
        
        // Configurable timing variables
        this.spinDuration = 600; // Duration of spin animation in ms
        this.pauseDuration = 1200; // Duration to pause on keyword stops in ms
        this.cycleSpeed = 80; // Time between character changes in ms
        this.animationDuration = 8000; // Total animation duration in ms
        this.keywordStops = ['LIVE', 'LOVE'];
        
        // Generate sequence with keywords
        this.sequence = this.generateSequence();
        
        this.container.addEventListener('click', () => this.animate());
    }
    
    generateRandomItem() {
        return [
            'L',
            this.characters[Math.floor(Math.random() * this.characters.length)],
            'V',
            this.characters[Math.floor(Math.random() * this.characters.length)]
        ];
    }
    
    generateSequence() {
        const sequence = [];
        
        
        for (let i = 0; i < 20; i++) {
            sequence.push(this.generateRandomItem());
        }
        
  
        sequence.splice(8, 0, ['L', 'I', 'V', 'E']);
        
        sequence.splice(16, 0, ['L', 'O', 'V', 'E']);
        
        // End with L3V3
        sequence.push(['L', '3', 'V', '3']);
        
        return sequence;
    }
    
    async animate() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        
        let sequenceIndex = 0;
        
        const animate = async () => {
            if (sequenceIndex < this.sequence.length) {
                const chars = this.sequence[sequenceIndex];
                
                // Update the display
                this.chars[1].textContent = chars[1];
                this.chars[3].textContent = chars[3];
                
                this.chars[1].classList.add('flipping');
                this.chars[3].classList.add('flipping');
                
                setTimeout(() => {
                    this.chars[1].classList.remove('flipping');
                    this.chars[3].classList.remove('flipping');
                }, this.spinDuration);
                
                // Check if current word is a keyword stop
                const currentWord = chars[0] + chars[1] + chars[2] + chars[3];
                const pauseTime = this.keywordStops.includes(currentWord) ? this.pauseDuration : this.cycleSpeed;
                
                sequenceIndex++;
                setTimeout(animate, pauseTime);
            } else {
                // Animation complete
                this.isAnimating = false;
            }
        };
        
        animate();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    const splitFlap = new SplitFlapAnimation();
    splitFlap.animate();
});
