// ============================================================
//  SIRF YEH FILE EDIT KARNI HAI — poora portfolio yahin se banta hai.
//  Har "section" = ek green pipe. Order wahi rahega jo yahan likha hai.
//  `label` pipe ke upar dikhta hai (chhota, CAPITAL, max ~14 characters).
// ============================================================

export type Item = {
  title: string;
  subtitle?: string;
  period?: string;
  description?: string;
  bullets?: string[];
  tags?: string[];
  link?: { label: string; href: string };
};

export type Section = {
  id: string;
  label: string;
  title: string;
  items: Item[];
};

export const profile = {
  name: "PARTHAVA BORAH",
  role: "SOFTWARE ENGINEER | AI ENGINEER",
  tagline:
    "Walk, jump and dive into the green pipes to explore my resume. Grab coins and bump the gem blocks on the way!",
  resumeUrl: "/resume.pdf",
};

export const sections: Section[] = [
  {
    id: "about",
    label: "ABOUT ME",
    title: "Professional Summary",
    items: [
      {
        title: "Software Engineer | AI Engineer",
        description:
          "Software Engineer with experience in full-stack web application development using React.js, Node.js, Express.js, NestJS, and MongoDB/PostgreSQL. Skilled in manual testing, REST API testing using Postman, Jira, and test case design. Passionate about building reliable, scalable, and high-quality software solutions. Seeking opportunities as a Software Engineer or AI Engineer.",
      },
    ],
  },
  {
    id: "experience",
    label: "WORK EXP",
    title: "Work Experience",
    items: [
      {
        title: "Programmer Analyst Trainee",
        subtitle: "TechVariable",
        period: "Sept 2021 - Apr 2022",
        bullets: [
          "Developed and maintained full-stack web applications using React.js and NestJS.",
          "Designed and implemented REST APIs for business applications.",
          "Performed API testing using Postman.",
          "Wrote and executed manual test cases.",
          "Logged, tracked, and verified defects using Jira.",
          "Collaborated with developers to reproduce, troubleshoot, and resolve software defects before release.",
        ],
        tags: ["React.js", "NestJS", "REST APIs", "Postman", "Jira"],
      },
      {
        title: "Career Break - Civil Services Examination Preparation",
        period: "May 2022 - Present",
        bullets: [
          "Prepared full-time for competitive Civil Services examinations, strengthening analytical, research, problem-solving, and time-management skills.",
          "Now transitioning back to software engineering and quality assurance, with a focus on applying my previous development and testing experience.",
        ],
      },
    ],
  },
  {
    id: "education",
    label: "EDUCATION",
    title: "Educational Qualification",
    items: [
      {
        title: "B.Tech (Hons.), Computer Science & Engineering",
        subtitle: "Girijananda Chowdhury Institute Of Management And Technology",
        period: "2015 - 2020",
        description: "CGPA: 6.38/10",
      },
      {
        title: "Senior Secondary (XII), Science",
        subtitle: "Biswanath College (Under AHSEC)",
        period: "2015",
        description: "63.60%",
      },
      {
        title: "Secondary (X)",
        subtitle: "Little Star School (Under SEBA)",
        period: "2013",
        description: "70.33%",
      },
    ],
  },
  {
    id: "skills",
    label: "SKILLS",
    title: "Skills",
    items: [
      { title: "Languages", tags: ["JavaScript", "TypeScript", "Python", "C", "C++"] },
      { title: "Frontend", tags: ["React.js", "Redux", "HTML", "CSS", "Bootstrap"] },
      { title: "Backend", tags: ["Node.js", "Express.js", "NestJS", "Flask"] },
      { title: "Databases", tags: ["MongoDB", "PostgreSQL", "MySQL"] },
      {
        title: "Testing",
        tags: ["Manual Testing", "Postman", "Test Case Design", "Jira"],
      },
      { title: "Tools", tags: ["Git", "GitHub", "Prisma"] },
      { title: "AI Technologies", tags: ["LangChain", "LangGraph", "RAG", "MCP"] },
    ],
  },
  {
    id: "projects",
    label: "PROJECTS",
    title: "Projects",
    items: [
      {
        title: "Agentic AI Exam Prep Assistant",
        tags: ["FastAPI", "LangChain", "ChromaDB", "Next.js"],
        bullets: [
          "Developed a full-stack Agentic RAG application that uses LLM-based intent classification to dynamically route queries to specific tools (ChromaDB for PYQ retrieval, Tavily for live news, and LLM for general reasoning).",
          "Designed a reasoning pipeline for solving specific exam questions by extracting metadata, performing vector lookups, and generating detailed explanations.",
          "Built a highly responsive Next.js frontend featuring custom MCQ card rendering, dark mode, and seamless API integration.",
        ],
      },
      {
        title: "HR Management System",
        tags: ["React.js", "NestJS", "MongoDB"],
        bullets: [
          "Developed a full-stack HR management application with modules for Employee Records, Leave Management, Attendance, Performance Evaluation, and Event Management.",
          "Designed and implemented RESTful APIs using NestJS for employee and HR operations.",
          "Integrated MongoDB for secure storage and retrieval of organizational data.",
          "Performed API testing using Postman and validated application functionality through manual testing.",
          "Wrote and executed test cases to verify key business workflows and ensure application quality.",
        ],
      },
      {
        title: "Document Management System",
        tags: ["React.js", "NestJS", "PostgreSQL", "Prisma ORM"],
        bullets: [
          "Developed a document management system supporting document upload, version control, and document tracking.",
          "Built backend APIs using NestJS and managed relational data using PostgreSQL with Prisma ORM.",
          "Performed REST API testing using Postman to validate CRUD operations and business logic.",
          "Executed functional and regression testing to verify document lifecycle and version management features.",
        ],
      },
      {
        title: "College Website & Administration Portal",
        tags: ["Flask", "MySQL", "HTML", "CSS", "Bootstrap"],
        bullets: [
          "Developed backend modules for student admissions and website administration using Flask.",
          "Designed and integrated MySQL database for managing student and administrative records.",
          "Tested application functionality, validated form inputs, and verified backend API responses.",
        ],
      },
      {
        title: "Learning Management System (LMS)",
        tags: ["React.js", "Redux", "Node.js", "Express.js", "MongoDB"],
        bullets: [
          "Developed a full-stack Learning Management System (LMS) for managing online courses, users, and learning resources.",
          "Built responsive user interfaces using React.js and managed application state efficiently with Redux.",
          "Developed RESTful APIs using Node.js and Express.js for user authentication, course management, and content delivery.",
          "Integrated MongoDB for storing user profiles, course details, enrollments, and learning progress.",
          "Performed API testing using Postman and validated application functionality through manual testing.",
          "Implemented input validation, authentication, and error handling to improve application reliability and user experience.",
        ],
      },
      {
        title: "Flower Image Classification",
        tags: ["Python", "Tkinter"],
        bullets: [
          "Developed an image classification application using the Flower17 dataset with data augmentation techniques.",
          "Built a desktop GUI using Tkinter for image selection and prediction.",
          "Improved classification performance by applying preprocessing and augmentation methods.",
          "Evaluated model performance using multiple test images.",
        ],
      },
    ],
  },
  {
    id: "contact",
    label: "CONTACT",
    title: "Contact",
    items: [
      {
        title: "Email",
        link: { label: "parthavaborah@gmail.com", href: "mailto:parthavaborah@gmail.com" },
      },
      {
        title: "Phone",
        link: { label: "+91 60012 86467", href: "tel:+916001286467" },
      },
      {
        title: "GitHub",
        link: { label: "github.com/Parthava", href: "https://github.com/Parthava" },
      },
      {
        title: "LinkedIn",
        link: {
          label: "linkedin.com/in/parthava-borah-98253713a",
          href: "https://www.linkedin.com/in/parthava-borah-98253713a",
        },
      },
    ],
  },
];
