// ─────────────────────────────────────────────────────────────
//  Personalize your universe here.
//  Photos: universe/photos/<system-id>/   Songs: universe/music/
//  See README.md for the full guide.
// ─────────────────────────────────────────────────────────────

export default {
  // Interface language: "en" or "tr".
  language: "en",

  // Shown in the browser tab and on the intro screen.
  title: "Name's Universe",

  // Intro screen.
  intro: {
    eyebrow: "From Name, to Name",
    subtitle: "I built you a universe, my love. Let's get lost in it.",
    button: "Enter the universe",
    line: "For you, always.", // Appears briefly during the intro flight.
  },

  // The star at the center. Clicking it opens this message.
  center: {
    name: "Star of My Life",
    color: "#ffe3a1",
    message:
      "Every planet out there is a moment we shared, and every one of them orbits you.\n\nThank you for being the center of my universe, Name.\n\n— Name",
  },

  // Each system is a chapter of the album; each photo becomes a planet.
  //   id        → folder name: universe/photos/<id>/  (lowercase, dashes)
  //   color     → optional; without it the system gets a random pale color
  //   memories  → list of photos; add a note with { photo, text }
  //               and optionally when and where it was: { photo, text, date, place }
  //   position  → [x, y, z] (optional; placed automatically if omitted)
  systems: [
    {
      id: "childhood",
      name: "Childhood Constellation",
      position: [-420, 72, -160],
      planetScale: [1.4, 2.3],
      memories: [
        { photo: "01.svg", date: "Summer 1998", place: "Lisbon", text: "Tip: tap any card to flip it and read the note on the back, just like writing on the back of a printed photo." },
        { photo: "02.svg", date: "June 1997", text: "Your first ice cream. Most of it ended up on your face." },
        { photo: "03.svg", date: "Spring 2001", text: "The red bicycle you refused to leave in the garage, even in winter." },
        { photo: "04.svg", date: "2002", text: "Your mom swears you were already this stubborn at four." },
        { photo: "05.svg", date: "September 2003", text: "First day of school: brave face, tiny backpack." },
        { photo: "06.svg", date: "August 2005", place: "By the sea", text: "The summer you learned to swim and wouldn't get out of the sea." },
        { photo: "07.svg", date: "2008", text: "Somewhere in this photo is the girl I'd fall for twenty years later." },
      ],
    },
    {
      id: "you-galaxy",
      name: "Galaxy of You",
      position: [-188, 104, -374],
      planetScale: [1.8, 3.1],
      memories: [
        { photo: "01.svg", text: "Tip: portrait or landscape, every card reshapes itself to fit its photo." },
        { photo: "02.svg", date: "March 2021", place: "Barcelona", text: "The laugh that made me forget what I was saying." },
        { photo: "03.svg", date: "May 2021", text: "You, pretending not to notice the camera." },
        { photo: "04.svg", date: "October 2021", text: "Sunday mornings, oversized sweater, too much coffee." },
        { photo: "05.svg", date: "January 2022", text: "The day you cut your hair and asked me fifty times if it looked okay. It did." },
        { photo: "06.svg", date: "February 2022", text: "Concentrating so hard on that puzzle you stuck your tongue out." },
        { photo: "07.svg", date: "July 2022", place: "Amalfi", text: "Golden hour likes you almost as much as I do." },
        { photo: "08.svg", date: "2023", text: "My favorite view, in any city." },
      ],
    },
    {
      id: "our-orbit",
      name: "Our Orbit",
      position: [238, 64, -318],
      planetScale: [1.7, 3.0],
      memories: [
        { photo: "01.svg", text: "Tip: use ‹ › or the arrow keys to fly to the next memory in this system." },
        { photo: "02.svg", date: "14 November 2020", place: "Corner Café", text: "The café where we talked until they started stacking chairs." },
        { photo: "03.svg", date: "December 2020", text: "Our first photo together. We both look terrified." },
        { photo: "04.svg", date: "3 February 2021", text: "The night you said it first.\n\nI said it back before you finished the sentence." },
        { photo: "05.svg", date: "May 2021", text: "Six months in and still nervous before every date." },
        { photo: "06.svg", date: "June 2021", place: "Riverside", text: "The rainy walk home where neither of us minded getting soaked." },
        { photo: "07.svg", date: "August 2021", text: "Meeting your friends. I passed the test (I think)." },
        { photo: "08.svg", date: "14 November 2021", text: "Our first anniversary dinner, and the dessert we argued about." },
        { photo: "09.svg", date: "2022", text: "Wherever this orbit goes, I'm glad it goes around you." },
      ],
    },
    {
      id: "side-by-side",
      name: "Side by Side System",
      position: [454, -30, 48],
      planetScale: [1.6, 2.6],
      memories: [
        { photo: "01.svg", text: "Tip: planets you've visited dim, and the ☰ menu keeps count of what you've explored." },
        { photo: "02.svg", date: "1 March 2022", place: "Our first flat", text: "Moving day. Forty boxes, one plant, zero patience." },
        { photo: "03.svg", date: "March 2022", text: "Building that bookshelf took three hours and one small fight." },
        { photo: "04.svg", date: "April 2022", text: "Our first dinner party. Nobody noticed the burnt bread." },
        { photo: "05.svg", date: "July 2022", place: "Coast road", text: "Road trip playlist: 80% your songs, 20% my complaints." },
        { photo: "06.svg", date: "Autumn 2022", text: "Studying side by side, mostly distracting each other." },
        { photo: "07.svg", date: "May 2023", place: "Alps", text: "The hiking trail we got lost on, and the best view we've ever found." },
        { photo: "08.svg", date: "Every day", text: "Ordinary days are my favorite days with you." },
      ],
    },
    {
      id: "happy-belt",
      name: "Belt of Happiness",
      position: [170, -94, 328],
      planetScale: [1.4, 2.5],
      memories: [
        { photo: "01.svg", text: "Tip: press H anytime to fly home. On desktop, fly with W A S D and rise or sink with Q / E." },
        { photo: "02.svg", date: "June 2021", place: "Summer festival", text: "The concert where we lost our voices." },
        { photo: "03.svg", date: "September 2022", text: "Your face when you got the job." },
        { photo: "04.svg", date: "July 2022", text: "Ice cream in the rain, because why not." },
        { photo: "05.svg", date: "December 2022", place: "Home", text: "Dancing in the kitchen to a song neither of us knew." },
        { photo: "06.svg", date: "August 2023", place: "Fairground", text: "The fair, the giant teddy bear, and my aching arm." },
        { photo: "07.svg", date: "2024", text: "Happiness, captured in one blurry photo." },
      ],
    },
    {
      id: "kiss-orbit",
      name: "Orbit of Kisses",
      position: [-226, -64, 378],
      planetScale: [1.7, 2.8],
      memories: [
        { photo: "01.svg", date: "20 November 2020", place: "By the river", text: "Our first kiss.\nBy the river.\nI still remember the song playing nearby." },
        { photo: "02.svg", date: "2021", place: "Airport", text: "Goodbye kisses at the airport always last too long." },
        { photo: "03.svg", text: "A kiss on the forehead for every bad day." },
        { photo: "04.svg", date: "31 December 2021", text: "New Year's Eve, right on the countdown." },
        { photo: "05.svg", date: "2022", text: "Stolen kiss, caught on camera by your sister." },
        { photo: "06.svg", date: "Still", text: "Still giving me butterflies." },
      ],
    },
    {
      id: "food-route",
      name: "Late-Night Food Route",
      position: [-488, -80, 170],
      planetScale: [1.6, 2.4],
      memories: [
        { photo: "01.svg", date: "Every Friday", place: "Luigi's", text: "Midnight pizza, our oldest tradition." },
        { photo: "02.svg", date: "2021", place: "Taco truck", text: "The taco truck we'd cross the whole city for." },
        { photo: "03.svg", date: "March 2022", place: "Our kitchen", text: "Your first attempt at homemade pasta. We ordered takeout." },
        { photo: "04.svg", date: "2023", place: "Somewhere downtown", text: "That tiny ramen place with no name and the best broth on earth." },
        { photo: "05.svg", date: "Always", text: "You always steal my fries. I always let you." },
      ],
    },
    {
      id: "paw-nebula",
      name: "Paw Print Nebula",
      position: [508, 134, -136],
      planetScale: [1.5, 2.5],
      memories: [
        { photo: "01.svg", date: "10 April 2022", place: "Shelter", text: "The day we brought our kitten home." },
        { photo: "02.svg", date: "April 2022", text: "She chose your lap on the very first night. Traitor." },
        { photo: "03.svg", date: "December 2022", text: "Cat vs. the Christmas tree: the cat won." },
        { photo: "04.svg", date: "2023", text: "Three of us napping on one couch." },
        { photo: "05.svg", date: "10 April 2023", text: "Her first Christmas. She ate the decorations." },
        { photo: "06.svg", date: "Sundays", place: "Next door", text: "The neighbor's cat who adopted us every Sunday." },
        { photo: "07.svg", text: "Our little family." },
      ],
    },
    {
      id: "funny-moons",
      name: "Funny Moons",
      position: [378, -158, 382],
      planetScale: [1.2, 2.1],
      memories: [
        { photo: "01.svg", date: "2021", text: "You, mid-sneeze. I'm never deleting this." },
        { photo: "02.svg", date: "April 2020", place: "Bathroom salon", text: "The haircut I gave you during lockdown. Sorry." },
        { photo: "03.svg", date: "2022", text: "Sunglasses on upside down, and you didn't notice for an hour." },
        { photo: "04.svg", date: "August 2022", place: "Pier", text: "That time the seagull stole your sandwich." },
        { photo: "05.svg", date: "2023", place: "Photo booth", text: "Your 'serious' passport photo." },
        { photo: "06.svg", text: "We laugh at the same stupid things. That's love." },
      ],
    },
    {
      id: "special-days",
      name: "Ring of Special Days",
      position: [-64, 208, 166],
      planetScale: [1.9, 3.1],
      memories: [
        { photo: "01.svg", date: "2021", text: "The first holiday we spent together. I was so nervous about the gift." },
        { photo: "02.svg", date: "2022", text: "The surprise party you totally saw coming." },
        { photo: "03.svg", date: "New Year 2023", text: "Fireworks, wishes, and that look on your face." },
        { photo: "04.svg", date: "2024", place: "By the sea", text: "Our anniversary, by the sea." },
        { photo: "05.svg", date: "Today", place: "Right here", text: "And now, a whole universe.\n\nGo find the star at the center." },
      ],
    },
  ],

  // Songs go in universe/music/. If the list is empty, the music player stays hidden.
  music: [
    { title: "Drifting Through Stars", file: "drifting-through-stars.m4a" },
    { title: "Golden Orbit", file: "golden-orbit.m4a" },
  ],
};
