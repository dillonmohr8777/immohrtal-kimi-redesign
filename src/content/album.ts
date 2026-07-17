/**
 * IMMOHRTAL site content config.
 * Edit this file when the real tracks, photos, links, or story details land.
 */

export const artist = {
  name: 'IMMOHRTAL',
  albumTitle: 'Dance With The Delusional',
  introQuoteLines: [
    "I'm from the land of the snow,",
    "So you know I'mma hold your hands if they cold,",
    "See I'm such a damaged soul so I moved to the city to get out,",
    'So you know I got no plans to be broke.',
  ],
  tagline: 'A signal from somewhere too far gone to come back normal.',
  /** the marquee ticker cycles these bars; add lines as you write them */
  marqueeBars: [
    "I'm from the land of the snow",
    "I'mma hold your hands if they cold",
    'So you know I got no plans to be broke',
    'too far gone to come back normal',
  ],
  sessionTag: 'SESSION 001 // DANCE WITH THE DELUSIONAL',
  releaseTag: 'SESSION 001 // THE FIRE IS BACK',
  coverArt: 'cover.jpg' as string | null,
  logo: 'logo-mark.png' as string | null, // transparent background mark
  heroImage: 'artist.jpg' as string | null, // the shot: 1080x1080 B&W 814 headshot
  /** small framed photo at the bottom of the story section, near the bio */
  storyImage: 'daughter.jpg' as string | null,
  storyImageCaption: 'imma hold your hands if they cold',
}

export interface Track {
  title: string
  note?: string
  src: string | null
  duration?: string
}

// Artist-approved 30-second previews. Tracks without a cleared clip remain
// visible in the album sequence but intentionally do not expose audio.
export const tracks: Track[] = [
  { title: 'No Way Out', src: null },
  { title: 'Picking Up My Notepad', src: '/audio/previews/02-picking-up-my-notepad.mp3', duration: '0:30' },
  { title: '814 Blood (ft. King Keev)', src: '/audio/previews/03-814-blood.mp3', duration: '0:30' },
  { title: 'My Mothers Baby', src: '/audio/previews/04-my-mothers-baby.mp3', duration: '0:30' },
  { title: 'Roll the Dice', src: '/audio/previews/05-roll-the-dice.mp3', duration: '0:30' },
  { title: 'My Own Way', src: '/audio/previews/06-my-own-way.mp3', duration: '0:30' },
  { title: 'Headstone (Interlude)', src: null },
  { title: 'Grade A Love', src: '/audio/previews/08-grade-a-love.mp3', duration: '0:30' },
  { title: 'On My Way (ft. King Keev)', src: '/audio/previews/09-on-my-way.mp3', duration: '0:30' },
  { title: 'Waitlist', src: null },
  { title: 'Dance with the Delusional (ft. Ted Moon)', src: null },
]

export interface Platform {
  id: 'spotify' | 'apple' | 'youtube' | 'soundcloud' | 'presave'
  label: string
  href: string | null
}

export const platforms: Platform[] = [
  { id: 'spotify', label: 'Spotify', href: null },
  { id: 'apple', label: 'Apple Music', href: null },
  { id: 'youtube', label: 'YouTube', href: null },
  { id: 'soundcloud', label: 'SoundCloud', href: null },
  { id: 'presave', label: 'Pre-Save', href: null },
]

export const story = {
  heading: 'The Delusion',
  pullQuote:
    'Mac Miller made it feel possible to rap and still sound like yourself.',
  paragraphs: [
    'IMMOHRTAL is Dillon Mohr, a 28 year old chief marketing officer and rapper. He spent years learning how to make other people sound bigger, sharper, and harder to ignore. Rap was always the thing underneath it. The notebooks, the voice memos, the late night lines, the part that never left.',
    'He was raised in Erie, Pennsylvania, and lives in Pittsburgh now. Mac Miller is the main reason Dillon wanted to rap at all. Faces hit the house in 2014 and never really left. That influence is personal, not a costume. It\'s the permission to be honest, detailed, strange, funny, damaged, and still competitive.',
    'Dance With The Delusional is the first professional IMMOHRTAL record. It\'s built from two lives meeting in one room: the marketer who understands attention and the rapper who still treats every verse like a sport. The goal is simple. Make something detailed enough for lyric people, human enough for real fans, and honest enough to stand beside the records that made him start.',
  ],
}

export const markings = [
  {
    numeral: 'I',
    label: 'Erie, PA',
    coord: '42.1292 N / 80.0851 W',
    line: 'Lake effect winters, small city pressure, first notebooks, first delusions.',
  },
  {
    numeral: 'II',
    label: 'Pittsburgh, PA',
    coord: '40.4406 N / 79.9959 W',
    line: 'Where Mac made the dream feel close enough to chase for real.',
  },
  {
    numeral: 'III',
    label: 'The Split',
    coord: 'SESSION 001',
    line: 'CMO discipline on one side, artist instinct on the other. Same person, same record.',
  },
]

export const socials = [
  { id: 'instagram', label: 'Instagram', handle: '@immohrtal', href: null as string | null },
  { id: 'tiktok', label: 'TikTok', handle: '@immohrtal', href: null as string | null },
  { id: 'x', label: 'X', handle: '@immohrtal', href: null as string | null },
  { id: 'youtube', label: 'YouTube', handle: '@immohrtal', href: null as string | null },
]

export const contact = {
  bookingEmail: 'immohrtal.llc@gmail.com',
  phone: '(814) 873-5333',
  phoneHref: 'tel:+18148735333',
}
