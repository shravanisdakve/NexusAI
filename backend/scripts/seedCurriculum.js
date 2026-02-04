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
                            {
                                moduleNumber: 1,
                                title: "Complex Numbers",
                                topics: ["Cartesian, polar and exponential form", "De Moivre’s Theorem", "Expansion of sin nθ and cos nθ"],
                                technicalRequirements: "Scientific Calculator",
                                pedagogyFocus: "Conceptual clarity on imaginary units"
                            },
                            {
                                moduleNumber: 2,
                                title: "Partial Differentiation",
                                topics: ["Euler’s Theorem on Homogeneous functions", "Maxima and Minima of functions of two variables"],
                                technicalRequirements: "Symbolic Math Engine",
                                pedagogyFocus: "Visualization of surfaces and stationary points"
                            },
                            {
                                moduleNumber: 3,
                                title: "Matrices",
                                topics: ["Echelon form", "Rank", "Homogeneous and Non-homogeneous systems"],
                                technicalRequirements: "Linear Algebra toolkit",
                                pedagogyFocus: "Foundation for engineering systems"
                            }
                        ]
                    },
                    {
                        subjectCode: "ESC101",
                        name: "Engineering Mechanics",
                        credits: 3,
                        category: "Engineering Science Course",
                        modules: [
                            {
                                moduleNumber: 1,
                                title: "Force Systems",
                                topics: ["Classification of force systems", "Varignon’s Theorem", "Resultant of coplanar forces"],
                                pedagogyFocus: "Vector representation of forces"
                            },
                            {
                                moduleNumber: 2,
                                title: "Equilibrium and Trusses",
                                topics: ["Lami’s Theorem", "Method of Joints", "Method of Sections"],
                                pedagogyFocus: "Static structural analysis"
                            },
                            {
                                moduleNumber: 3,
                                title: "Robot Kinematics",
                                topics: ["Degrees of Freedom (DOF)", "D-H Parameters", "Introduction to Robotic Links"],
                                technicalRequirements: "3D Modeling Visualizer",
                                pedagogyFocus: "Modern applications of mechanics"
                            }
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
                            {
                                moduleNumber: 1,
                                title: "Differential Equations",
                                topics: ["Exact DE", "Integrating factors", "Bernoulli’s equation"],
                                technicalRequirements: "SCILAB for numerical solutions",
                                pedagogyFocus: "System modeling"
                            },
                            {
                                moduleNumber: 2,
                                title: "Multiple Integration",
                                topics: ["Double Integrals", "Triple Integrals", "Change of Order"],
                                technicalRequirements: "3D Plotting",
                                pedagogyFocus: "Volume and surface area calculation"
                            }
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
