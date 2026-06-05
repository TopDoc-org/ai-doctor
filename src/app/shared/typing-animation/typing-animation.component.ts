import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';

// Angular typewriter (equivalent of MagicUI's React <TypingAnimation>).
// Types each phrase, pauses, deletes, advances; loops by default.
@Component({
  selector: 'app-typing-animation',
  template: `<span>{{ display }}</span><span class="ta-cursor">|</span>`,
  styles: [
    `
      :host { display: inline-flex; align-items: baseline; }
      .ta-cursor {
        margin-left: 1px;
        font-weight: 400;
        animation: ta-blink 1s step-end infinite;
      }
      @keyframes ta-blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
    `,
  ],
})
export class TypingAnimationComponent implements OnInit, OnChanges, OnDestroy {
  @Input() texts: string[] = [];
  @Input() typingSpeed = 60;
  @Input() deletingSpeed = 35;
  @Input() pauseMs = 1500;
  @Input() loop = true;

  display = '';
  private index = 0; // which phrase
  private timer: any = null;

  ngOnInit(): void {
    this.start();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['texts'] && !changes['texts'].firstChange) {
      this.restart();
    }
  }

  ngOnDestroy(): void {
    this.clear();
  }

  private restart(): void {
    this.clear();
    this.display = '';
    this.index = 0;
    this.start();
  }

  private start(): void {
    if (!this.texts || this.texts.length === 0) return;
    this.typePhrase();
  }

  private typePhrase(): void {
    const full = this.texts[this.index] || '';
    if (this.display.length < full.length) {
      this.display = full.slice(0, this.display.length + 1);
      this.timer = setTimeout(() => this.typePhrase(), this.typingSpeed);
      return;
    }
    // fully typed -> pause, then delete (unless single, non-loop)
    if (this.texts.length === 1 && !this.loop) return;
    this.timer = setTimeout(() => this.deletePhrase(), this.pauseMs);
  }

  private deletePhrase(): void {
    if (this.display.length > 0) {
      this.display = this.display.slice(0, -1);
      this.timer = setTimeout(() => this.deletePhrase(), this.deletingSpeed);
      return;
    }
    // erased -> next phrase
    this.index = (this.index + 1) % this.texts.length;
    if (this.index === 0 && !this.loop) return;
    this.timer = setTimeout(() => this.typePhrase(), this.typingSpeed);
  }

  private clear(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
