/*
  EVERYTHING YOU WOULD WANT TO EDIT LIVES HERE.
  Change text in this file and the whole site (3D scene included) updates.

  projects: list newest first. The first project gets the orbit closest to the
  sun, so distance from the sun shows how recent the work is.
    surface: ocean, rust, banded, ringed, ice or lava.
    size:    relative planet size, about 0.02 to 0.05.
    links:   buttons under the project. Leave the list empty to show none.

  moon.interests: planets orbiting the moon.
    surface: bleach, blaugrana, kombat, vinyl, lava, ocean, rust, banded or ice.

  experience.roles: each role becomes a mini star around the big bright star.
    short: label beside the star. color: the star's colour.
*/
export const SITE = {
  name: "Testimony Charles",
  rocketName: "Remi",   // painted down the side of the rocket
  sun: {
    title: "Me, by day",
    intro: "",
    facts: [
      ["School", "University of Prince Edward Island"],
      ["Studying", "Computer Science"],
      ["Year", "2nd year, co-op student"],
      ["Now", "Tryna get through the semester lol!"],
    ],
  },
  moon: {
    title: "Me, after hours",
    intro: "When the work is done, you'll find me watching anime and movies, playing soccer, on a console or listening to music.",
    // Planets orbiting the moon. surface: bleach, blaugrana, kombat, vinyl, lava, ocean, rust, banded or ice. size: about 0.03 to 0.06.
    interests: [
      { name: "Anime & Movies", summary: "My favourite anime is Bleach.", surface: "bleach", size: .052, color: "#ff6a5c" },
      { name: "Soccer", summary: "I love playing soccer. My favourite team of all time was 09 Barca.", surface: "blaugrana", size: .05, color: "#c9405f" },
      { name: "Games", summary: "I like playing games, console specifically. My favourite is Mortal Kombat.", surface: "kombat", size: .054, color: "#f0b23e" },
      { name: "Music", summary: "I like listening to music, secular and gospel. My favourite gospel artist is Dunsin Oyekan.", surface: "vinyl", size: .042, color: "#b9a7ff" },
    ],
  },
  experience: {
    // Each role becomes a mini star around the big star. short is the label beside the star; color is the star's colour.
    roles: [
      { short: "Best Buy", color: "#8fc3ff", role: "Omnichannel Specialist", place: "Best Buy", dates: "Aug 2026 – Present", points: [
        "Supported 50+ customers daily across online orders, pickup, shipping, returns, and truck delivery by providing product guidance and resolving concerns",
        "Reduced order waiting time by 23% while coordinating online orders, pickups, and truck deliveries across channels",
        "Generated $54,300 in a single month as the North Atlantic Canada region's highest-ever revenue generator, with a 20% Best Buy Protection (BBP) attach rate, by identifying customer needs and recommending suitable products",
      ] },
      { short: "Teaching Assistant", color: "#ffd07a", role: "Teaching Assistant", place: "University of Prince Edward Island, Charlottetown, PE", dates: "Aug 2026 – Present", points: [
        "Supported 70+ students across introductory computer science courses covering object-oriented programming, data structures, and Unix/Linux development through weekly labs, office hours, and one-on-one assistance",
        "Guided students through debugging of logical, syntax, and runtime errors in Python and Java using UNIX/Linux, IntelliJ, PyCharm, and Jupyter Notebook by applying structured problem-solving",
        "Evaluated 120+ programming assignments, giving targeted feedback on code quality, correctness, and problem-solving approach to strengthen students' subsequent submissions",
        "Developed supplemental exercises and review materials on object-oriented design, recursion, searching and sorting, and data structures (linked lists, stacks, queues), contributing to a 37% increase in the average score of improving students versus the previous semester",
      ] },
      { short: "SMCSS", color: "#a7f0dd", role: "Logistics Executive Coordinator", place: "School of Mathematical and Computational Sciences Society (SMCSS)", dates: "Jun 2026 – Present", points: [
        "Increased SMCSS event traffic by 35%, attracting 150+ additional student interactions through targeted event promotion, logistical coordination, and cross-team outreach",
        "Expanded student engagement by 28% across club initiatives by coordinating promotional efforts, improving event visibility, and streamlining communication between executive teams",
        "Supported 10+ student events with 300+ total attendees by coordinating logistics, scheduling, and operational requirements",
      ] },
      { short: "AWP Safety First", color: "#ffb086", role: "Flagger", place: "AWP Safety First", dates: "Apr 2026 – Aug 2026", points: [
        "Directed 200+ vehicles daily through construction zones using hand signals and crew radio communication while responding to driver concerns and close calls",
        "Maintained zero incidents across shifts by performing safety checks and setting up and removing signs, cones, and barriers per regulations",
      ] },
      { short: "Wendy's", color: "#ff9fa8", role: "Crew Member", place: "Wendy's, 643 University Avenue", dates: "Jan 2026 – Jun 2026", points: [
        "Served 70+ customers daily while maintaining order accuracy during rush hours by working across fry, grill, counter, and drive-thru stations",
        "Improved order-ready speed by 12% and trained new hires on station workflow and food safety standards",
      ] },
      { short: "Hack with SMCSS", color: "#c9b5ff", role: "Technical Support Volunteer & Volunteer Designer", place: "Hack with SMCSS", dates: "Jan 2026", points: [
        "Provided technical support to a hackathon of roughly 200 attendees by troubleshooting technical issues as they arose during the event",
        "Prepared the event's technical setup and helped participating teams resolve technical blockers",
        "Designed 10+ posters and social media graphics used for sign-up promotion and advertising",
      ] },
      { short: "Charles Oboh & Co.", color: "#fff0b8", role: "Customer Service & Sales Associate", place: "Charles Oboh & Co. (Estate Surveyors & Valuers)", dates: "Nov 2024 – Dec 2025", points: [
        "Served 40–50 clients daily across property valuation, letting and management, sales and purchase, and project supervision, including field valuations",
        "Sold properties valued in the millions of naira, building trust and confidence with the company's board of directors",
        "Secured repeat tenants through consistent follow-ups on lettings and property management",
      ] },
      { short: "Petra Church", color: "#ffc0e3", role: "Design Team & Care and Facilities Team Member", place: "Petra Church, Head Campus", dates: "Nov 2024 – Dec 2025", points: [
        "Produced weekly carousels, slide decks, flyers, logos, and posters promoting events of 2,000+ attendees by collaborating with the design team",
        "Supported 4,000+ attendees at services and events by providing directions, information, and assistance in a clean, welcoming facility",
      ] },
      { short: "Graphic Design", color: "#b6f58f", role: "Freelance Graphic Designer", place: "Self-Employed", dates: "2024 – Present", points: [
        "Designed logos, social media graphics, and event flyers in Canva for 30+ clients, growing the client base through referrals while retaining repeat clients",
      ] },
      { short: "Math Tutor", color: "#9fe6ff", role: "Math Tutor", place: "Community / Academic Support Program", dates: "2024 – 2025", points: [
        "Tutored classes of 20+ students, 3 days a week, contributing to a 42% improvement in average final grades versus the previous semester",
      ] },
    ],
  },
  contact: {
    intro: "",
    email: "charlestesty474@gmail.com",
    links: [
      { label: "GitHub", icon: "github", url: "https://github.com/Remi-taichou" },
      { label: "LinkedIn", icon: "linkedin", url: "https://www.linkedin.com/in/testimony-charles-658b2333a" },
    ],
  },
  projects: [
    { name: "Personal Portfolio Website", year: "2026", stack: "HTML, CSS, GitHub Pages", surface: "ocean", size: .036, color: "#7cc0ee",
      links: [{ label: "View site", url: "https://remi-taichou.github.io/Portfolio" }], points: [
        "Designed and built a personal developer portfolio to showcase web development and design projects, applying HTML/CSS fundamentals",
        "Structured site content using core HTML concepts including page layout, semantic tags, attributes, images, and tables",
        "Deployed via GitHub Pages, with ongoing refinement of site copy and design ahead of full launch",
      ] },
    { name: "Beat the Quantum", year: "2026", stack: "Python, Qiskit, Streamlit, Pandas, Git, GitHub", surface: "ringed", size: .042, color: "#efdda9",
      links: [{ label: "Play the game", url: "https://beatthequantum.streamlit.app" }, { label: "View code", url: "https://github.com/Remi-taichou/Quollab-Hackathon" }], points: [
        "Built a CHSH game for the Qollab Quantum Hackathon: entangled qubits reach ~85% win rate vs. the 75% classical limit",
        "Ran Bell-pair circuits on IonQ's cloud simulator via Qiskit and used the measured shots to drive the game",
        "Built a Streamlit app with live win-rate and per-input charts; open-sourced under MIT with a demo video",
      ] },
    { name: "Activate Arcade Website", year: "2026", stack: "HTML, CSS, Linux, SSH/SCP, Git, GitHub Pages", surface: "banded", size: .05, color: "#e6bf92",
      links: [{ label: "View site", url: "https://remi-taichou.github.io/activate-arcade-site/" }], points: [
        "Built a 4-page HTML/CSS website incorporating forms, tables, and picture-based navigation, achieving full marks in the Web Development course",
        "Structured and styled multiple pages for consistent layout and navigation across the site",
        "Deployed the site to a Linux server via SSH/SCP and to GitHub Pages, managing version history with Git and GitHub",
      ] },
  ],
};
