import type { TestConfig } from "@keystride/engine";

export interface Preset {
  slug: string;
  config: TestConfig;
  /** Page <h1> and main search phrase. */
  h1: string;
  title: string;
  description: string;
  /** Short, specific intro shown under the test. */
  intro: string;
}

const base = { punctuation: false, numbers: false, language: "english" as const };

export const PRESETS: Preset[] = [
  {
    slug: "15-seconds",
    config: { ...base, mode: "time", amount: 15 },
    h1: "15 second typing test",
    title: "15 Second Typing Test — Quick WPM Check",
    description: "Take a free 15 second typing test. Measure your words per minute and accuracy in a quick sprint.",
    intro:
      "A 15 second test measures your burst speed: how fast you type when you're fully focused. Scores run higher than on longer tests because there's no time to tire, so use it to warm up or chase a peak.",
  },
  {
    slug: "30-seconds",
    config: { ...base, mode: "time", amount: 30 },
    h1: "30 second typing test",
    title: "30 Second Typing Test — Check Your WPM",
    description: "Free 30 second typing test. Get your words per minute, accuracy and consistency in half a minute.",
    intro:
      "Thirty seconds is long enough to smooth out a lucky start but short enough to repeat many times. It's a good default for daily practice and for comparing your progress week to week.",
  },
  {
    slug: "1-minute",
    config: { ...base, mode: "time", amount: 60 },
    h1: "1 minute typing test",
    title: "1 Minute Typing Test — Free WPM Speed Test",
    description: "Take the classic 1 minute typing test. See your WPM, accuracy and a second-by-second speed graph.",
    intro:
      "The one minute test is the standard used by most typing courses and job applications. Your result here is the number to quote when someone asks how fast you type.",
  },
  {
    slug: "2-minutes",
    config: { ...base, mode: "time", amount: 120 },
    h1: "2 minute typing test",
    title: "2 Minute Typing Test — Measure Sustained Speed",
    description: "Free 2 minute typing test that measures sustained typing speed, accuracy and consistency.",
    intro:
      "Two minutes shows how well you hold your speed. Watch the consistency score: a steady rhythm matters more over longer stretches than a fast start.",
  },
  {
    slug: "10-words",
    config: { ...base, mode: "words", amount: 10 },
    h1: "10 word typing test",
    title: "10 Word Typing Test — Fastest Speed Check",
    description: "Type 10 common English words as fast as you can. A quick typing speed test with instant results.",
    intro: "Ten words takes most people under ten seconds. It's the quickest way to check your speed or warm up your fingers.",
  },
  {
    slug: "25-words",
    config: { ...base, mode: "words", amount: 25 },
    h1: "25 word typing test",
    title: "25 Word Typing Test — Quick Typing Speed Test",
    description: "Free 25 word typing test. Type 25 common English words and get your WPM and accuracy instantly.",
    intro:
      "Twenty-five words is a short, fixed amount of text, so every run is directly comparable. The timer starts on your first keystroke.",
  },
  {
    slug: "50-words",
    config: { ...base, mode: "words", amount: 50 },
    h1: "50 word typing test",
    title: "50 Word Typing Test — Check Your Typing Speed",
    description: "Take a 50 word typing test and see your words per minute, accuracy and consistency.",
    intro: "Fifty words is roughly a paragraph. It balances a quick run with enough text for a reliable speed reading.",
  },
  {
    slug: "100-words",
    config: { ...base, mode: "words", amount: 100 },
    h1: "100 word typing test",
    title: "100 Word Typing Test — Full Paragraph Speed Test",
    description: "Type 100 common English words and measure your sustained typing speed and accuracy.",
    intro: "A hundred words tests endurance as well as speed. Aim for a smooth rhythm rather than bursts, and keep your accuracy above 95%.",
  },
  {
    slug: "with-punctuation",
    config: { ...base, mode: "time", amount: 60, punctuation: true },
    h1: "typing test with punctuation",
    title: "Typing Test With Punctuation — 1 Minute",
    description: "A 1 minute typing test with capital letters, commas, full stops and quotes, like real writing.",
    intro:
      "Real writing has capitals, commas and quotes. This test adds them so your score reflects everyday typing, not just lowercase words. Expect a lower number than on plain tests.",
  },
];

export const presetBySlug = (slug: string) => PRESETS.find((p) => p.slug === slug);
