/**
 * BLOG. IMMOHRTAL, in Dillon's voice.
 *
 * Paragraphs support inline links with [anchor](url) markdown, rendered
 * by <RichText>. To add or replace posts, edit the `posts` array; the
 * site generates blog/<slug>.html permalinks and the sitemap automatically.
 */

export interface BlogSection {
  heading: string
  paragraphs: string[]
}

export interface BlogPost {
  slug: string
  title: string
  date: string // display only
  tag: string
  /** the lede: shows on the index teaser and opens the post */
  answer: string
  sections: BlogSection[]
}

export const posts: BlogPost[] = [
  {
    slug: `who-is-immohrtal`,
    title: `Who Is IMMOHRTAL`,
    date: `July 2026`,
    tag: `About`,
    answer: `IMMOHRTAL is Dillon Mohr, a 28 year old rapper from Erie, Pennsylvania who lives in Pittsburgh now and works a day job as a Chief Marketing Officer. The debut album is called Dance With The Delusional, eleven tracks recorded in 2023 and remastered, with features from King Keev and Ted Moon. That is the whole thing in two sentences. Everything after this is me telling you the longer version.`,
    sections: [
      {
        heading: `The short answer, and then me being honest`,
        paragraphs: [
          `So somebody typed my name into a search bar and here we are. Hey. I am Dillon. IMMOHRTAL is the name I rap under. I am 28, I grew up in Erie, PA, we call it the 814, and these days I am posted up in Pittsburgh. During the day I run marketing for a company. I am a CMO. At night, and honestly a lot of the early mornings too, I am a rapper who takes every single verse way too seriously. Both of those are true. Same guy.`,
          `I know how that reads. Marketing exec who raps. It sounds like a bit. It sounds like a LinkedIn guy having a midlife thing ten years early. I get it, I really do, and I am not gonna pretend the combination is not a little funny. But this was never a pivot or some brand play. This was the thing I always did, quietly, while I built the other thing loudly. If you want the full story with all the messy parts, it lives over on the [about page](./about.html). This here is the clean version for anybody just trying to figure out what they are looking at.`,
        ],
      },
      {
        heading: `Where I am from and why it matters`,
        paragraphs: [
          `Erie is a lake town. Cold, gray a lot of the year, kinda forgotten by the rest of the state. It is the type of place that either makes you soft or makes you patient, and I ended up patient. I was a kid who drew constantly and wrote constantly. Notebooks full of stuff nobody asked for. I did not know it was practice at the time. It just felt like the only thing my hands wanted to do.`,
          `Around 16 something clicked with cadence. The way words could sit on a beat, the pockets, the little spaces where you land a syllable and it just feels right in your chest. I could not have explained it back then. I just knew when a line hit and when it did not. That is the part of rap that grabbed me first, before I had anything real to say. The mechanics. The sport of it.`,
          `Then life did the thing life does. I got good at marketing. Got a job, then a better one, then the kind of role where people report to you and there is always one more fire. The career grew and grew and it kept pushing the music further down the list. For years the music was the thing I would get to later. If you are from a place like the 814 you know that feeling. You are taught to be responsible first and dream on the weekends. I did that for a long stretch. Longer than I am proud of, honestly.`,
        ],
      },
      {
        heading: `Mac Miller, and the reason any of this exists`,
        paragraphs: [
          `I gotta tell you about [Mac Miller](https://en.wikipedia.org/wiki/Mac_Miller) because without him there is no IMMOHRTAL. Full stop. His album Faces came out in 2014 and it rearranged something in me. It was loose and it was heavy and it was a dude being completely honest about being kind of a mess while also being unbelievably skilled. He was from Pittsburgh, the city I live in now, which felt like a wink from the universe once I moved here.`,
          `Faces is the reason I rap. Not the reason I like rap, the reason I actually do it. Before that I was a fan who wrote in notebooks. After that I was somebody who understood you could put the whole real you on a track and it would be worth something. He gave me permission I did not know I was waiting for. If you came up on his stuff, or you are looking for artists who carry that same honest, a little damaged, still funny energy, I wrote a whole thing about [rappers like Mac Miller](./blog/rappers-like-mac-miller.html) that might be your lane.`,
          `I do not say his name to borrow shine. I say it because you should know where I come from as a listener before you judge me as a rapper. Every artist is a kid who loved somebody else's music first. He was mine.`,
        ],
      },
      {
        heading: `The album, the features, and the white rapper thing`,
        paragraphs: [
          `The debut is Dance With The Delusional. Eleven tracks. I recorded it in 2023 and then went back and remastered it because I am the kind of person who cannot leave a thing alone until it sounds like what I heard in my head. The delusional part is me, by the way. You gotta be a little delusional to make a rap album at 28 while running a company. I decided to dance with that instead of fighting it.`,
          `My best friend King Keev is on it. He shows up on 814 Blood and On My Way, and those songs mean more to me than almost anything else on there because they are literally about us, about home, about the people who were around before anybody was listening. Ted Moon is on the title track and brought something to it I could not have made alone. You can hear previews and the album itself over in the [listen section](./index.html#listen), and there is an official video for Picking Up My Notepad if you would rather [watch that first](./video.html). I would start with either. Whatever your mood is.`,
          `Now the part I take seriously. I am a white dude rapping. I know exactly what that carries and I am not casual about it. This music came from Black artists and Black communities and I am a guest in a house I love. So I try to earn my place line by line instead of assuming I have one. That means I do the work, I stay honest about who I am, I do not cosplay a life I did not live, and I let the craft speak before my mouth does. If a bar is not good enough to justify me saying it, I cut it. That is the standard. I would rather be respected slow than accepted fast.`,
          `People ask why now. Why do this at 28 with a whole career already going. And the honest answer is I ran out of good excuses. The campaign line for this whole thing is if not now, when, and I mean it as a real question I had to ask myself. I kept saying later. Later turned into years. At some point later becomes never, and I was not willing to find out where my never was. So I stopped waiting. Here it is. Whether that is brave or dumb I will let you decide after you hear it.`,
          `That is who IMMOHRTAL is. A marketer who understands attention and a rapper who treats every verse like a game he is trying to win, wrapped up in the same person who used to fill notebooks in a cold town by a lake. If you made it this far, thank you, for real. Go press play and let me earn the rest of it.`,
        ],
      },
    ],
  },
  {
    slug: `rappers-like-mac-miller`,
    title: `Rappers Like Mac Miller and Where I Actually Fit`,
    date: `July 2026`,
    tag: `Influences`,
    answer: `People search "rappers like Mac Miller" hoping to find that same feeling. The honesty. The jokes that hide something. The craft under the mess. I get it, because I searched for it too. I am IMMOHRTAL, Dillon out of Erie, and Mac is the whole reason I ever picked up a mic.`,
    sections: [
      {
        heading: `Why we all keep looking for the next Mac`,
        paragraphs: [
          `Let me be straight with you. When you type "rappers like [Mac Miller](https://en.wikipedia.org/wiki/Mac_Miller)" into a search bar, you are not really looking for a copy. You are looking for a feeling. That warm, cracked open, this dude is telling the truth kind of feeling. I know because I did the same thing for years, chasing that specific thing he gave people.`,
          `For me it started in 2014. Faces landed in my house and it just never left. I was young, a little lost, and here was this record that was funny and sad and honest all in the same breath. It sounded like a guy figuring himself out in real time and inviting you to sit in the room while he did it. That was the thing that made me want to rap. Not fame. Not money. Just that feeling of, oh, you can actually do that with a song.`,
          `So when folks group artists together and say if you like Mac you might like these other people, I understand the instinct. We are all trying to hold onto something that made us feel less alone. That is not a small thing, man. That is the whole point of music.`,
        ],
      },
      {
        heading: `What made Mac different, for real`,
        paragraphs: [
          `A lot of people get lumped in with Mac and some of it makes sense. [Frank Ocean](https://en.wikipedia.org/wiki/Frank_Ocean) gets named a ton, and I see why, because Frank has that same thing where the honesty is the melody, where the pain is dressed up so pretty you almost miss how heavy it is. And [Wiz Khalifa](https://en.wikipedia.org/wiki/Wiz_Khalifa) shares the same Pittsburgh air Mac breathed, that loose, easy, roll the windows down feel. These are real artists and the comparisons come from a good place.`,
          `But here is what I think actually made Mac his own thing. He never stopped leveling up. I remember him dropping a preview track on iTunes one day and it sounded like a straight leap forward from where he had just been. Me and my best friend sat there just respecting how hard he pushed. Every project he was reaching for something new, learning piano, singing more, working with different people, getting more honest about the dark stuff. He kept evolving right up until he passed. That restlessness is the thing. That is the part people feel and cannot always name.`,
          `The other piece is the damage. And I say that with love. Mac did not hide the fact that he was struggling. He put it in the music without turning it into a costume. There is a difference between performing your pain and just letting it be there in the song, and he knew that difference better than almost anybody. The humor lived right next to the hurt. You would laugh at a line and then two bars later something would catch in your chest.`,
          `So when people ask me how to rap like Mac Miller, my honest answer is you kind of cannot, and you should not try. What you can carry is the values. Tell the truth. Keep learning. Let the funny and the sad share a seat. Do not perform a version of yourself, just be the actual one on the mic.`,
        ],
      },
      {
        heading: `Where I fit, and where I do not`,
        paragraphs: [
          `I want to be careful here because I take this serious. I am a white rapper who was pulled into this by a white rapper who did it with real respect for where the music comes from. Mac is a big part of why I believe there is a respectful way to do this at all. He never acted like he invented anything. He put his head down and earned it line by line, and he gave constant credit to the people who built the thing he loved.`,
          `So I am not out here claiming I am the next Mac. I never met the man, never knew him, and I would never pretend otherwise. What I am doing is trying to earn my own place the same way, one bar at a time. I came up in Erie, the 814, and I live in Pittsburgh now, which means I am literally standing in the city that raised so much of the sound I love. I do not take that lightly.`,
          `My lane is lyrical, storytelling, underground rap. I want you to feel like you know me a little better after a song than you did before it. I made my debut album, Dance With The Delusional, eleven tracks I recorded back in 2023, and I poured the real me into it. The doubt, the jokes, the stuff I have not figured out yet. If you want to hear where I actually land instead of just reading me talk about it, you can [hear the album right here](./index.html#listen).`,
          `I have a day job too, for what it is worth. I am a marketing guy by trade. So this is not some fantasy where I quit everything and chase a dream in a movie montage. This is a grown man making time at night to say something true. There is a campaign line I keep coming back to, if not now, when. I am 28. The clock is not slowing down for anybody. So I stopped waiting.`,
        ],
      },
      {
        heading: `If you came here for the feeling, here is my offer`,
        paragraphs: [
          `If Mac is your guy and you found this looking for something in that same family, I am not going to hand you a substitute and tell you it is the same. Nobody replaces him. But I can tell you what I am building comes from the same well. Honesty over flash. Craft over noise. Getting a little bit better every single time I open the notes app.`,
          `I think the artists who really live in that Mac lineage are the ones who get that the whole point was caring that much. Caring about the words, caring about the people listening, caring enough to keep changing instead of running the same play forever. That is the actual inheritance. A way of showing up, every time, like it matters.`,
          `So if you want the whole story, how a kid from Erie ended up chasing this, you can read [my story on the about page](./about.html), and if you are curious about the town that shaped me before Pittsburgh did, I wrote a whole thing about [being a rapper out of Erie PA](./blog/rappers-from-erie-pa.html) that goes deeper on that.`,
          `Mostly I just want to say thank you for looking. The fact that you typed those words means Mac reached you too, and that means we already got something in common. I am gonna keep telling the truth and keep getting better, same as the man who got me into all this taught me by example. If not now, when. Come find me when you are ready. I will be here, still working.`,
        ],
      },
    ],
  },
  {
    slug: `rappers-from-erie-pa`,
    title: `Rappers From Erie PA and Why I Claim The 814`,
    date: `July 2026`,
    tag: `The 814`,
    answer: `If you looked up rappers from Erie PA and landed here, imma be straight with you. Erie is not a rap city. Nobody thinks Erie when they think hip hop, and I get why. But I am from there, I write from there, and I put that 814 area code all over my music on purpose. I am IMMOHRTAL, Dillon Mohr, and this is me telling you where I actually come from and why I keep saying it out loud.`,
    sections: [
      {
        heading: `Erie, PA and the 814`,
        paragraphs: [
          `Erie sits up in the top corner of Pennsylvania, right on the lake. Cold half the year, gray a lot of the time, quiet in a way that can feel like the world forgot to check on you. Locals call the whole area the 814, after the area code, and if you know you know. That is where I grew up. That is the version of me that everything else got built on top of.`,
          `It is not a place with a rap history I can point to and say look, this is my lineage, these are the legends who came before me on these blocks. That story does not exist for Erie. And I could pretend, I could act like there was some deep underground scene raising me, but that would be a lie and you would smell it. So here is the real thing. I came up in a small city that had no reason to make a rapper, and it made one anyway.`,
          `When you are from a place that nobody expects anything from, you carry it a little different. You either hide it or you wear it loud. I decided a while back to wear it loud. Erie made me patient, made me observant, made me a kid who spent way too much time in his own head drawing and writing. That is where the writing started. Long before any of this, I was just a kid in the 814 filling up pages because there was nothing else that felt as good.`,
        ],
      },
      {
        heading: `How I Got Here From There`,
        paragraphs: [
          `I drew and I wrote constantly growing up. Constantly. It was the one thing that made sense to me before anything else did. Somewhere around sixteen the rap part clicked, the cadence, the delivery, the way words could land on a beat and hit like a punch or a whisper. Once I felt that, I could not unfeel it. It stopped being a hobby and started being the thing.`,
          `The single reason I ever wanted to actually do this was [Mac Miller](https://en.wikipedia.org/wiki/Mac_Miller). His album Faces from 2014 rearranged something in me. It was honest and messy and beautiful and it gave me permission to be a person on a track instead of a character. I wrote a whole piece about that if you want it, about the [artists who share that Mac Miller lineage](./blog/rappers-like-mac-miller.html) and why that honesty matters to me. He is a Pittsburgh guy, same as [Wiz Khalifa](https://en.wikipedia.org/wiki/Wiz_Khalifa), and part of why Pittsburgh means so much to me is that thread back to Mac.`,
          `So my map is simple. I was born and shaped in Erie, in the 814, and I live in Pittsburgh now. Two Pennsylvania cities, one that raised me and one that I chose. The Erie in me is the foundation. Pittsburgh is where the foundation got to grow up a little. I am 28 now, I work a real job as a Chief Marketing Officer, and I still write like that kid with the pages. That never left.`,
          `If you want the whole timeline, the long version of how a quiet Erie kid ended up making rap records, I put [my full story on the about page](./about.html). This post is really just about the where. And the where is the 814, first and always.`,
        ],
      },
      {
        heading: `Where the 814 Shows Up In The Music`,
        paragraphs: [
          `My debut album is called Dance With The Delusional. Eleven tracks, recorded back in 2023, remastered since then so it hits the way I always heard it in my head. And Erie is baked into it. Not as a gimmick, as a fact of who is talking on the record.`,
          `The clearest place is a song called 814 Blood. That title is not subtle and it is not supposed to be. It is me saying the area code is in me, in my blood, the good and the heavy. My best friend King Keev is on that one with me, and that matters, because the 814 to me is also the people. Keev is on On My Way too. When I say I claim Erie, I mean I claim the folks who came up with me there, not just the map coordinates.`,
          `There is also a feature from Ted Moon on the title track. The whole record is lyrical, storytelling, underground rap, the kind of thing where you have to actually listen to the words to get it. If you want to hear how Erie sounds when it finally makes a rapper, you can [hear the album for yourself](./index.html#listen) and let it tell you instead of me. 814 Blood is probably the best door into all of it.`,
          `I am careful about my place in this. I am a white kid from a lake town making rap, and I take hip hop seriously enough to know I do not get to just walk in and assume a spot. I want to earn it line by line, record by record, the honest way. Claiming Erie is part of that honesty. I am not borrowing somebody else's city or somebody else's story. I am bringing my own, plain and real, from a place that had none of this before me.`,
        ],
      },
      {
        heading: `Putting Erie On, One Line At A Time`,
        paragraphs: [
          `So when you search rappers from Erie PA, the honest answer for right now is a short list and I am on it. That used to bum me out. Now I kind of love it. Being early to something means you get to set the tone. No pressure of a legacy to live up to, no scene to fit into, just me and a beat and a bunch of pages from a kid who never stopped writing.`,
          `My whole thing has a line to it, if not now, when. That is how I feel about Erie too. Somebody has to be the one who says this city is on the map for rap. Might as well be me. I would rather try and look crazy than sit around waiting for permission that was never coming.`,
          `If you are from the 814, or anywhere that nobody expects music to come out of, I hope this hits you a certain way. You do not need to be from a rap city to make rap that means something. You just need to be honest about where you are from and put in the work to earn the room. I am doing that from Erie, for Erie, and I am just getting started. Come listen. Let me show you what the 814 sounds like.`,
        ],
      },
    ],
  },
  {
    slug: `the-come-up`,
    title: `The Come Up: Why This Music Waited`,
    date: `July 2026`,
    tag: `The come up`,
    answer: `I was drawing before I was rapping. I always had a pen in my hand, and I always wanted things to come to life. The music you are hearing now waited years for me to be ready to stand behind it. This is the story of the wait.`,
    sections: [
      {
        heading: `It always started with a pen`,
        paragraphs: [
          `I was always creating. Drawing, writing, building little worlds out of whatever was in front of me. I always felt like making something brought value to everything around it, and I never grew out of that feeling. The pen just changed jobs over the years.`,
          `By sixteen I finally understood cadence and delivery for real, and that changed everything. Rap stopped being something I loved from a distance and became something I could actually do. From that point on I was always making music, even when nobody was supposed to hear it.`,
        ],
      },
      {
        heading: `The permission problem`,
        paragraphs: [
          `That passion festered for years, because let us be honest, nobody is out here asking for a white rapper. I never wanted to patronize the culture or take anything away from what rap actually is. This culture was not started by white people and it is not owned by them, and I was not going to touch it carelessly. So I sat on it.`,
          `Then there was Mac. Gods like [Mac Miller](https://en.wikipedia.org/wiki/Mac_Miller) made me believe there was a way to do this if you did it with respect. Stay true to what hip hop actually is, keep the sport of it alive, and earn your place line by line instead of assuming you are owed one. That is the lane I am in, and I want to leave my blueprint on this game.`,
        ],
      },
      {
        heading: `Always evolving`,
        paragraphs: [
          `I remember when iTunes was still a big deal and Mac dropped a preview track that sounded unlike anything he had ever created before. Me and my best friend just sat with it, respecting how hard he was pushing himself to level up. He kept evolving like that until the day he passed.`,
          `I carried that into my own life. You should always be evolving. You should have motivations, figures, dreams. You should feel every single emotion the human brain is supposed to feel. That is exactly what his music was, and that is exactly what it did for me. I do not think I would be here if it was not for his music.`,
        ],
      },
      {
        heading: `The detour and the return`,
        paragraphs: [
          `After my undergrad I got launched into marketing management roles, and that blossomed into becoming a CHIEF MARKETING OFFICER. That should be all caps, by the way. I worked so hard to get where I am at that the music never got the priority I always meant to give it.`,
          `The songs you are hearing now were recorded in 2023. I have remastered them, remixed them, and lived with them long enough to know they hold up. I moved to Pittsburgh that same year, and this city has been home ever since. I feel a deep tie to it, and to the artists who put it on the map.`,
          `Now I am finally in the right headspace to do what I set out to do. Leave a legacy, leave a stamp on Pittsburgh the way Mac has, the way the other greats from this city have. This music needed to see the light of day. So here it is. If you want the short version of who I am, start with [who is IMMOHRTAL](./blog/who-is-immohrtal.html).`,
        ],
      },
    ],
  },
]
