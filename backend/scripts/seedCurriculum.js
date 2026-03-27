const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Curriculum = require('../models/Curriculum');

const seedData = [
    {
        branch: "Common for All Branches",
        scheme: "NEP 2024-25",
        semesters: [
            {
                semesterNumber: 1,
                subjects: [
                    {
                        subjectCode: "BSC101",
                        name: "Applied Mathematics-I",
                        credits: 4,
                        category: "Basic Science Course",
                        modules: [
                            { moduleNumber: 1, title: "Complex Numbers", topics: ["Cartesian, polar and exponential form", "De Moivre’s Theorem", "Expansion of sin nθ and cos nθ"], technicalRequirements: "Scientific Calculator", pedagogyFocus: "Conceptual clarity on imaginary units" },
                            { moduleNumber: 2, title: "Partial Differentiation", topics: ["Euler’s Theorem on Homogeneous functions", "Maxima and Minima of functions of two variables"], technicalRequirements: "Symbolic Math Engine", pedagogyFocus: "Visualization of surfaces and stationary points" },
                            { moduleNumber: 3, title: "Matrices", topics: ["Echelon form", "Rank", "Homogeneous and Non-homogeneous systems"], technicalRequirements: "Linear Algebra toolkit", pedagogyFocus: "Foundation for engineering systems" }
                        ]
                    },
                    {
                        subjectCode: "ESC101",
                        name: "Engineering Mechanics",
                        credits: 3,
                        category: "Engineering Science Course",
                        modules: [
                            { moduleNumber: 1, title: "Force Systems", topics: ["Classification of force systems", "Varignon’s Theorem", "Resultant of coplanar forces"], pedagogyFocus: "Vector representation of forces" },
                            { moduleNumber: 2, title: "Equilibrium and Trusses", topics: ["Lami’s Theorem", "Method of Joints", "Method of Sections"], pedagogyFocus: "Static structural analysis" },
                            { moduleNumber: 3, title: "Robot Kinematics", topics: ["Degrees of Freedom (DOF)", "D-H Parameters", "Introduction to Robotic Links"], technicalRequirements: "3D Modeling Visualizer", pedagogyFocus: "Modern applications of mechanics" }
                        ]
                    }
                ]
            },
            {
                semesterNumber: 2,
                subjects: [
                    {
                        subjectCode: "BSC201",
                        name: "Applied Mathematics-II",
                        credits: 4,
                        category: "Basic Science Course",
                        modules: [
                            { moduleNumber: 1, title: "Differential Equations", topics: ["Exact DE", "Integrating factors", "Bernoulli’s equation"], technicalRequirements: "SCILAB for numerical solutions", pedagogyFocus: "System modeling" },
                            { moduleNumber: 2, title: "Multiple Integration", topics: ["Double Integrals", "Triple Integrals", "Change of Order"], technicalRequirements: "3D Plotting", pedagogyFocus: "Volume and surface area calculation" }
                        ]
                    }
                ]
            }
        ]
    },
    {
        branch: "Computer Engineering",
        scheme: "Rev-2019 'C' Scheme",
        semesters: [
            {
                semesterNumber: 3,
                subjects: [
                    {
                        subjectCode: "CSC301",
                        name: "Engineering Mathematics-III",
                        credits: 4,
                        category: "Basic Science Course",
                        modules: [
                            { moduleNumber: 1, title: "Laplace Transform", topics: ["Definition", "Inverse Laplace", "Application to Differential Equations"] },
                            { moduleNumber: 2, title: "Fourier Series", topics: ["Dirichlet’s conditions", "Half-range series"] },
                            { moduleNumber: 3, title: "Complex Variables", topics: ["Analytic functions", "Cauchy-Riemann equations", "Conformal mapping"] }
                        ]
                    },
                    {
                        subjectCode: "CSC302",
                        name: "Data Structures",
                        credits: 4,
                        category: "Core Computer",
                        modules: [
                            { moduleNumber: 1, title: "Introduction", topics: ["Types of Data Structures", "Arrays", "Linked Lists"] },
                            { moduleNumber: 2, title: "Stacks and Queues", topics: ["Stack ADT", "Queue ADT", "Applications"] },
                            { moduleNumber: 3, title: "Trees", topics: ["Binary Trees", "BST", "AVL Trees"] },
                            { moduleNumber: 4, title: "Graphs", topics: ["BFS", "DFS", "Shortest Path"] }
                        ]
                    },
                    {
                        subjectCode: "CSC303",
                        name: "Computer Graphics",
                        credits: 4,
                        category: "Core Computer",
                        modules: [
                            { moduleNumber: 1, title: "Basic Concepts", topics: ["Raster vs Vector", "Display Devices"] },
                            { moduleNumber: 2, title: "Output Primitives", topics: ["Line Drawing Algorithms", "Circle Drawing Algorithms"] },
                            { moduleNumber: 3, title: "Transformations", topics: ["2D and 3D Transformations", "Viewing Pipeline"] }
                        ]
                    }
                ]
            },
            {
                semesterNumber: 4,
                subjects: [
                    {
                        subjectCode: "CSC401",
                        name: "Engineering Mathematics-IV",
                        credits: 4,
                        category: "Basic Science Course",
                        modules: [
                            { moduleNumber: 1, title: "Probability", topics: ["Random Variables", "Distributions"] },
                            { moduleNumber: 2, title: "Sampling Theory", topics: ["Hypothesis Testing", "t-test", "Chi-square"] },
                            { moduleNumber: 3, title: "Linear Algebra", topics: ["Vector Spaces", "Eigenvalues", "Eigenvectors"] }
                        ]
                    },
                    {
                        subjectCode: "CSC402",
                        name: "Analysis of Algorithms",
                        credits: 4,
                        category: "Core Computer",
                        modules: [
                            { moduleNumber: 1, title: "Introduction", topics: ["Asymptotic Notations", "Recurrences"] },
                            { moduleNumber: 2, title: "Divide and Conquer", topics: ["Merge Sort", "Quick Sort", "Strassen's Matrix Multiplication"] },
                            { moduleNumber: 3, title: "Dynamic Programming", topics: ["0/1 Knapsack", "LCS", "Bellman Ford"] },
                            { moduleNumber: 4, title: "Greedy Algorithms", topics: ["Fractional Knapsack", "Huffman Coding", "Dijkstra's Algorithm"] }
                        ]
                    },
                    {
                        subjectCode: "CSC403",
                        name: "Database Management System",
                        credits: 4,
                        category: "Core Computer",
                        modules: [
                            { moduleNumber: 1, title: "Introduction to Databases", topics: ["Database architecture", "Data Models", "ER Diagrams"] },
                            { moduleNumber: 2, title: "Relational Model", topics: ["Relational Algebra", "SQL Queries", "Integrity Constraints"] },
                            { moduleNumber: 3, title: "Normalization", topics: ["1NF, 2NF, 3NF, BCNF", "Functional Dependencies"] },
                            { moduleNumber: 4, title: "Transaction Management", topics: ["ACID Properties", "Concurrency Control", "Recovery"] }
                        ]
                    },
                    {
                        subjectCode: "CSC404",
                        name: "Operating System",
                        credits: 4,
                        category: "Core Computer",
                        modules: [
                            { moduleNumber: 1, title: "Overview", topics: ["Functions of OS", "System Calls"] },
                            { moduleNumber: 2, title: "Process Management", topics: ["Process State", "Scheduling Algorithms", "Threads"] },
                            { moduleNumber: 3, title: "Memory Management", topics: ["Paging", "Segmentation", "Virtual Memory", "Page Replacement"] },
                            { moduleNumber: 4, title: "File Systems", topics: ["File Concepts", "Directory Structure", "Disk Scheduling"] }
                        ]
                    }
                ]
            },
            {
                semesterNumber: 5,
                subjects: [
                    {
                        subjectCode: "CSC501",
                        name: "Theoretical Computer Science",
                        credits: 4,
                        category: "Core Computer",
                        modules: [
                            { moduleNumber: 1, title: "Finite Automata", topics: ["DFA", "NFA", "Regular Expressions"] },
                            { moduleNumber: 2, title: "Context Free Grammar", topics: ["CFG", "Pushdown Automata"] },
                            { moduleNumber: 3, title: "Turing Machines", topics: ["Standard TM", "Decidability", "Halting Problem"] }
                        ]
                    },
                    {
                        subjectCode: "CSC502",
                        name: "Software Engineering",
                        credits: 4,
                        category: "Core Computer",
                        modules: [
                            { moduleNumber: 1, title: "Process Models", topics: ["Waterfall", "Agile", "Scrum"] },
                            { moduleNumber: 2, title: "Requirement Engineering", topics: ["SRS", "Use Cases"] },
                            { moduleNumber: 3, title: "Software Design", topics: ["Architecture", "UML Modeling"] },
                            { moduleNumber: 4, title: "Testing", topics: ["Unit Testing", "Integration Testing", "System Testing"] }
                        ]
                    },
                    {
                        subjectCode: "CSC503",
                        name: "Computer Network",
                        credits: 4,
                        category: "Core Computer",
                        modules: [
                            { moduleNumber: 1, title: "Introduction", topics: ["OSI Model", "TCP/IP Model"] },
                            { moduleNumber: 2, title: "Data Link Layer", topics: ["Error Detection", "MAC Protocols"] },
                            { moduleNumber: 3, title: "Network Layer", topics: ["IPv4", "IPv6", "Routing Algorithms"] },
                            { moduleNumber: 4, title: "Transport and App Layer", topics: ["TCP", "UDP", "HTTP", "DNS"] }
                        ]
                    }
                ]
            }
        ]
    }
];

const seedCurriculum = async () => {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!uri) {
            console.error("Error: MONGO_URI and MONGODB_URI are both undefined.");
            console.log("Loaded Environment Variables:", Object.keys(process.env).filter(k => k.includes('MONGO')));
            process.exit(1);
        }
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");

        await Curriculum.deleteMany({}); // Clear existing
        await Curriculum.insertMany(seedData);

        console.log("Curriculum Data Seeded Successfully!");
        process.exit();
    } catch (err) {
        console.error("Seeding Error:", err);
        process.exit(1);
    }
};

seedCurriculum();
