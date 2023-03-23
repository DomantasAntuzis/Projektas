export default class Clock {
    constructor(timeLimit) {
      this.timeLimit = timeLimit;
      this.timeLeft = timeLimit;
      this.startTime = null;
    }
  
    start() {
      this.startTime = Date.now();
      console.log(this.startTime)
    }
  
    stop() {
        if (this.startTime !== null) {
          const elapsed = Date.now() - this.startTime;
          this.timeLeft = Math.max(0, this.timeLeft - elapsed);
          this.startTime = null;
          console.log(this.timeLeft)
        }
      }
      
  
    reset() {
      this.timeLeft = this.timeLimit;
      this.startTime = null;
    }
  
    getTimeLeft() {
      if (this.startTime !== null) {
        const elapsed = Date.now() - this.startTime;
        console.log(elapsed)
        return Math.max(0, this.timeLeft - elapsed);
      } else {
        return this.timeLeft;
      }
    }
  }